const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // ID del pago en Mercado Pago
  mpPaymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // ID de la preferencia
  preferenceId: {
    type: String,
    required: true,
    index: true
  },
  
  // Referencia externa (nuestro ID interno)
  externalReference: {
    type: String,
    required: true,
    index: true
  },
  
  // Usuario relacionado
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Tipo de pago
  type: {
    type: String,
    enum: ['subscription', 'booking', 'service'],
    required: true
  },
  
  // Estado del pago
  status: {
    type: String,
    enum: ['pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'],
    default: 'pending',
    index: true
  },
  
  // Detalles del pago
  amount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'ARS'
  },
  
  // Descripción del ítem
  description: {
    type: String,
    required: true
  },
  
  // Método de pago
  paymentMethod: {
    id: String,
    type: String,
    issuer: String
  },
  
  // Información del pagador
  payer: {
    id: String,
    email: String,
    identification: {
      type: String,
      number: String
    }
  },
  
  // Fechas importantes
  dateCreated: {
    type: Date,
    default: Date.now
  },
  
  dateApproved: {
    type: Date
  },
  
  dateLastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Metadatos del webhook
  webhookData: {
    action: String,
    apiVersion: String,
    liveMode: Boolean,
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Estado de procesamiento interno
  processed: {
    type: Boolean,
    default: false
  },
  
  // Error si falló el procesamiento
  processingError: {
    message: String,
    stack: String,
    date: Date
  }
}, {
  timestamps: true
});

// Índices compuestos
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ externalReference: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Método para marcar como procesado
paymentSchema.methods.markAsProcessed = async function() {
  this.processed = true;
  this.dateLastUpdated = new Date();
  return this.save();
};

// Método para actualizar estado
paymentSchema.methods.updateStatus = async function(newStatus, mpData = {}) {
  this.status = newStatus;
  this.dateLastUpdated = new Date();
  
  if (newStatus === 'approved') {
    this.dateApproved = new Date();
  }
  
  // Actualizar datos de pago si existen
  if (mpData.payment_method_id) {
    this.paymentMethod.id = mpData.payment_method_id;
    this.paymentMethod.type = mpData.payment_type_id;
  }
  
  if (mpData.payer) {
    this.payer.id = mpData.payer.id;
    this.payer.email = mpData.payer.email;
  }
  
  return this.save();
};

// Static method para buscar por MP ID
paymentSchema.statics.findByMpId = function(mpPaymentId) {
  return this.findOne({ mpPaymentId });
};

// Static method para buscar por referencia externa
paymentSchema.statics.findByExternalReference = function(externalReference) {
  return this.findOne({ externalReference });
};

module.exports = mongoose.model('Payment', paymentSchema);
