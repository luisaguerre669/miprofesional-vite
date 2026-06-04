const cron = require('node-cron');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const eventBus = require('./eventBus');

async function processExpiredTrials() {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Subscription cron skipped — DB not connected');
    return;
  }

  const Professional = mongoose.model('Professional');
  const now = new Date();

  try {
    const expiredPros = await Professional.find({
      'subscription.status': 'trial',
      'subscription.trialEnd': { $lte: now },
      profileStatus: 'ACTIVE'
    }).populate('userId', 'name email');

    if (expiredPros.length === 0) return;

    const ids = expiredPros.map(p => p._id);

    await Professional.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          'subscription.status': 'suspended',
          profileStatus: 'INACTIVE',
          isActive: false,
        }
      }
    );

    for (const pro of expiredPros) {
      if (pro.userId && pro.userId.email) {
        eventBus.emit('subscription:expired', {
          email: pro.userId.email,
          name: pro.userId.name || pro.businessName || 'Profesional',
        });
      }
    }

    logger.info('Subscription cron: expired trials suspended', {
      modifiedCount: expiredPros.length
    });
  } catch (error) {
    logger.error('Subscription cron error processing expired trials', {
      error: error.message
    });
  }
}

function startSubscriptionCron() {
  // Run immediately on startup
  processExpiredTrials();

  // Then every hour
  cron.schedule('0 * * * *', () => {
    processExpiredTrials();
  });

  logger.info('Subscription cron started: runs on startup and every hour');
}

module.exports = { startSubscriptionCron, processExpiredTrials };
