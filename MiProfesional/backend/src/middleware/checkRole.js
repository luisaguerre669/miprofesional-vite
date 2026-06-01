const User = require('../models/User');
const logger = require('../utils/logger');
const { PLANS } = require('../config/plans');

function checkRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId).select('role subscription isActive');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
      }
      const normalizedRoles = allowedRoles.map(r => r.toLowerCase());
      if (normalizedRoles.includes('admin') && user.role === 'admin') {
        return next();
      }
      if (!normalizedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}.`
        });
      }
      if (user.role !== 'client') {
        if (user.subscription.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'Suscripción suspendida. Renueva tu plan para acceder.',
            code: 'SUBSCRIPTION_SUSPENDED'
          });
        }
        if (user.subscription.endDate && new Date(user.subscription.endDate) < new Date()) {
          user.subscription.status = 'suspended';
          await user.save();
          logger.info('Role check: subscription auto-suspended', { userId: req.userId, role: user.role });
          return res.status(403).json({
            success: false,
            message: 'Suscripción vencida. Renueva tu plan para acceder.',
            code: 'SUBSCRIPTION_EXPIRED'
          });
        }
        if ((user.role === 'company' || user.role === 'employer') &&
            !normalizedRoles.includes('admin') &&
            (user.subscription.plan === 'free' || !user.subscription.plan)) {
          return res.status(403).json({
            success: false,
            message: 'Se requiere un plan de suscripción. Activá tu plan para acceder.',
            code: 'SUBSCRIPTION_REQUIRED'
          });
        }
      }
      req.authUser = user;
      next();
    } catch (error) {
      logger.error('Check role error:', error);
      return res.status(500).json({ success: false, message: 'Error verificando permisos' });
    }
  };
}

module.exports = { checkRole };
