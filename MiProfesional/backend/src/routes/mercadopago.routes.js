const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { handleWebhook } = require('../services/paymentService');
const Payment = require('../models/Payment');
const PaymentAudit = require('../models/PaymentAudit');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════
// RUTA WEBHOOK - PÚBLICA (sin autenticación)
// Mercado Pago envía notificaciones aquí
// ═══════════════════════════════════════════════════════════
router.post('/webhook', async (req, res) => {
  // Usar el servicio de procesamiento completo
  await handleWebhook(req, res);
});

// Ruta de verificación GET (para health checks)
router.get('/webhook', (req, res) => {
  res.status(200).json({ 
    ok: true, 
    message: 'Webhook endpoint activo',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ═══════════════════════════════════════════════════════════
// RUTAS PROTEGIDAS (requieren autenticación)
// ═══════════════════════════════════════════════════════════

// Obtener estado de un pago por ID de MP
router.get('/payment/:mpPaymentId', authenticate, async (req, res) => {
  try {
    const { mpPaymentId } = req.params;
    
    const payment = await Payment.findByMpId(mpPaymentId);
    
    if (!payment) {
      return res.status(404).json({
        ok: false,
        message: 'Pago no encontrado'
      });
    }
    
    res.json({
      ok: true,
      payment: {
        id: payment._id,
        mpPaymentId: payment.mpPaymentId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        type: payment.type,
        dateCreated: payment.dateCreated,
        dateApproved: payment.dateApproved,
        processed: payment.processed
      }
    });
  } catch (error) {
    logger.error('Error consultando pago:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener pagos por referencia externa
router.get('/payment/reference/:externalReference', authenticate, async (req, res) => {
  try {
    const { externalReference } = req.params;
    
    const payment = await Payment.findByExternalReference(externalReference);
    
    if (!payment) {
      return res.status(404).json({
        ok: false,
        message: 'Pago no encontrado'
      });
    }
    
    res.json({
      ok: true,
      payment
    });
  } catch (error) {
    logger.error('Error consultando pago por referencia:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// Listar pagos de un usuario
router.get('/payments/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      ok: true,
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error listando pagos:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// Estadísticas de pagos
router.get('/payments/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Calcular métricas adicionales
    const successfulPayments = stats.find(s => s._id === 'approved')?.count || 0;
    const failedPayments = stats.find(s => s._id === 'rejected')?.count || 0;
    const totalRevenue = totalAmount[0]?.total || 0;
    const averageTicket = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;
    
    res.json({
      ok: true,
      stats: {
        byStatus: stats,
        totalPayments,
        totalRevenue,
        successfulPayments,
        failedPayments,
        averageTicket: Math.round(averageTicket * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// Métricas detalladas para el dashboard
router.get('/payments/metrics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    // Calcular fechas según el período
    const now = new Date();
    let startDate;
    let groupFormat;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$dateCreated' } };
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 semanas
        groupFormat = { $dateToString: { format: '%Y-W%U', date: '$dateCreated' } };
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 meses
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$dateCreated' } };
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$dateCreated' } };
    }
    
    // Agregación de ingresos por período
    const dailyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'approved',
          dateCreated: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: groupFormat,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      ok: true,
      period,
      dailyRevenue: dailyRevenue.map(d => ({
        date: d._id,
        total: Math.round(d.total * 100) / 100,
        count: d.count
      }))
    });
  } catch (error) {
    logger.error('Error obteniendo métricas:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

// Log de auditoría de pagos
router.get('/payments/audit', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      paymentId, 
      userId, 
      event, 
      startDate, 
      endDate,
      limit = 50 
    } = req.query;
    
    const query = {};
    
    if (paymentId) query.paymentId = paymentId;
    if (userId) query.userId = userId;
    if (event) query.event = event;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const audit = await PaymentAudit.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      ok: true,
      audit: audit.map(a => ({
        event: a.event,
        paymentId: a.paymentId,
        externalReference: a.externalReference,
        userId: a.userId,
        status: a.status,
        amount: a.amount,
        timestamp: a.timestamp,
        success: a.success
      }))
    });
  } catch (error) {
    logger.error('Error obteniendo auditoría:', error);
    res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
