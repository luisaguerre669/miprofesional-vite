/**
 * Servicio de procesamiento de pagos de Mercado Pago
 * Incluye verificación de firma y actualización de base de datos
 */

const crypto = require('crypto');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const PaymentModel = require('../models/Payment');
const logger = require('../config/logger');

// Configuración de Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 10000
  }
});

const paymentClient = new Payment(mpClient);

/**
 * Verifica la firma del webhook de Mercado Pago
 * @param {Object} headers - Headers de la solicitud
 * @param {Object} body - Body de la solicitud
 * @returns {boolean} - true si la firma es válida
 */
function verifyWebhookSignature(headers, body) {
  try {
    const signature = headers['x-signature'];
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    if (!signature || !secret) {
      logger.warn('Firma o secreto no configurado, omitiendo verificación');
      return true; // En desarrollo, permitir sin firma
    }
    
    // Mercado Pago usa HMAC SHA256
    const template = `${body.data.id}.${body.type}.${body.date_created}`;
    const cryptedSignature = crypto
      .createHmac('sha256', secret)
      .update(template)
      .digest('hex');
    
    return cryptedSignature === signature;
  } catch (error) {
    logger.error('Error verificando firma:', error);
    return false;
  }
}

/**
 * Consulta el estado del pago en la API de Mercado Pago
 * @param {string} paymentId - ID del pago
 * @returns {Promise<Object>} - Datos del pago
 */
