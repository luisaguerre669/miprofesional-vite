// Professionals Routes for MiProfesional Backend

const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const Professional = require('../models/Professional');
const Category = require('../models/Category');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const logger = require('../utils/logger');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/v1/professionals
router.get('/', [
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('location').optional().isObject().withMessage('Location must be an object with longitude and latitude'),
  query('maxDistance').optional().isFloat({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500 km'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('featured').optional().isBoolean().withMessage('featured must be a boolean'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('availability').optional().isBoolean().withMessage('availability must be a boolean'),
  query('sortBy').optional().isIn(['rating', 'price', 'responseTime', 'reviewCount', 'createdAt', 'ranking']).withMessage('Invalid sort field'),
  query('sort').optional().isIn(['rating', 'price', 'responseTime', 'reviewCount', 'createdAt', 'ranking']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      categoryId,
      search,
      location,
      maxDistance = 50,
      minRating = 0,
      maxPrice,
      featured,
      isVerified = false,
      availability,
      sort: sortAlias,
      sortBy = sortAlias || 'stats.rating',
      sortOrder = 'desc',
      limit = 20,
      page = 1
    } = req.query;

    const options = {
      categoryId,
      location: location ? JSON.parse(location) : undefined,
      maxDistance: parseFloat(maxDistance),
      minRating: parseFloat(minRating),
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      isVerified: isVerified === 'true',
      limit: parseInt(limit),
      page: parseInt(page),
      sortBy,
      sortOrder
    };

    let professionals;

    // Sort by ranking algorithm
    if (sortBy === 'ranking') {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const pipe = [
        { $match: { isActive: true, 'subscription.status': 'active' } },
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: [{ $ifNull: ['$stats.rating', 0] }, 2] },
                { $ifNull: ['$stats.completedBookings', 0] },
                { $cond: [{ $eq: ['$verification.isVerified', true] }, 10, 0] },
                { $cond: [{ $eq: ['$isFeatured', true] }, 5, 0] }
              ]
            }
          }
        },
        { $sort: { score: -1, 'stats.rating': -1, 'stats.completedBookings': -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
      ];
      if (featured === 'true') pipe[0].$match.isFeatured = true;
      const result = await Professional.aggregate(pipe);
      const totalRank = await Professional.countDocuments({ isActive: true, 'subscription.status': 'active' });
      logger.info('Ranking result', { count: result.length, sampleScore: result[0]?.score });
      return res.json({
        success: true, data: result,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: totalRank, totalPages: Math.ceil(totalRank / parseInt(limit)), hasNext: parseInt(page) < Math.ceil(totalRank / parseInt(limit)), hasPrev: parseInt(page) > 1 }
      });
    }

    if (search || location || minRating > 0 || maxPrice || isVerified === 'true') {
      professionals = await Professional.search(search, options);
    } else {
      let query = { isActive: true, 'subscription.status': 'active' };

      if (categoryId) query.categoryId = categoryId;
      if (featured === 'true') query.isFeatured = true;
      if (availability !== undefined) query['availability.isAvailable'] = availability === 'true';

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      professionals = await Professional.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('categoryId', 'title')
        .populate('userId', 'name email phone');
    }

    const total = await Professional.countDocuments({ isActive: true, 'subscription.status': 'active' });
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info('Professionals retrieved', {
      count: professionals.length, total, page: parseInt(page), limit: parseInt(limit), search, categoryId, featured, sortBy, sortOrder
    });

    res.json({
      success: true,
      message: 'Professionals retrieved successfully',
      data: professionals,
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total, totalPages,
        hasNext: parseInt(page) < totalPages, hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Get professionals error', { error: error.message, query: req.query });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professionals',
      message: 'An error occurred while retrieving professionals'
    });
  }
});

