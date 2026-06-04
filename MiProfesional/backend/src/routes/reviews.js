const express = require('express');
const { validationResult, body, param, query } = require('express-validator');
const Review = require('../models/Review');
const Professional = require('../models/Professional');
const Booking = require('../models/Booking');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.get(
  '/',
  [
    query('professionalId').isMongoId().withMessage('Invalid professional ID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { professionalId, limit = 10, page = 1 } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const reviews = await Review.find({ toProfessional: professionalId })
        .populate('fromUser', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Review.countDocuments({ toProfessional: professionalId });

      res.json({
        success: true,
        data: {
          reviews,
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      logger.error('Error fetching reviews:', err);
      res.status(500).json({ success: false, message: 'Server error fetching reviews' });
    }
  }
);

router.post(
  '/',
  authenticate,
  [
    body('professionalId').isMongoId().withMessage('Invalid professional ID'),
    body('bookingId').isMongoId().withMessage('Invalid booking ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Comment must be at most 1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { professionalId, bookingId, rating, comment } = req.body;

      const professional = await Professional.findById(professionalId);
      if (!professional) {
        return res.status(404).json({ success: false, message: 'Professional not found' });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (booking.userId.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'This booking does not belong to you' });
      }
      if (booking.professionalId.toString() !== professionalId) {
        return res.status(400).json({ success: false, message: 'Booking does not match this professional' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Cannot review a booking that is not completed' });
      }

      const existing = await Review.findOne({ bookingId, type: 'client_to_professional' });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already reviewed this booking' });
      }

      const review = new Review({
        fromUser: req.userId,
        toUser: professional.userId,
        toProfessional: professionalId,
        bookingId,
        type: 'client_to_professional',
        rating,
        comment,
      });

      await review.save();
      await professional.updateRating();

      res.status(201).json({ success: true, data: review });
    } catch (err) {
      logger.error('Error creating review:', err);
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Duplicate review for this booking' });
      }
      res.status(500).json({ success: false, message: 'Server error creating review' });
    }
  }
);

router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Comment must be at most 1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      if (review.fromUser.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit this review' });
      }

      if (req.body.rating !== undefined) review.rating = req.body.rating;
      if (req.body.comment !== undefined) review.comment = req.body.comment;

      await review.save();

      if (review.toProfessional) {
        const professional = await Professional.findById(review.toProfessional);
        if (professional) await professional.updateRating();
      }

      res.json({ success: true, data: review });
    } catch (err) {
      logger.error('Error updating review:', err);
      res.status(500).json({ success: false, message: 'Server error updating review' });
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid review ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      if (review.fromUser.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
      }

      const professionalId = review.toProfessional;
      await Review.deleteOne({ _id: review._id });

      if (professionalId) {
        const professional = await Professional.findById(professionalId);
        if (professional) await professional.updateRating();
      }

      res.json({ success: true, data: { message: 'Review deleted' } });
    } catch (err) {
      logger.error('Error deleting review:', err);
      res.status(500).json({ success: false, message: 'Server error deleting review' });
    }
  }
);

module.exports = router;
