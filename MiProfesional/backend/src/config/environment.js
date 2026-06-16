const ENVIRONMENTS = {
  development: {
    label: 'Development',
    allowSeeds: true,
    strictCors: false,
    logLevel: 'debug',
    sendRealEmails: false,
    rateLimitMultiplier: 2
  },
  staging: {
    label: 'Staging',
    allowSeeds: false,
    strictCors: true,
    logLevel: 'info',
    sendRealEmails: true,
    rateLimitMultiplier: 1
  },
  production: {
    label: 'Produccion',
    allowSeeds: false,
    strictCors: true,
    logLevel: 'warn',
    sendRealEmails: true,
    rateLimitMultiplier: 1
  }
};

function getCurrentEnv() {
  return process.env.NODE_ENV || 'development';
}

function getEnvConfig() {
  const env = getCurrentEnv();
  return ENVIRONMENTS[env] || ENVIRONMENTS.development;
}

function validateEnvironment() {
  const env = getCurrentEnv();
  const config = ENVIRONMENTS[env];

  if (!config) {
    throw new Error(`[ENV] Unknown NODE_ENV: "${env}". Must be one of: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  }

  const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];

  if (env === 'production' || env === 'staging') {
    requiredVars.push('CORS_ORIGIN');
  }

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`[ENV] Missing required environment variables for ${env}: ${missing.join(', ')}`);
  }

  if (env === 'production') {
    const { execSync } = require('child_process');
    const isSeed = process.argv.some(a => a.includes('seed'));
    if (isSeed) {
      throw new Error('[ENV] Seeds are BLOCKED in production. Set NODE_ENV=development to run seeds.');
    }
  }

  console.log(`[ENV] Environment: ${env} (${config.label})`);
  return config;
}

function isDevelopment() { return getCurrentEnv() === 'development'; }
function isStaging() { return getCurrentEnv() === 'staging'; }
function isProduction() { return getCurrentEnv() === 'production'; }

module.exports = {
  ENVIRONMENTS,
  getCurrentEnv,
  getEnvConfig,
  validateEnvironment,
  isDevelopment,
  isStaging,
  isProduction
};
