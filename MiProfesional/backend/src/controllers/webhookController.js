const { MercadoPagoConfig, Payment } = require('mercadopago');
const User = require('../models/User');
const Professional = require('../models/Professional');
const { getPlan } = require('../config/plans');
const logger = require('../utils/logger');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 10000 }
});

const paymentClient = new Payment(client);

async function handleWebhook(req, res) {
  try {
    const { type, data } = req.body;
    logger.info('Payment webhook received', { type, data });

    if (type !== 'payment') {
      return res.status(200).json({ ok: true });
    }

    const paymentId = data.id;
    const mpPayment = await paymentClient.get({ id: paymentId });
    const status = mpPayment.status;
    const metadata = mpPayment.metadata || {};
    const externalReference = mpPayment.external_reference;

    logger.info('Payment details', {
      paymentId,
      status,
      metadata,
      externalReference
    });

    if (status === 'approved') {
      const userId = metadata.userId;
      const plan = metadata.plan;
      const durationDays = parseInt(metadata.durationDays, 10) || 30;
      const userRole = metadata.userRole || '';

      if (!userId || !plan) {
        logger.warn('Missing userId or plan in payment metadata', { paymentId, metadata });
        return res.status(200).json({ ok: true });
      }

      const planConfig = getPlan(plan);
      if (!planConfig) {
        logger.warn('Invalid plan in payment metadata', { paymentId, plan });
        return res.status(200).json({ ok: true });
      }

      const now = new Date();
      const startDate = new Date(now);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      const user = await User.findById(userId);
      if (!user) {
        logger.warn('User not found for payment', { paymentId, userId });
        return res.status(200).json({ ok: true });
      }

      const previousPlan = user.subscription?.plan || 'free';

      user.subscription = {
        plan: plan,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        lastPaymentId: String(paymentId),
        autoRenew: user.subscription?.autoRenew || false
      };
      await user.save();

      logger.info('Subscription activated via payment', {
        userId,
        plan,
        userRole: user.role,
        previousPlan,
        startDate,
        endDate,
        paymentId
      });

      if (user.role === 'professional' || userRole === 'professional') {
        const professional = await Professional.findOne({ userId });
        if (professional) {
          professional.subscription = {
            ...(professional.subscription || {}),
            status: 'active',
            plan: plan,
            lastPayment: new Date(),
            nextBilling: endDate,
            activatedAt: startDate,
          };
          professional.isActive = true;
          professional.profileStatus = 'ACTIVE';
          await professional.save();
          logger.info('Professional profile activated from webhook', { userId, plan });
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(200).json({ ok: true });
  }
}

module.exports = { handleWebhook };
