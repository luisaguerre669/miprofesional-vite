const User = require('../models/User');
const logger = require('../utils/logger');

async function checkSubscription(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('subscription isActive role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
    }
    if (user.role === 'client') {
      return next();
    }
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
      logger.info('Subscription auto-suspended', { userId: req.userId, role: user.role, plan: user.subscription.plan });
      return res.status(403).json({
        success: false,
        message: 'Suscripción vencida. Renueva tu plan para acceder.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    req.authUser = user;
    next();
  } catch (error) {
    logger.error('Check subscription error:', error);
    return res.status(500).json({ success: false, message: 'Error verificando suscripción' });
  }
}

module.exports = { checkSubscription };
