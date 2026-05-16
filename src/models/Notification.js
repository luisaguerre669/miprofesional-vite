// Notification Model - Sistema de notificaciones push
// Modelo para gestionar notificaciones push a usuarios y profesionales

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Información básica
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  },
  
  // Contenido de la notificación
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['general', 'booking', 'message', 'rating', 'system', 'promotion', 'emergency'],
    required: true,
    default: 'general'
  },
  
  // Datos adicionales
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Estado y metadata
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Tokens para envío
  tokens: [{
    type: String,
    required: true
  }],
  results: [{
    token: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    },
    error: String,
    deliveredAt: Date
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  sentAt: Date,
  readAt: Date,
  
  // Metadata
  metadata: {
    isRead: {
      type: Boolean,
      default: false
    },
    retryCount: {
      type: Number,
      default: 0
    },
    expiresAt: Date,
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ professional: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1, createdAt: -1 });
notificationSchema.index({ status: 1, readAt: -1 });
notificationSchema.index({ expiresAt: 1 });

// Virtuals
notificationSchema.virtual('isRead').get(function() {
  return this.status === 'read';
});

notificationSchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered' || this.status === 'read';
});

notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

notificationSchema.virtual('professionalInfo', {
  ref: 'Professional',
  localField: 'professional',
  foreignField: '_id',
  justOne: true
});

// Métodos estáticos
notificationSchema.statics.getUnreadCount = async function(userId, userType = 'user') {
  const query = {
    [userType]: userId,
    status: { $in: ['sent', 'delivered'] },
    readAt: { $exists: false },
    deleted: false
  };
  
  return this.countDocuments(query);
};

notificationSchema.statics.markAsRead = async function(notificationIds) {
  return this.updateMany(
    { _id: { $in: notificationIds } },
    { 
      status: 'read',
      readAt: new Date(),
      'metadata.isRead': true
    }
  );
};

notificationSchema.statics.getRecentNotifications = async function(userId, limit = 20) {
  return this.find({ 
    user: userId,
    deleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('professional', 'businessName')
  .lean();
};

notificationSchema.statics.getCriticalNotifications = async function(userId) {
  return this.find({
    user: userId,
    priority: { $in: ['high', 'urgent'] },
    status: { $in: ['sent', 'delivered'] },
    readAt: { $exists: false },
    deleted: false
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();
};

notificationSchema.statics.getSystemNotifications = async function() {
  return this.find({
    type: 'system',
    deleted: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
};

notificationSchema.statics.sendBulkNotification = async function(recipients, notificationData) {
  const notifications = recipients.map(recipient => ({
    user: recipient.type === 'user' ? recipient.id : null,
    professional: recipient.type === 'professional' ? recipient.id : null,
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type,
    data: notificationData.data || {},
    priority: notificationData.priority || 'normal',
    status: 'sent',
    tokens: recipient.tokens || [],
    results: []
  }));
  
  return this.insertMany(notifications);
};

notificationSchema.statics.getNotificationStats = async function() {
  const [
    totalNotifications,
    sentNotifications,
    deliveredNotifications,
    readNotifications,
    failedNotifications,
    todayNotifications
  ] = await Promise.all([
    this.countDocuments({ deleted: false }),
    this.countDocuments({ status: 'sent', deleted: false }),
    this.countDocuments({ status: 'delivered', deleted: false }),
    this.countDocuments({ status: 'read', deleted: false }),
    this.countDocuments({ status: 'failed', deleted: false }),
    this.countDocuments({
      deleted: false,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    })
  ]);
  
  return {
    total: totalNotifications,
    sent: sentNotifications,
    delivered: deliveredNotifications,
    read: readNotifications,
    failed: failedNotifications,
    today: todayNotifications,
    deliveryRate: sentNotifications > 0 ? ((deliveredNotifications / sentNotifications) * 100).toFixed(1) : '0',
    readRate: deliveredNotifications > 0 ? ((readNotifications / deliveredNotifications) * 100).toFixed(1) : '0'
  };
};

// Middleware para logging
notificationSchema.pre('save', function(next) {
  console.log(`🔔 Saving notification: ${this.title} - ${this.type}`);
  next();
});

notificationSchema.post('save', function(doc) {
  console.log(`🔔 Notification saved: ${doc._id}`);
});

module.exports = mongoose.model('Notification', notificationSchema);
