const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  serviceRequested: {
    type: String,
    maxlength: 200
  },
  preferredDate: Date,
  preferredTime: String,
  status: {
    type: String,
    enum: ['pending', 'read', 'replied', 'closed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactRequest', contactRequestSchema);