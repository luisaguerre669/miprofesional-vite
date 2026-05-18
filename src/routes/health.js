const express = require('express');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  const checks = {
    server: { status: 'ok', uptime: process.uptime(), nodeVersion: process.version, memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB` },
    database: { status: dbState === 1 ? 'ok' : 'error', state: dbStates[dbState] || 'unknown' },
    logs: logger.getLogStats() || { totalLines: 0 }
  };

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  res.status(allOk ? 200 : 503).json({
    success: allOk,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    checks,
    recentErrors: logger.getRecentErrors(5)
  });
});

router.get('/debug', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Se requiere autenticacion' });
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      const User = require('../models/User');
      const user = await User.findById(decoded.userId || decoded.id).select('role');
      if (!user || user.role !== 'admin') return res.status(403).json({ success: false, message: 'Se requiere rol admin' });
    } catch { return res.status(401).json({ success: false, message: 'Token invalido' }); }
  }

  const stats = logger.getStats();
  res.json({
    success: true,
    ...stats,
    envVars: Object.keys(process.env).filter(k => !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('token') && !k.toLowerCase().includes('key') && !k.toLowerCase().includes('password')).reduce((a, k) => ({ ...a, [k]: process.env[k] }), {})
  });
});

module.exports = router;