// GET /api/v1/professionals/featured
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const professionals = await Professional.getFeatured(limit);

    logger.info('Featured professionals retrieved', { count: professionals.length, limit });

    res.json({
      success: true,
      message: 'Featured professionals retrieved successfully',
      data: professionals
    });

  } catch (error) {
    logger.error('Get featured professionals error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured professionals',
      message: 'An error occurred while retrieving featured professionals'
    });
  }
});

// GET /api/v1/professionals/verified
router.get('/verified', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const professionals = await Professional.getVerified(limit);

    logger.info('Verified professionals retrieved', { count: professionals.length, limit });

    res.json({
      success: true,
      message: 'Verified professionals retrieved successfully',
      data: professionals
    });

  } catch (error) {
    logger.error('Get verified professionals error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve verified professionals',
      message: 'An error occurred while retrieving verified professionals'
    });
  }
});

// GET /api/v1/professionals/top-rated
router.get('/top-rated', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { limit = 10, categoryId } = req.query;

    const professionals = await Professional.getTopRated(parseInt(limit), categoryId);

    logger.info('Top rated professionals retrieved', { 
      count: professionals.length, 
      limit: parseInt(limit),
      categoryId 
    });

    res.json({
      success: true,
      message: 'Top rated professionals retrieved successfully',
      data: professionals
    });

  } catch (error) {
    logger.error('Get top rated professionals error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve top rated professionals',
      message: 'An error occurred while retrieving top rated professionals'
    });
  }
});

// GET /api/v1/professionals/nearby
router.get('/nearby', [
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('maxDistance').optional().isFloat({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500 km'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 50, limit = 20 } = req.query;

    const professionals = await Professional.findByLocation(
      parseFloat(longitude),
      parseFloat(latitude),
      parseFloat(maxDistance)
    )
    .limit(parseInt(limit))
    .populate('categoryId', 'title')
    .populate('userId', 'name email phone');

    logger.info('Nearby professionals retrieved', {
      count: professionals.length,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      maxDistance: parseFloat(maxDistance),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Nearby professionals retrieved successfully',
      data: professionals,
      meta: {
        location: {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        },
        maxDistance: parseFloat(maxDistance),
        count: professionals.length
      }
    });

  } catch (error) {
    logger.error('Get nearby professionals error', { error: error.message, query: req.query });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nearby professionals',
      message: 'An error occurred while retrieving nearby professionals'
    });
  }
});

// GET /api/v1/professionals/search
router.get('/search', [
  query('q').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Search query is required and must be between 1 and 100 characters'),
  query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  query('location').optional().isObject().withMessage('Location must be an object'),
  query('maxDistance').optional().isFloat({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500 km'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  query('subcategoryId').optional().isMongoId().withMessage('Invalid subcategory ID'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const { q: query, categoryId, subcategoryId, location, maxDistance = 50, minRating = 0, maxPrice, isVerified = false, limit = 20, page = 1 } = req.query;

    const options = {
      categoryId,
      subcategoryId,
      location: location ? JSON.parse(location) : undefined,
      maxDistance: parseFloat(maxDistance),
      minRating: parseFloat(minRating),
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      isVerified: isVerified === 'true',
      limit: parseInt(limit),
      page: parseInt(page),
      sortBy: 'stats.rating',
      sortOrder: 'desc'
    };

    const professionals = await Professional.search(query, options);

    logger.info('Professionals search', {
      query,
      count: professionals.length,
      categoryId,
      location,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: professionals,
      meta: {
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        count: professionals.length
      }
    });

  } catch (error) {
    logger.error('Professionals search error', { error: error.message, query: req.query.q });
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'An error occurred while searching professionals'
    });
  }
});

// GET /api/v1/professionals/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Professional.getStats();

    logger.info('Professionals stats retrieved', stats);

    res.json({
      success: true,
      message: 'Professional statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Get professionals stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professional statistics',
      message: 'An error occurred while retrieving professional statistics'
    });
  }
});

