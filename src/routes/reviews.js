const express = require('express');
const { validationResult, body, param, query } = require('express-validator');
const Review = require('../models/Review');
const Professional = require('../models/Professional');
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

      const reviews = await Review.find({ professionalId })
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Review.countDocuments({ professional: professionalId });

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

      const { professionalId, rating, comment } = req.body;

      const professional = await Professional.findById(professionalId);
      if (!professional) {
        return res.status(404).json({ success: false, message: 'Professional not found' });
      }

      const review = new Review({
        userId: req.userId,
        professionalId,
        rating,
        comment,
      });

      await review.save();
      await professional.updateRating();

      res.status(201).json({ success: true, data: review });
    } catch (err) {
      logger.error('Error creating review:', err);
      res.status(500).json({ success: false, message: 'Server error creating review' });
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

      if (review.userId.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
      }

      const professionalId = review.professionalId;
      await Review.deleteOne({ _id: review._id });

      const professional = await Professional.findById(professionalId);
      if (professional) {
        await professional.updateRating();
      }

      res.json({ success: true, data: { message: 'Review deleted' } });
    } catch (err) {
      logger.error('Error deleting review:', err);
      res.status(500).json({ success: false, message: 'Server error deleting review' });
    }
  }
);

module.exports = router;
