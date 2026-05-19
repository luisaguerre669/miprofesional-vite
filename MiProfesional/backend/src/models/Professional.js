// Professional Model for MiProfesional Backend

const mongoose = require('mongoose');
const { geocodeAddress } = require('../utils/geocode');

const professionalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [200, 'Business name cannot exceed 200 characters']
  },
  profession: {
    type: String,
    required: [true, 'Profession is required'],
    trim: true,
    maxlength: [100, 'Profession cannot exceed 100 characters']
  },
  licenseNumber: {
    type: String,
    trim: true,
    default: null
  },
  licenseType: {
    type: String,
    enum: ['matricula', 'colegiatura', 'certificacion', 'habilitacion', 'none'],
    default: 'none'
  },
  licenseRequired: {
    type: Boolean,
    default: false
  },
  licenseVerified: {
    type: Boolean,
    default: false
  },
  licenseVerificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'not_required'],
    default: 'not_required'
  },
  workPhotos: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  specialties: [{
    type: String,
    trim: true,
    maxlength: [50, 'Specialty cannot exceed 50 characters']
  }],
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  gallery: [{
    type: String
  }],
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: {
      type: String,
      trim: true
    },
    whatsapp: {
      type: String,
      trim: true
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function(coordinates) {
            return coordinates.length === 2 && 
                   coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
                   coordinates[1] >= -90 && coordinates[1] <= 90;    // latitude
          },
          message: 'Invalid coordinates. Must be [longitude, latitude]'
        }
      }
    },
    serviceRadius: {
      type: Number,
      default: 50, // km
      min: [1, 'Service radius must be at least 1 km'],
      max: [500, 'Service radius cannot exceed 500 km']
    }
  },
  services: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Service description cannot exceed 500 characters']
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    workingHours: {
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
    },
    timeSlots: [{
      start: String,
      end: String,
      maxBookings: { type: Number, default: 1 }
    }],
    vacations: [{
      start: Date,
      end: Date,
      reason: String
    }]
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative']
    },
    currency: {
      type: String,
      enum: ['ARS', 'USD', 'EUR'],
      default: 'ARS'
    },
    paymentMethods: [{
      type: String,
      enum: ['cash', 'transfer', 'mercadopago', 'stripe', 'paypal']
    }],
    acceptsInsurance: {
      type: Boolean,
      default: false
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDate: {
      type: Date,
      default: null
    },
    documents: [{
      type: String, // URLs to uploaded documents
      name: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  stats: {
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative']
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: [0, 'Total bookings cannot be negative']
    },
    completedBookings: {
      type: Number,
      default: 0,
      min: [0, 'Completed bookings cannot be negative']
    },
    cancelledBookings: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled bookings cannot be negative']
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative']
    },
    responseTime: {
      type: String,
      default: '24 hours'
    },
    responseRate: {
      type: Number,
      default: 0,
      min: [0, 'Response rate cannot be less than 0'],
      max: [100, 'Response rate cannot be more than 100']
    }
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    emailAlerts: {
      type: Boolean,
      default: true
    },
    smsAlerts: {
      type: Boolean,
      default: false
    },
    autoAcceptBookings: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date,
    default: null
  },
  subscription: {
    status: {
      type: String,
      enum: ['inactive', 'pending_payment', 'trial', 'active', 'expired', 'cancelled'],
      default: 'pending_payment'
    },
    plan: { type: String, default: null },
    paymentId: { type: String, default: null },
    trialStart: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    lastPayment: { type: Date, default: null },
    nextBilling: { type: Date, default: null },
    mpPreferenceId: { type: String, default: null },
    mpInitPoint: { type: String, default: null },
    activatedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
professionalSchema.virtual('fullName').get(function() {
  return this.businessName || this.contact.email;
});

professionalSchema.virtual('averageRating').get(function() {
  return this.stats.rating;
});

professionalSchema.virtual('isTopRated').get(function() {
  return this.stats.rating >= 4.5 && this.stats.reviewCount >= 10;
});

professionalSchema.virtual('isAvailable').get(function() {
  return this.availability.isAvailable && this.isActive;
});

professionalSchema.virtual('completionRate').get(function() {
  const total = this.stats.totalBookings;
  if (total === 0) return 0;
  return Math.round((this.stats.completedBookings / total) * 100);
});

professionalSchema.virtual('cancellationRate').get(function() {
  const total = this.stats.totalBookings;
  if (total === 0) return 0;
  return Math.round((this.stats.cancelledBookings / total) * 100);
});

// Indexes
professionalSchema.index({ userId: 1 });
professionalSchema.index({ categoryId: 1 });
professionalSchema.index({ 'location.coordinates': '2dsphere' });
professionalSchema.index({ 'verification.isVerified': 1 });
professionalSchema.index({ isActive: 1 });
professionalSchema.index({ isFeatured: 1 });
professionalSchema.index({ 'stats.rating': -1 });
professionalSchema.index({ 'stats.reviewCount': -1 });
professionalSchema.index({ 'stats.totalBookings': -1 });
professionalSchema.index({ 'pricing.hourlyRate': 1 });
professionalSchema.index({ createdAt: -1 });

// Text search index
professionalSchema.index({
  profession: 'text',
  specialties: 'text',
  description: 'text',
  'location.city': 'text',
  'location.state': 'text'
});

// Pre-save middleware
professionalSchema.pre('save', async function(next) {
  if (this.isFeatured && this.featuredUntil && new Date() > this.featuredUntil) {
    this.isFeatured = false;
    this.featuredUntil = null;
  }

  if (this.isModified('location.address') || this.isModified('location.city') || this.isModified('location.state')) {
    const addr = this.location.address;
    const city = this.location.city;
    if (addr && addr !== 'pendiente' && city && city !== 'pendiente') {
      try {
        const result = await geocodeAddress({
          address: addr, city, state: this.location.state,
          country: this.location.country
        });
        if (result) {
          this.location.coordinates = {
            type: 'Point',
            coordinates: [result.longitude, result.latitude]
          };
        }
      } catch (err) { /* non-critical */ }
    }
  }

  next();
});

// Instance methods
professionalSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  
  const ratingStats = await Review.aggregate([
    { $match: { toProfessional: this._id, type: 'client_to_professional' } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  const stats = ratingStats[0] || { avgRating: 0, reviewCount: 0 };
  
  this.stats.rating = Math.round(stats.avgRating * 10) / 10; // Round to 1 decimal
  this.stats.reviewCount = stats.reviewCount;
  
  return this.save();
};

professionalSchema.methods.updateBookingStats = async function() {
  const Booking = mongoose.model('Booking');
  
  const stats = await Booking.aggregate([
    { $match: { professionalId: this._id } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalRevenue: { $sum: '$price' }
      }
    }
  ]);
  
  const bookingStats = stats[0] || { 
    totalBookings: 0, 
    completedBookings: 0, 
    cancelledBookings: 0, 
    totalRevenue: 0 
  };
  
  this.stats.totalBookings = bookingStats.totalBookings;
  this.stats.completedBookings = bookingStats.completedBookings;
  this.stats.cancelledBookings = bookingStats.cancelledBookings;
  this.stats.totalRevenue = bookingStats.totalRevenue;
  
  return this.save();
};

professionalSchema.methods.toggleVerification = function(status) {
  this.verification.isVerified = status === 'verified';
  this.verification.verificationDate = status === 'verified' ? new Date() : null;
  this.verification.verificationStatus = status;
  return this.save();
};

professionalSchema.methods.setFeatured = function(duration) {
  this.isFeatured = true;
  this.featuredUntil = new Date(Date.now() + duration);
  return this.save();
};

professionalSchema.methods.isWorkingNow = function() {
  if (!this.availability.isAvailable) return false;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  
  const todayHours = this.availability.workingHours[today];
  if (!todayHours || todayHours.closed) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

professionalSchema.methods.getNextAvailableSlot = function() {
  // This would implement logic to find next available time slot
  // For now, return a simple implementation
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    date: tomorrow.toISOString().split('T')[0],
    time: '09:00',
    available: true
  };
};

// Static methods
professionalSchema.statics.findByLocation = function(longitude, latitude, maxDistance = 50) {
  return this.find({
    isActive: true,
    'subscription.status': 'active',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });
};

professionalSchema.statics.search = function(query, options = {}) {
  const {
    categoryId,
    subcategoryId,
    location,
    maxDistance = 50,
    minRating = 0,
    maxPrice,
    isVerified = false,
    limit = 20,
    skip = 0,
    sortBy = 'stats.rating',
    sortOrder = 'desc'
  } = options;
  
  const searchQuery = {
    isActive: true,
    'subscription.status': 'active'
  };
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Category filter
  if (categoryId) {
    searchQuery.categoryId = categoryId;
  }
  if (subcategoryId) {
    searchQuery.subcategoryId = subcategoryId;
  }
  
  // Location filter
  if (location && location.longitude && location.latitude) {
    searchQuery['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        $maxDistance: maxDistance * 1000
      }
    };
  }
  
  // Rating filter
  if (minRating > 0) {
    searchQuery['stats.rating'] = { $gte: minRating };
  }
  
  // Price filter
  if (maxPrice) {
    searchQuery['pricing.hourlyRate'] = { $lte: maxPrice };
  }
  
  // Verification filter
  if (isVerified) {
    searchQuery['verification.isVerified'] = true;
  }
  
  return this.find(searchQuery)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('categoryId', 'title')
    .populate('userId', 'name email phone');
};

professionalSchema.statics.getTopRated = function(limit = 10, categoryId = null) {
  const query = {
    isActive: true,
    'subscription.status': 'active',
    'stats.rating': { $gte: 4.0 },
    'stats.reviewCount': { $gte: 5 }
  };
  
  if (categoryId) {
    query.categoryId = categoryId;
  }
  
  return this.find(query)
    .sort({ 'stats.rating': -1, 'stats.reviewCount': -1 })
    .limit(limit)
    .populate('categoryId', 'title');
};

professionalSchema.statics.getFeatured = function(limit = 6) {
  return this.find({
    isActive: true,
    'subscription.status': 'active',
    isFeatured: true,
    $or: [
      { featuredUntil: null },
      { featuredUntil: { $gt: new Date() } }
    ]
  })
  .sort({ 'stats.rating': -1 })
  .limit(limit)
  .populate('categoryId', 'title');
};

professionalSchema.statics.getVerified = function(limit = 20) {
  return this.find({
    isActive: true,
    'subscription.status': 'active',
    'verification.isVerified': true
  })
  .sort({ 'stats.rating': -1 })
  .limit(limit)
  .populate('categoryId', 'title');
};

professionalSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true, 'subscription.status': 'active' } },
    {
      $group: {
        _id: null,
        totalProfessionals: { $sum: 1 },
        activeProfessionals: { $sum: 1 },
        verifiedProfessionals: { $sum: { $cond: [{ $eq: ['$verification.isVerified', true] }, 1, 0] } },
        featuredProfessionals: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } },
        avgRating: { $avg: '$stats.rating' },
        avgHourlyRate: { $avg: '$pricing.hourlyRate' },
        totalBookings: { $sum: '$stats.totalBookings' },
        totalRevenue: { $sum: '$stats.totalRevenue' }
      }
    }
  ]);
  
  return stats[0] || {
    totalProfessionals: 0,
    activeProfessionals: 0,
    verifiedProfessionals: 0,
    featuredProfessionals: 0,
    avgRating: 0,
    avgHourlyRate: 0,
    totalBookings: 0,
    totalRevenue: 0
  };
};

// Transform output
professionalSchema.methods.toJSON = function() {
  const professionalObject = this.toObject();
  
  // Add computed fields
  professionalObject.fullName = this.fullName;
  professionalObject.averageRating = this.averageRating;
  professionalObject.isTopRated = this.isTopRated;
  professionalObject.isAvailable = this.isAvailable;
  professionalObject.completionRate = this.completionRate;
  professionalObject.cancellationRate = this.cancellationRate;
  
  return professionalObject;
};

module.exports = mongoose.model('Professional', professionalSchema);