// GET /api/v1/professionals/ranking — Top professionals by algorithm
router.get('/ranking', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { isActive: true, 'subscription.status': 'active' } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $ifNull: ['$stats.rating', 0] }, 2] },
              { $ifNull: ['$stats.completedBookings', 0] },
              { $cond: [{ $eq: ['$verification.isVerified', true] }, 10, 0] },
              { $cond: [{ $eq: ['$isFeatured', true] }, 5, 0] }
            ]
          }
        }
      },
      { $sort: { score: -1, 'stats.rating': -1, 'stats.completedBookings': -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          businessName: 1,
          profession: 1,
          description: 1,
          avatar: 1,
          score: 1,
          'stats.rating': 1,
          'stats.reviewCount': 1,
          'stats.completedBookings': 1,
          'pricing.hourlyRate': 1,
          'pricing.currency': 1,
          location: { city: 1, state: 1 },
          verification: { isVerified: 1 },
          isFeatured: 1,
          'category.title': 1,
          'category.slug': 1
        }
      }
    ];

    const [professionals, totalResult] = await Promise.all([
      Professional.aggregate(pipeline),
      Professional.countDocuments({ isActive: true, 'subscription.status': 'active' })
    ]);

    const totalPages = Math.ceil(totalResult / limit);

    res.json({
      success: true,
      data: professionals,
      pagination: {
        page, limit: professionals.length,
        total: totalResult, totalPages,
        hasNext: page < totalPages, hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Ranking error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to compute ranking' });
  }
});

// GET /api/v1/professionals/favorites (authenticated user's favorites)
router.get('/favorites', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({ success: true, data: user.favorites });
  } catch (error) {
    logger.error('Get favorites error', { error: error.message });
    res.status(500).json({ success: false, message: 'Error al obtener favoritos' });
  }
});

// GET /api/v1/professionals/:id
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid professional ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id)
      .populate('categoryId', 'title')
      .populate('userId', 'name email phone avatar location');

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    logger.info('Professional retrieved', { 
      professionalId: id, 
      name: professional.businessName || professional.profession 
    });

    res.json({
      success: true,
      message: 'Professional retrieved successfully',
      data: professional
    });

  } catch (error) {
    logger.error('Get professional error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professional',
      message: 'An error occurred while retrieving the professional'
    });
  }
});

// POST /api/v1/professionals/:id/contact
router.post('/:id/contact', optionalAuth, [
  param('id').isMongoId().withMessage('Invalid professional ID'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  body('serviceRequested').optional().trim().isLength({ max: 200 }).withMessage('Service requested cannot exceed 200 characters'),
  body('preferredDate').optional().isISO8601().withMessage('Preferred date must be a valid date'),
  body('preferredTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Preferred time must be in HH:MM format')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, serviceRequested, preferredDate, preferredTime } = req.body;

    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    const contact = new ContactRequest({
      professionalId: id,
      userId: req.userId || null,
      message,
      serviceRequested,
      preferredDate,
      preferredTime
    });
    await contact.save();

    logger.info('Contact request saved', { contactId: contact._id, professionalId: id });

    res.status(201).json({
      success: true,
      message: 'Contact request sent successfully',
      data: {
        contactId: contact._id,
        professionalId: id,
        message: 'Your message has been sent to the professional. They will contact you soon.'
      }
    });

  } catch (error) {
    logger.error('Contact professional error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to send contact request',
      message: 'An error occurred while sending your contact request'
    });
  }
});

// POST /api/v1/professionals/:id/favorite
router.post('/:id/favorite', authenticate, [
  param('id').isMongoId().withMessage('Invalid professional ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const isFav = user.favorites.some(f => f.toString() === id);
    if (isFav) {
      await user.removeFromFavorites(id);
    } else {
      await user.addToFavorites(id);
    }

    logger.info('Professional favorite toggled', {
      professionalId: id,
      userId: req.userId,
      nowFavorite: !isFav
    });

    res.json({
      success: true,
      message: isFav ? 'Favorito eliminado' : 'Favorito agregado',
      data: { professionalId: id, favorite: !isFav }
    });

  } catch (error) {
    logger.error('Toggle favorite error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite',
      message: 'An error occurred while toggling favorite status'
    });
  }
});