async function getPaymentFromMP(paymentId) {
  try {
    logger.info(`Consultando pago ${paymentId} en Mercado Pago`);
    
    const response = await paymentClient.get({ id: paymentId });
    
    logger.info(`Pago ${paymentId} consultado exitosamente`, {
      status: response.status,
      amount: response.transaction_amount
    });
    
    return response;
  } catch (error) {
    logger.error(`Error consultando pago ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Procesa un pago nuevo o actualización
 * @param {Object} mpData - Datos del pago desde MP
 * @param {Object} webhookData - Datos del webhook
 * @returns {Promise<Object>} - Pago procesado
 */
async function processPayment(mpData, webhookData) {
  try {
    logger.info('Procesando pago:', {
      paymentId: mpData.id,
      status: mpData.status,
      externalReference: mpData.external_reference
    });
    
    // Buscar si ya existe el pago
    let payment = await PaymentModel.findByMpId(mpData.id.toString());
    
    if (!payment) {
      // Crear nuevo registro de pago
      logger.info('Creando nuevo registro de pago');
      
      payment = new PaymentModel({
        mpPaymentId: mpData.id.toString(),
        preferenceId: mpData.preference_id,
        externalReference: mpData.external_reference,
        userId: (mpData.external_reference || '').split('_')[2] || mpData.external_reference?.split('-')[0] || 'unknown',
        type: detectPaymentType(mpData.external_reference),
        status: mpData.status,
        amount: mpData.transaction_amount,
        currency: mpData.currency_id,
        description: mpData.description || 'Pago MiProfesional',
        payer: {
          id: mpData.payer?.id,
          email: mpData.payer?.email
        },
        dateCreated: mpData.date_created,
        webhookData: {
          action: webhookData.action,
          apiVersion: webhookData.api_version,
          liveMode: webhookData.live_mode,
          processedAt: new Date()
        }
      });
    } else {
      // Actualizar pago existente
      logger.info('Actualizando pago existente');
    }
    
    // Actualizar estado
    await payment.updateStatus(mpData.status, mpData);
    
    // Si el pago fue aprobado, activar la suscripción o servicio
    if (mpData.status === 'approved') {
      await activateService(payment);
    }
    
    // Marcar como procesado
    await payment.markAsProcessed();
    
    logger.info('Pago procesado exitosamente', {
      paymentId: payment._id,
      mpPaymentId: payment.mpPaymentId,
      status: payment.status
    });
    
    return payment;
    
  } catch (error) {
    logger.error('Error procesando pago:', error);
    
    // Registrar error en el pago si existe
    if (payment) {
      payment.processingError = {
        message: error.message,
        stack: error.stack,
        date: new Date()
      };
      await payment.save();
    }
    
    throw error;
  }
}

/**
 * Detecta el tipo de pago basado en la referencia externa
 * @param {string} externalReference 
 * @returns {string} - Tipo de pago
 */
function detectPaymentType(externalReference) {
  if (!externalReference) return 'service';
  
  if (externalReference.includes('subscription') || externalReference.includes('sub')) {
    return 'subscription';
  }
  
  if (externalReference.includes('booking') || externalReference.includes('reserva')) {
    return 'booking';
  }
  
  return 'service';
}

/**
 * Activa el servicio correspondiente al pago
 * @param {Object} payment - Documento de pago
 */
async function activateService(payment) {
  try {
    logger.info('Activando servicio para pago:', payment._id);
    
    switch (payment.type) {
      case 'subscription':
        await activateSubscription(payment);
        break;
      case 'booking':
        await confirmBooking(payment);
        break;
      default:
        logger.info('Servicio activado (tipo genérico)');
    }
    
  } catch (error) {
    logger.error('Error activando servicio:', error);
    // No lanzar error para no afectar el procesamiento del pago
  }
}

/**
 * Activa una suscripción de profesional
 * @param {Object} payment 
 */
async function activateSubscription(payment) {
  logger.info('Activando suscripción premium', {
    userId: payment.userId,
    paymentId: payment._id
  });

  try {
    const User = require('../models/User');
    const Professional = require('../models/Professional');

    const refParts = (payment.externalReference || '').split('_');
    const plan = refParts[1] || 'monthly';
    const userId = refParts[2] || payment.userId;
    const isSemester = plan === 'semester';
    const months = isSemester ? 6 : 1;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const user = await User.findById(userId);
    if (user) {
      user.membership = {
        type: 'premium',
        plan,
        expiresAt,
        benefits: isSemester
          ? ['Acceso completo a la plataforma', 'Ahorro del 15%']
          : ['Acceso completo a la plataforma']
      };
      await user.save();
    }

    const professional = await Professional.findOne({ userId });
    if (professional) {
      professional.isActive = true;
      professional.subscription = {
        ...(professional.subscription || {}),
        status: 'active',
        plan,
        lastPayment: new Date(),
        nextBilling: expiresAt,
      };
      await professional.save();
    }

    logger.info('Subscription activated:', { userId, plan, expiresAt, months });
  } catch (error) {
    logger.error('activateSubscription error:', error);
  }
}

/**
 * Confirma una reserva/booking
 * @param {Object} payment 
 */
async function confirmBooking(payment) {
  logger.info('Confirmando reserva', {
    externalReference: payment.externalReference
  });
  
  // Aquí iría la lógica para confirmar la reserva
  // const Booking = require('../models/Booking');
  // await Booking.findOneAndUpdate(
  //   { externalReference: payment.externalReference },
  //   { status: 'confirmed', paymentId: payment._id }
  // );
}

/**
 * Handler principal del webhook
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function handleWebhook(req, res) {
  try {
    const { body, headers } = req;
    
    logger.info('Webhook recibido:', {
      type: body.type,
      action: body.action,
      id: body.data?.id
    });
    
    // Verificar firma (opcional en sandbox)
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(headers, body);
      if (!isValid) {
        logger.error('Firma de webhook inválida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Solo procesar pagos
    if (body.type !== 'payment' && body.type !== 'subscription_preapproval') {
      logger.info('Tipo de webhook no procesado:', body.type);
      return res.status(200).json({ received: true, processed: false });
    }
    
    // Obtener ID del pago
    const paymentId = body.data?.id;
    if (!paymentId) {
      logger.error('ID de pago no encontrado en webhook');
      return res.status(400).json({ error: 'Payment ID not found' });
    }
    
    // Consultar pago en MP (para obtener datos completos)
    const mpPaymentData = await getPaymentFromMP(paymentId);
    
    // Procesar el pago
    const payment = await processPayment(mpPaymentData, body);
    
    return res.status(200).json({
      received: true,
      processed: true,
      paymentId: payment._id,
      status: payment.status
    });
    
  } catch (error) {
    logger.error('Error en webhook handler:', error);
    
    // Siempre responder 200 para que MP no reintente
    // pero indicar que hubo un error
    return res.status(200).json({
      received: true,
      processed: false,
      error: error.message
    });
  }
}

module.exports = {
  handleWebhook,
  verifyWebhookSignature,
  getPaymentFromMP,
  processPayment,
  detectPaymentType,
  activateService,
  activateSubscription,
  confirmBooking
};
