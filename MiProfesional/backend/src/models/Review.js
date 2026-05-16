const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toProfessional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    default: null
  },
  type: {
    type: String,
    enum: ['client_to_professional', 'professional_to_client'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.index({ bookingId: 1, type: 1 }, { unique: true });
reviewSchema.index({ toProfessional: 1 });
reviewSchema.index({ toUser: 1 });
reviewSchema.index({ fromUser: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
