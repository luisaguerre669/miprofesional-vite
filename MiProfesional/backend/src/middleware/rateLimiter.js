const rateLimit = require('express-rate-limit');
const env = require('../config/environment');

const config = env.getEnvConfig();
const multiplier = config.rateLimitMultiplier || 1;

const searchRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: Math.floor(10 * multiplier),
  keyGenerator: (req) => req.userId || req.ip,
  message: { success: false, error: 'Demasiadas búsquedas. Intenta de nuevo en un minuto.' }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.floor(10 * multiplier),
  message: { success: false, error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Math.floor(5 * multiplier),
  message: { success: false, error: 'Demasiados registros desde esta IP. Intenta de nuevo en una hora.' }
});

module.exports = { searchRateLimiter, authRateLimiter, registerRateLimiter };
