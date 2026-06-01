const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  event: {
    type: String,
    enum: [
      'login', 'register', 'logout',
      'cv_search', 'cv_view', 'cv_create', 'cv_update',
      'payment_started', 'payment_success', 'payment_failed',
      'subscription_started', 'subscription_renewed', 'subscription_expired', 'subscription_cancelled',
      'subscription_reminder_7d', 'subscription_reminder_1d', 'subscription_reminder_expired',
      'user_blocked', 'user_unblocked', 'role_changed',
      'admin_action', 'backup_run'
    ],
    required: true,
    index: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  userRole: { type: String, default: null },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  resource: {
    type: { type: String, default: null },
    id: { type: String, default: null }
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  success: { type: Boolean, default: true }
}, { timestamps: false });

auditLogSchema.index({ event: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }, { expireAfterSeconds: 90 * 24 * 3600 });

auditLogSchema.statics.log = async function({ event, userId, userRole, ip, userAgent, resource, metadata, success }) {
  try {
    await this.create({ event, userId, userRole, ip, userAgent, resource, metadata, success });
  } catch (err) {
    console.error('[AuditLog] Failed to write log:', err.message);
  }
};

auditLogSchema.statics.getRecentByEvent = function(event, limit = 50) {
  return this.find({ event }).sort({ timestamp: -1 }).limit(limit).populate('userId', 'name email role');
};

auditLogSchema.statics.getByUser = function(userId, limit = 50) {
  return this.find({ userId }).sort({ timestamp: -1 }).limit(limit);
};

auditLogSchema.statics.countByEvent = function(event, since) {
  const match = { event };
  if (since) match.timestamp = { $gte: since };
  return this.countDocuments(match);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
