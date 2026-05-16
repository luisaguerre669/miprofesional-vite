const mongoose = require('mongoose');

const paymentAuditSchema = new mongoose.Schema({
  // Timestamp del evento
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Tipo de evento
  event: {
    type: String,
    required: true,
    enum: [
      'payment.received',
      'payment.validated',
      'payment.processed',
      'payment.approved',
      'payment.rejected',
      'payment.failed',
      'payment.duplicate',
      'subscription.activated',
      'subscription.renewed',
      'subscription.cancelled'
    ],
    index: true
  },
  
  // ID del pago en Mercado Pago
  paymentId: {
    type: String,
    required: true,
    index: true
  },
  
  // Referencia externa
  externalReference: {
    type: String,
    index: true
  },
  
  // Usuario relacionado
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Estado del pago
  status: {
    type: String,
    enum: ['pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back']
  },
  
  // Monto
  amount: {
    type: Number
  },
  
  // Moneda
  currency: {
    type: String,
    default: 'ARS'
  },
  
  // Fuente del evento
  source: {
    type: String,
    enum: ['webhook', 'api', 'manual', 'cron'],
    default: 'webhook'
  },
  
  // Información de seguridad
  ip: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  // Tiempo de procesamiento (ms)
  processingTime: {
    type: Number
  },
  
  // Éxito o fallo
  success: {
    type: Boolean,
    default: true
  },
  
  // Error si falló
  error: {
    message: String,
    stack: String,
    code: String
  },
  
  // Metadata adicional
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Índices compuestos
paymentAuditSchema.index({ timestamp: -1, event: 1 });
paymentAuditSchema.index({ userId: 1, timestamp: -1 });
paymentAuditSchema.index({ paymentId: 1, timestamp: -1 });

// Método estático para crear log
paymentAuditSchema.statics.createLog = async function(data) {
  return this.create({
    timestamp: new Date(),
    ...data
  });
};

// Método para obtener logs recientes
paymentAuditSchema.statics.getRecent = async function(limit = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Método para obtener logs por usuario
paymentAuditSchema.statics.getByUser = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('PaymentAudit', paymentAuditSchema);
