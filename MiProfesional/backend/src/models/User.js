// User Model for MiProfesional Backend

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['client', 'professional', 'employer', 'company', 'admin'],
    default: 'client'
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password by default
  },
  avatar: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'phone'],
    default: 'local'
  },
  authProviderId: {
    type: String,
    default: null,
    sparse: true
  },
  authProviderData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: {
    type: String,
    default: null
  },
  phoneVerificationExpires: {
    type: Date,
    default: null
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  address: {
    street: { type: String, trim: true, default: '' },
    number: { type: String, trim: true, default: '' },
    neighborhood: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, default: 'Argentina' }
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
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
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    currency: {
      type: String,
      enum: ['ARS', 'USD', 'EUR'],
      default: 'ARS'
    }
  },
  membership: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    benefits: [{
      type: String
    }]
  },
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    favoriteProfessionals: {
      type: Number,
      default: 0
    },
    reviewsGiven: {
      type: Number,
      default: 0
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: {
    type: Date,
    default: null
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'professional', 'company'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    lastPaymentId: {
      type: String,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    lastReminderSent: {
      type: String,
      enum: [null, '7d', '1d', 'expired'],
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return this.name;
});

userSchema.virtual('isPremium').get(function() {
  return this.membership.type === 'premium';
});

userSchema.virtual('membershipStatus').get(function() {
  if (this.membership.type === 'free') return 'free';
  if (!this.membership.expiresAt) return 'expired';
  return new Date() > this.membership.expiresAt ? 'expired' : 'active';
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ authProviderId: 1 }, { sparse: true });
userSchema.index({ location: 'text' });
userSchema.index({ 'coordinates': '2dsphere' });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  
  // Update last login if user is being updated and is active
  if (this.isModified && this.isActive && !this.lastLogin) {
    this.lastLogin = new Date();
  }

  // Auto-geocode on address change
  if (this.isModified('address.street') || this.isModified('address.city') || this.isModified('address.state')) {
    const addr = this.address;
    if (addr.street || addr.city) {
      try {
        const { geocodeAddress } = require('../utils/geocode');
        const result = await geocodeAddress({
          address: `${addr.street} ${addr.number}`.trim(),
          city: addr.city,
          state: addr.state,
          country: addr.country
        });
        if (result) {
          this.coordinates = {
            type: 'Point',
            coordinates: [result.longitude, result.latitude]
          };
          if (!this.location) {
            this.location = result.displayName || `${addr.street} ${addr.number}, ${addr.city}`.trim();
          }
        }
      } catch (err) {
        // non-critical
      }
    }
  }

  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.verificationToken = crypto.randomBytes(32).toString('hex');
  return this.verificationToken;
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return this.resetPasswordToken;
};

userSchema.methods.clearPasswordResetFields = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

userSchema.methods.updateStats = async function(updates) {
  const allowedUpdates = ['totalBookings', 'totalSpent', 'favoriteProfessionals', 'reviewsGiven'];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedUpdates.includes(key)) {
      this.stats[key] = value;
    }
  }
  
  return this.save();
};

userSchema.methods.addToFavorites = function(professionalId) {
  if (!this.favorites.includes(professionalId)) {
    this.favorites.push(professionalId);
    this.stats.favoriteProfessionals = this.favorites.length;
  }
  return this.save();
};

userSchema.methods.removeFromFavorites = function(professionalId) {
  this.favorites = this.favorites.filter(
    id => id.toString() !== professionalId.toString()
  );
  this.stats.favoriteProfessionals = this.favorites.length;
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

userSchema.statics.findByAuthProvider = function(provider, providerId) {
  return this.findOne({ authProvider: provider, authProviderId: providerId });
};

userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({ verificationToken: token });
};

userSchema.statics.findByResetToken = function(token) {
  return this.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  }).select('+password');
};

userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
        premiumUsers: { $sum: { $cond: [{ $eq: ['$membership.type', 'premium'] }, 1, 0] } },
        avgBookings: { $avg: '$stats.totalBookings' },
        avgSpent: { $avg: '$stats.totalSpent' }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    premiumUsers: 0,
    avgBookings: 0,
    avgSpent: 0
  };
};

// Validation methods
userSchema.methods.validatePassword = function(password) {
  // Password validation rules
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Transform output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.phoneVerificationCode;
  delete userObject.phoneVerificationExpires;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
