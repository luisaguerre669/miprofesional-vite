const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

async function runBackup() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('[BACKUP] No MONGODB_URI / MONGO_URI configured');
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbName = uri.split('/').pop().split('?')[0] || 'miprofesional';
  const filename = `${dbName}_${timestamp}.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  const cmd = `mongodump --uri="${uri}" --archive="${filepath}" --gzip`;

  console.log(`[BACKUP] Starting backup of "${dbName}"...`);

  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('[BACKUP] FAILED:', err.message);
        reject(err);
        return;
      }
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`[BACKUP] Completed: ${filename} (${sizeMB} MB)`);

      const maxAge = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
      const cutoff = Date.now() - maxAge * 24 * 60 * 60 * 1000;
      fs.readdirSync(BACKUP_DIR).forEach(f => {
        const fp = path.join(BACKUP_DIR, f);
        if (f.startsWith(dbName) && fs.statSync(fp).mtimeMs < cutoff) {
          fs.unlinkSync(fp);
          console.log(`[BACKUP] Removed old backup: ${f}`);
        }
      });

      resolve({ filename, sizeMB, filepath });
    });
  });
}

if (require.main === module) {
  runBackup()
    .then(() => { process.exit(0); })
    .catch(() => { process.exit(1); });
}

module.exports = { runBackup };
