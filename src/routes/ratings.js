const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Professional = require('../models/Professional');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// POST /ratings — Create a rating (client→professional or professional→client)
router.post('/', authenticate, [
  body('bookingId').isMongoId().withMessage('Booking ID invalido'),
  body('toUserId').isMongoId().withMessage('Usuario destino invalido'),
  body('toProfessionalId').optional().isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser 1-5'),
  body('comment').optional().trim().isLength({ max: 500 }),
  body('type').isIn(['client_to_professional', 'professional_to_client']).withMessage('Tipo invalido')
], handleValidationErrors, async (req, res) => {
  try {
    const { bookingId, toUserId, toProfessionalId, rating, comment, type } = req.body;

    const existing = await Review.findOne({ bookingId, type, fromUser: req.userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Ya calificaste este servicio',
        message: 'Ya existe una calificacion para esta reserva'
      });
    }

    const review = new Review({
      bookingId,
      fromUser: req.userId,
      toUser: toUserId,
      toProfessional: toProfessionalId || null,
      type,
      rating,
      comment: comment || ''
    });

    await review.save();

    // Update professional stats if client→professional rating
    if (type === 'client_to_professional' && toProfessionalId) {
      const pro = await Professional.findById(toProfessionalId);
      if (pro) {
        await pro.updateRating();
      }
    }

    logger.info('Rating created', { reviewId: review._id, type, rating });

    res.status(201).json({
      success: true,
      message: 'Calificacion creada exitosamente',
      data: review
    });
  } catch (error) {
    logger.error('Create rating error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al crear calificacion'
    });
  }
});

// GET /ratings/professional/:id — Get ratings for a professional
router.get('/professional/:id', [
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ toProfessional: id, type: 'client_to_professional', isVisible: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('fromUser', 'name avatar'),
      Review.countDocuments({ toProfessional: id, type: 'client_to_professional', isVisible: true })
    ]);

    const ratingStats = await Review.aggregate([
      { $match: { toProfessional: id, type: 'client_to_professional' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: reviews,
      stats: {
        average: ratingStats[0]?.avg || 0,
        total: ratingStats[0]?.count || 0
      },
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get professional ratings error', { error: error.message });
    res.status(500).json({ success: false, error: 'Error al obtener calificaciones' });
  }
});

module.exports = router;
