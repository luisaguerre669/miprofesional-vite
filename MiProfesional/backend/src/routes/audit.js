const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { event, userId, page = 1, limit = 50 } = req.query;
    const query = {};
    if (event) query.event = event;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit), 200))
      .skip((Math.max(parseInt(page), 1) - 1) * parseInt(limit))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Error al obtener logs de auditoría:', error);
    res.status(500).json({ success: false, message: 'Error al obtener logs de auditoría' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { since } = req.query;
    const dateSince = since ? new Date(since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: dateSince } } },
      { $group: { _id: '$event', count: { $sum: 1 }, last: { $max: '$timestamp' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Error al obtener resumen de eventos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener resumen de eventos' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const [loginCount, searchCount, paymentCount, subscriptionCount, uniqueUsers, blockedCount] = await Promise.all([
      AuditLog.countByEvent('login', since),
      AuditLog.countByEvent('cv_search', since),
      AuditLog.countByEvent('payment_success', since),
      AuditLog.countDocuments({ event: /^subscription_/, timestamp: { $gte: since } }),
      AuditLog.distinct('userId', { timestamp: { $gte: since } }).then(u => u.filter(Boolean).length),
      AuditLog.countByEvent('user_blocked', since)
    ]);

    res.json({
      success: true,
      data: { days: parseInt(days), since, loginCount, searchCount, paymentCount, subscriptionCount, uniqueUsers, blockedCount }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas de auditoría:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas de auditoría' });
  }
});

module.exports = router;
