const cron = require('node-cron');
const User = require('../models/User');
const logger = require('../utils/logger');

async function suspendExpiredSubscriptions() {
  try {
    const now = new Date();
    const result = await User.updateMany(
      {
        'subscription.status': 'active',
        'subscription.endDate': { $lte: now },
        'subscription.plan': { $ne: 'free' }
      },
      {
        $set: {
          'subscription.status': 'suspended'
        }
      }
    );

    if (result.modifiedCount > 0) {
      logger.info('Subscription cron: expired subscriptions suspended', {
        modifiedCount: result.modifiedCount
      });
    }
  } catch (error) {
    logger.error('Subscription cron error suspending expired', {
      error: error.message
    });
  }
}

function startSubscriptionCron() {
  suspendExpiredSubscriptions();
  cron.schedule('0 0 * * *', () => {
    suspendExpiredSubscriptions();
  });
  logger.info('Subscription cron started: runs on startup and daily at midnight');
}

module.exports = { startSubscriptionCron, suspendExpiredSubscriptions };
