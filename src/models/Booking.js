const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Professional",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
    default: "pending"
  },
  price: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  }
}, { timestamps: true });

bookingSchema.index({ professionalId: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ date: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
