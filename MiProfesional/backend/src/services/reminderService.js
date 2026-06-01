const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const eventBus = require('./eventBus');
const logger = require('../utils/logger');

async function checkSubscriptionReminders() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  try {
    const baseQuery = {
      'subscription.status': 'active',
      'subscription.plan': { $ne: 'free' },
      'subscription.endDate': { $exists: true, $ne: null }
    };

    const [expiringIn7Days, expiringIn1Day, recentlyExpired] = await Promise.all([
      User.find({
        ...baseQuery,
        'subscription.endDate': {
          $exists: true, $ne: null,
          $gte: new Date(now.getTime() - 5 * 60 * 1000),
          $lte: new Date(in7Days.getTime() + 5 * 60 * 1000)
        },
        'subscription.lastReminderSent': { $ne: '7d' }
      }).select('_id name email subscription'),
      User.find({
        ...baseQuery,
        'subscription.endDate': {
          $exists: true, $ne: null,
          $gte: new Date(now.getTime() - 5 * 60 * 1000),
          $lte: new Date(in1Day.getTime() + 5 * 60 * 1000)
        },
        'subscription.lastReminderSent': { $nin: ['7d', '1d'] }
      }).select('_id name email subscription'),
      User.find({
        ...baseQuery,
        'subscription.endDate': { $exists: true, $ne: null, $lte: now }
      }).select('_id name email subscription')
    ]);

    for (const user of expiringIn7Days) {
      logger.logAuth('subscription_reminder_7d', user._id);
      await AuditLog.log({ event: 'subscription_reminder_7d', userId: user._id, metadata: { endDate: user.subscription.endDate } });
      user.subscription.lastReminderSent = '7d';
      await user.save();
    }

    for (const user of expiringIn1Day) {
      logger.logAuth('subscription_reminder_1d', user._id);
      await AuditLog.log({ event: 'subscription_reminder_1d', userId: user._id, metadata: { endDate: user.subscription.endDate } });
      user.subscription.lastReminderSent = '1d';
      await user.save();
    }

    for (const user of recentlyExpired) {
      logger.logAuth('subscription_expired', user._id);
      await AuditLog.log({ event: 'subscription_expired', userId: user._id, metadata: { endDate: user.subscription.endDate } });
      user.subscription.status = 'suspended';
      user.subscription.lastReminderSent = 'expired';
      await user.save();
      eventBus.emit('subscription:expired', { userId: user._id, email: user.email, name: user.name });
    }

    if (expiringIn7Days.length || expiringIn1Day.length || recentlyExpired.length) {
      logger.info(`[Reminders] 7d:${expiringIn7Days.length} 1d:${expiringIn1Day.length} expired:${recentlyExpired.length}`);
    }
  } catch (err) {
    logger.error('[Reminders] Error checking reminders:', err);
  }
}

module.exports = { checkSubscriptionReminders };
