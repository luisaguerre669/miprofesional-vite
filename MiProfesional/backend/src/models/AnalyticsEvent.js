const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  event: {
    type: String,
    enum: [
      'cv_search', 'cv_view', 'cv_contact',
      'subscription_started', 'subscription_success', 'subscription_failed',
      'company_registered', 'professional_registered', 'client_registered',
      'daily_active_user', 'daily_active_company',
      'search_page_view', 'company_dashboard_view'
    ],
    required: true,
    index: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  userRole: { type: String, default: null },
  sessionId: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: null },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

analyticsEventSchema.index({ event: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: -1 }, { expireAfterSeconds: 365 * 24 * 3600 });

analyticsEventSchema.statics.track = async function({ event, userId, userRole, sessionId, metadata, ip }) {
  try {
    await this.create({ event, userId, userRole, sessionId, metadata, ip });
    return true;
  } catch (err) {
    console.error('[Analytics] Failed to track event:', err.message);
    return false;
  }
};

analyticsEventSchema.statics.countByEvent = function(event, since) {
  const match = { event };
  if (since) match.timestamp = { $gte: since };
  return this.countDocuments(match);
};

analyticsEventSchema.statics.uniqueUsersByEvent = function(event, since) {
  const match = { event };
  if (since) match.timestamp = { $gte: since };
  return this.distinct('userId', match).then(users => users.filter(Boolean).length);
};

analyticsEventSchema.statics.topSearches = function(since, limit = 10) {
  return this.aggregate([
    { $match: { event: 'cv_search', timestamp: { $gte: since || new Date(0) } } },
    { $group: { _id: '$metadata.query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

analyticsEventSchema.statics.mostViewedCVs = function(since, limit = 10) {
  return this.aggregate([
    { $match: { event: 'cv_view', timestamp: { $gte: since || new Date(0) } } },
    { $group: { _id: '$metadata.cvId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: 'curriculumvitaes', localField: '_id', foreignField: '_id', as: 'cv' } },
    { $unwind: { path: '$cv', preserveNullAndEmptyArrays: true } },
    { $project: { cvId: '$_id', count: 1, title: '$cv.personalData.headline', name: '$cv.personalData.fullName' } }
  ]);
};

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
