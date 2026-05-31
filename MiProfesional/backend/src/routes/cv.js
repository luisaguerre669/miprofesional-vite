const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const CurriculumVitae = require('../models/CurriculumVitae');
const User = require('../models/User');
const { authenticate, requireEmployer } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function sanitizePayload(bodyData, user) {
  const location = bodyData.location || {};
  const userCoords = user?.coordinates?.coordinates;

  return {
    visibility: bodyData.visibility || 'private',
    personalData: {
      fullName: bodyData.personalData?.fullName || user?.name || '',
      email: bodyData.personalData?.email || user?.email || '',
      phone: bodyData.personalData?.phone || user?.phone || '',
      headline: bodyData.personalData?.headline || '',
      summary: bodyData.personalData?.summary || ''
    },
    photo: bodyData.photo || user?.avatar || null,
    jobTitles: normalizeList(bodyData.jobTitles),
    skills: (bodyData.skills || []).map((skill) => ({
      name: String(skill.name || '').trim(),
      level: skill.level || 'intermedio'
    })).filter((skill) => skill.name),
    experience: (bodyData.experience || []).map(e => ({
      ...e,
      startDate: e.startDate || null,
      endDate: e.endDate || null
    })),
    education: (bodyData.education || []).map(e => ({
      ...e,
      startDate: e.startDate || null,
      endDate: e.endDate || null
    })),
    availability: {
      status: bodyData.availability?.status || 'a-convenir',
      mode: bodyData.availability?.mode || 'indistinto',
      hours: bodyData.availability?.hours || 'full-time'
    },
    location: {
      city: location.city || user?.address?.city || '',
      state: location.state || user?.address?.state || '',
      country: location.country || 'Argentina',
      coordinates: location.coordinates || {
        type: 'Point',
        coordinates: Array.isArray(userCoords) && userCoords.length === 2 ? userCoords : [0, 0]
      }
    },
    experienceLevel: bodyData.experienceLevel || 'entry',
    isActive: bodyData.isActive !== false
  };
}

function canViewFullCv(cv, viewer) {
  if (!viewer) return false;
  const viewerId = String(viewer._id || viewer.id || viewer.userId);
  if (String(cv.userId?._id || cv.userId) === viewerId) return true;
  if (viewer.role === 'admin') return true;
  if (viewer.role === 'employer' && ['public', 'recruiter-only'].includes(cv.visibility)) return true;
  return false;
}

router.get('/me', authenticate, async (req, res) => {
  try {
    const cv = await CurriculumVitae.findOne({ userId: req.userId });
    res.json({ success: true, data: cv || null });
  } catch (error) {
    logger.error('Get own CV error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener CV' });
  }
});

router.put('/me', authenticate, [
  body('visibility').optional().isIn(['private', 'public', 'recruiter-only']),
  body('personalData').optional().isObject(),
  body('photo').optional({ nullable: true }).isString(),
  body('jobTitles').optional().isArray(),
  body('skills').optional().isArray(),
  body('experience').optional().isArray(),
  body('education').optional().isArray(),
  body('availability').optional().isObject(),
  body('location').optional().isObject(),
  body('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead'])
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const payload = sanitizePayload(req.body, user);
    const cv = await CurriculumVitae.findOneAndUpdate(
      { userId: req.userId },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'CV guardado', data: cv });
  } catch (error) {
    logger.error('Save CV error:', error);
    res.status(500).json({ success: false, message: 'Error al guardar CV' });
  }
});

router.get('/search', authenticate, requireEmployer, [
  query('q').optional().trim().isLength({ max: 120 }),
  query('jobTitle').optional().trim().isLength({ max: 120 }),
  query('skills').optional().isString(),
  query('location').optional().trim().isLength({ max: 120 }),
  query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('page').optional().isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const filters = {
      q: req.query.q,
      jobTitle: req.query.jobTitle,
      skills: normalizeList(req.query.skills),
      location: req.query.location,
      experienceLevel: req.query.experienceLevel,
      limit: Math.min(parseInt(req.query.limit || '20', 10), 50),
      page: Math.max(parseInt(req.query.page || '1', 10), 1)
    };

    const cvs = await CurriculumVitae.searchForEmployers(filters);
    res.json({
      success: true,
      data: cvs.map((cv) => cv.toEmployerSummary()),
      meta: { page: filters.page, limit: filters.limit, count: cvs.length }
    });
  } catch (error) {
    logger.error('CV search error:', error);
    res.status(500).json({ success: false, message: 'Error al buscar candidatos' });
  }
});

router.get('/:id', authenticate, [
  param('id').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const [cv, viewer] = await Promise.all([
      CurriculumVitae.findById(req.params.id).populate('userId', 'name email phone avatar role'),
      User.findById(req.userId).select('role')
    ]);

    if (!cv) return res.status(404).json({ success: false, message: 'CV no encontrado' });
    if (!canViewFullCv(cv, viewer)) {
      return res.status(403).json({ success: false, message: 'No tenes permisos para ver este CV' });
    }

    res.json({ success: true, data: cv });
  } catch (error) {
    logger.error('Get CV detail error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener CV' });
  }
});

module.exports = router;
