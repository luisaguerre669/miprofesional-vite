const { MercadoPagoConfig, Preference } = require('mercadopago');
const { getPlan, isValidPlan } = require('../config/plans');
const logger = require('../utils/logger');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.miprofesional.online';
const BACKEND_URL = process.env.BACKEND_URL || 'https://miprofesional-backend.onrender.com';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 10000 }
});

async function createPayment(req, res) {
  try {
    const { plan } = req.body;
    if (!plan || !isValidPlan(plan)) {
      return res.status(400).json({ success: false, message: 'Plan inválido. Los planes disponibles son: professional, company' });
    }

    const planConfig = getPlan(plan);
    const externalReference = `sub_${plan}_${req.userId}_${Date.now()}`;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: planConfig.id,
            title: planConfig.name,
            description: planConfig.description,
            quantity: 1,
            currency_id: planConfig.currency,
            unit_price: planConfig.price
          }
        ],
        metadata: {
          userId: String(req.userId),
          plan: plan,
          durationDays: planConfig.durationDays
        },
        payer: {
          email: req.body.email || undefined
        },
        back_urls: {
          success: `${FRONTEND_URL}/payment/success`,
          failure: `${FRONTEND_URL}/payment/failure`,
          pending: `${FRONTEND_URL}/payment/pending`
        },
        auto_return: 'approved',
        notification_url: `${BACKEND_URL}/api/payments/webhook`,
        purpose: 'subscription',
        expires: false
      }
    });

    logger.info('Payment preference created', {
      userId: req.userId,
      plan,
      preferenceId: result.id,
      externalReference
    });

    res.json({
      success: true,
      data: {
        preferenceId: result.id,
        initPoint: result.init_point,
        plan: planConfig.id,
        amount: planConfig.price,
        currency: planConfig.currency,
        durationDays: planConfig.durationDays,
        externalReference
      }
    });
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({ success: false, message: 'Error al crear preferencia de pago' });
  }
}

module.exports = { createPayment };