// GET /api/v1/professionals/:id/stats
router.get('/:id/stats', [
  param('id').isMongoId().withMessage('Invalid professional ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professional not found',
        message: 'Professional with the specified ID was not found'
      });
    }

    // Update stats if needed
    await professional.updateBookingStats();
    await professional.updateRating();

    const stats = {
      totalBookings: professional.stats.totalBookings,
      completedBookings: professional.stats.completedBookings,
      cancelledBookings: professional.stats.cancelledBookings,
      totalRevenue: professional.stats.totalRevenue,
      averageRating: professional.stats.rating,
      reviewCount: professional.stats.reviewCount,
      responseTime: professional.stats.responseTime,
      responseRate: professional.stats.responseRate,
      completionRate: professional.completionRate,
      cancellationRate: professional.cancellationRate,
      isTopRated: professional.isTopRated
    };

    logger.info('Professional stats retrieved', { professionalId: id, stats });

    res.json({
      success: true,
      message: 'Professional statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Get professional stats error', { error: error.message, professionalId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve professional statistics',
      message: 'An error occurred while retrieving professional statistics'
    });
  }
});

// POST /api/v1/professionals - Create professional profile
router.post('/', authenticate, async (req, res) => {
  try {
    const existing = await Professional.findOne({ userId: req.userId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Ya tienes un perfil profesional' });
    }

    const professional = new Professional({
      userId: req.userId,
      categoryId: req.body.categoryId || null,
      businessName: req.body.businessName,
      profession: req.body.profession,
      description: req.body.description,
      specialties: req.body.specialties || [],
      contact: {
        phone: req.body.contact?.phone || req.body.phone || '',
        email: req.body.contact?.email || req.body.email || ''
      },
      location: {
        address: req.body.location?.address || req.body.address || '',
        city: req.body.location?.city || req.body.city || '',
        state: req.body.location?.state || req.body.state || '',
        country: req.body.location?.country || req.body.country || 'Argentina',
        coordinates: {
          type: 'Point',
          coordinates: req.body.location?.coordinates || req.body.coordinates || [0, 0]
        }
      },
      pricing: {
        hourlyRate: req.body.pricing?.hourlyRate || req.body.hourlyRate || 0,
        currency: 'ARS'
      },
      subscription: { status: 'pending_payment' }
    });

    await professional.save();
    logger.info('Professional profile created:', { userId: req.userId, professionalId: professional._id });

    res.status(201).json({ success: true, message: 'Perfil profesional creado', data: professional });
  } catch (error) {
    logger.error('Create professional error:', error);
    res.status(500).json({ success: false, message: 'Error al crear perfil profesional' });
  }
});

// PUT /api/v1/professionals/:id - Update professional profile
router.put('/:id', authenticate, [
  param('id').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) return res.status(404).json({ success: false, message: 'Perfil no encontrado' });

    const allowedFields = ['businessName', 'profession', 'description', 'specialties', 'avatar', 'gallery', 'isFeatured'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) professional[field] = req.body[field];
    }

    if (req.body.contact) {
      professional.contact = { ...professional.contact.toObject(), ...req.body.contact };
    }
    if (req.body.location) {
      professional.location = { ...professional.location.toObject(), ...req.body.location };
    }
    if (req.body.pricing) {
      professional.pricing = { ...professional.pricing.toObject(), ...req.body.pricing };
    }

    await professional.save();
    logger.info('Professional profile updated:', { professionalId: professional._id });

    res.json({ success: true, message: 'Perfil actualizado', data: professional });
  } catch (error) {
    logger.error('Update professional error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
});

module.exports = router;
