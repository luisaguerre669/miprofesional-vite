// Category Model for MiProfesional Backend

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Category title is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Category image is required']
  },
  icon: {
    type: String,
    default: null
  },
  professionalCount: {
    type: Number,
    default: 0,
    min: [0, 'Professional count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  metadata: {
    color: {
      type: String,
      default: '#3b82f6'
    },
    featured: {
      type: Boolean,
      default: false
    },
    popular: {
      type: Boolean,
      default: false
    },
    emergency: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    avgRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    avgPrice: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
categorySchema.virtual('isPopular').get(function() {
  return this.metadata.popular || this.professionalCount > 50;
});

categorySchema.virtual('hasSubcategories').get(function() {
  return this.subcategories && this.subcategories.length > 0;
});

categorySchema.virtual('fullTitle').get(function() {
  if (this.parentCategory) {
    return `${this.parentCategory.title} > ${this.title}`;
  }
  return this.title;
});

// Indexes
categorySchema.index({ title: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ 'metadata.featured': 1 });
categorySchema.index({ 'metadata.popular': 1 });
categorySchema.index({ 'metadata.emergency': 1 });
categorySchema.index({ professionalCount: -1 });
categorySchema.index({ 'stats.avgRating': -1 });
categorySchema.index({ parentCategory: 1 });

// Pre-save middleware
categorySchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

// Instance methods
categorySchema.methods.updateProfessionalCount = async function() {
  const Professional = mongoose.model('Professional');
  const count = await Professional.countDocuments({ 
    categoryId: this._id, 
    isActive: true 
  });
  
  this.professionalCount = count;
  return this.save();
};

categorySchema.methods.updateStats = async function() {
  const Professional = mongoose.model('Professional');
  const Booking = mongoose.model('Booking');
  const Review = mongoose.model('Review');
  
  // Get all professionals in this category
  const professionals = await Professional.find({ categoryId: this._id });
  const professionalIds = professionals.map(p => p._id);
  
  // Calculate stats
  const [
    totalBookings,
    avgRating,
    totalReviews,
    avgPrice
  ] = await Promise.all([
    Booking.countDocuments({ professionalId: { $in: professionalIds } }),
    Review.aggregate([
      { $match: { professionalId: { $in: professionalIds } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]).then(result => result[0]?.avgRating || 0),
    Review.countDocuments({ professionalId: { $in: professionalIds } }),
    Professional.aggregate([
      { $match: { categoryId: this._id } },
      { $group: { _id: null, avgPrice: { $avg: '$hourlyRate' } } }
    ]).then(result => result[0]?.avgPrice || 0)
  ]);
  
  this.stats = {
    totalBookings,
    avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    avgPrice: Math.round(avgPrice)
  };
  
  return this.save();
};

categorySchema.methods.toggleFeatured = function() {
  this.metadata.featured = !this.metadata.featured;
  return this.save();
};

categorySchema.methods.togglePopular = function() {
  this.metadata.popular = !this.metadata.popular;
  return this.save();
};

categorySchema.methods.toggleEmergency = function() {
  this.metadata.emergency = !this.metadata.emergency;
  return this.save();
};

// Static methods
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, title: 1 });
};

categorySchema.statics.findFeatured = function(limit = 6) {
  return this.find({ 
    isActive: true, 
    'metadata.featured': true 
  })
  .sort({ professionalCount: -1 })
  .limit(limit);
};

categorySchema.statics.findPopular = function(limit = 10) {
  return this.find({ 
    isActive: true 
  })
  .sort({ professionalCount: -1 })
  .limit(limit);
};

categorySchema.statics.findEmergency = function() {
  return this.find({ 
    isActive: true, 
    'metadata.emergency': true 
  })
  .sort({ title: 1 });
};

categorySchema.statics.find247 = categorySchema.statics.findEmergency;

categorySchema.statics.search = function(query, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'title',
    sortOrder = 'asc'
  } = options;
  
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    isActive: true,
    $or: [
      { title: searchRegex },
      { description: searchRegex }
    ]
  })
  .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
  .skip(skip)
  .limit(limit);
};

categorySchema.statics.getTopCategories = function(limit = 5) {
  return this.find({ isActive: true })
    .sort({ professionalCount: -1 })
    .limit(limit);
};

categorySchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        featuredCategories: { $sum: { $cond: [{ $eq: ['$metadata.featured', true] }, 1, 0] } },
        emergencyCategories: { $sum: { $cond: [{ $eq: ['$metadata.emergency', true] }, 1, 0] } },
        totalProfessionals: { $sum: '$professionalCount' },
        avgProfessionalsPerCategory: { $avg: '$professionalCount' },
        totalBookings: { $sum: '$stats.totalBookings' },
        avgRating: { $avg: '$stats.avgRating' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCategories: 0,
    activeCategories: 0,
    featuredCategories: 0,
    emergencyCategories: 0,
    totalProfessionals: 0,
    avgProfessionalsPerCategory: 0,
    totalBookings: 0,
    avgRating: 0
  };
};

// Validation methods
categorySchema.methods.validateImage = function(imageUrl) {
  // Basic image URL validation
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  return urlRegex.test(imageUrl);
};

// Transform output
categorySchema.methods.toJSON = function() {
  const categoryObject = this.toObject();
  
  // Add computed fields
  categoryObject.isPopular = this.isPopular;
  categoryObject.hasSubcategories = this.hasSubcategories;
  categoryObject.fullTitle = this.fullTitle;
  
  return categoryObject;
};

module.exports = mongoose.model('Category', categorySchema);
