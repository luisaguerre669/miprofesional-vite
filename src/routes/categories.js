// Categories Routes for MiProfesional Backend

const express = require('express');
const { query, param, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

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

// GET /api/v1/categories
router.get('/', [
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('sortBy').optional().isIn(['name', 'count', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      search,
      isActive = true,
      sortBy = 'title',
      sortOrder = 'asc',
      limit = 20,
      page = 1
    } = req.query;

    let query = { isActive, parentCategory: null };

    // Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('parentCategory', 'title')
        .populate('subcategories', 'title slug image'),
      Category.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info('Categories retrieved', {
      count: categories.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Get categories error', { error: error.message, query: req.query });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      message: 'An error occurred while retrieving categories'
    });
  }
});

// GET /api/v1/categories/featured
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const categories = await Category.findFeatured(limit);

    logger.info('Featured categories retrieved', { count: categories.length, limit });

    res.json({
      success: true,
      message: 'Featured categories retrieved successfully',
      data: categories
    });

  } catch (error) {
    logger.error('Get featured categories error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured categories',
      message: 'An error occurred while retrieving featured categories'
    });
  }
});

// GET /api/v1/categories/popular
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const categories = await Category.findPopular(limit);

    logger.info('Popular categories retrieved', { count: categories.length, limit });

    res.json({
      success: true,
      message: 'Popular categories retrieved successfully',
      data: categories
    });

  } catch (error) {
    logger.error('Get popular categories error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve popular categories',
      message: 'An error occurred while retrieving popular categories'
    });
  }
});

// GET /api/v1/categories/24-7
router.get('/24-7', async (req, res) => {
  try {
    const categories = await Category.find247();

    logger.info('24-7 categories retrieved', { count: categories.length });

    res.json({
      success: true,
      message: '24-7 categories retrieved successfully',
      data: categories
    });

  } catch (error) {
    logger.error('Get 24-7 categories error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve 24-7 categories',
      message: 'An error occurred while retrieving 24-7 categories'
    });
  }
});

// Mapa de términos de búsqueda → slug de categoría sugerida
const CATEGORY_TERM_MAP = {
  comercio: [
    'pizza', 'pizzeria', 'farmacia', 'kiosco', 'quiosco', 'optica', 'lentes', 'anteojos',
    'panaderia', 'pan', 'cafeteria', 'cafe', 'bar', 'veterinaria', 'mascotas',
    'rotiseria', 'hamburgueseria', 'hamburguesas', 'heladeria', 'helado', 'helados',
    'confiteria', 'torta', 'carniceria', 'carne', 'verduleria', 'floreria', 'flores',
    'libreria', 'libros', 'ferreteria', 'pintureria', 'pintura', 'corralon', 'materiales',
    'bicicleteria', 'bicicleta', 'informatica', 'computadora', 'notebook',
    'celular', 'telefono', 'ropa', 'zapateria', 'zapatos', 'jugueteria', 'juguetes',
    'regaleria', 'regalos', 'dietetica', 'naturales', 'vinoteca', 'vino', 'vinos',
    'comercio', 'negocio', 'tienda', 'local',
  ],
  'servicios-24-7': [
    'urgente', 'urgencia', 'emergencia', '24', '24-7', '24/7', 'noche', 'madrugada',
  ],
  salud: [
    'medico', 'doctor', 'clinica', 'psicologo', 'kinesiologo', 'enfermero', 'dentista',
  ],
  'belleza-y-cuidado': [
    'peluqueria', 'manicuria', 'masaje', 'depilacion', 'estetica', 'barbero', 'maquillaje',
  ],
};

// GET /api/v1/categories/suggest?q=pizza
router.get('/suggest', [
  query('q').notEmpty().isLength({ min: 2, max: 100 }).withMessage('Search query is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { q } = req.query;
    const lower = q.toLowerCase().trim();

    // Encontrar qué slug de categoría corresponde al término buscado
    let suggestedSlug = null;
    for (const [slug, terms] of Object.entries(CATEGORY_TERM_MAP)) {
      if (terms.some(term => lower.includes(term) || term.includes(lower) && lower.length >= 4)) {
        suggestedSlug = slug;
        break;
      }
    }

    if (!suggestedSlug) {
      return res.json({ success: true, data: null, message: 'No suggestion found' });
    }

    // Buscar la categoría en la BD
    const category = await Category.findOne({ slug: suggestedSlug, isActive: true })
      .select('title slug icon metadata image');

    logger.info('Category suggestion', { query: q, suggestedSlug, found: !!category });

    res.json({
      success: true,
      message: 'Suggestion found',
      data: category || null,
      suggestedSlug,
    });

  } catch (error) {
    logger.error('Category suggest error', { error: error.message, q: req.query.q });
    res.status(500).json({
      success: false,
      error: 'Suggestion failed',
      message: 'An error occurred while generating suggestion'
    });
  }
});

// GET /api/v1/categories/search
router.get('/search', [
  query('q').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Search query is required and must be between 1 and 100 characters'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const { q: query, limit = 20, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categories = await Category.search(query, {
      limit: parseInt(limit),
      skip,
      sortBy: 'title',
      sortOrder: 'asc'
    });

    logger.info('Categories search', {
      query,
      count: categories.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: categories,
      meta: {
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        count: categories.length
      }
    });

  } catch (error) {
    logger.error('Categories search error', { error: error.message, query: req.query.q });
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'An error occurred while searching categories'
    });
  }
});

// GET /api/v1/categories/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Category.getStats();

    logger.info('Categories stats retrieved', stats);

    res.json({
      success: true,
      message: 'Category statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Get categories stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category statistics',
      message: 'An error occurred while retrieving category statistics'
    });
  }
});

// GET /api/v1/categories/tree
router.get('/tree', async (req, res) => {
  try {
    const parents = await Category.find({ isActive: true, parentCategory: null })
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        select: 'title slug icon description image metadata.color sortOrder professionalCount'
      })
      .sort({ sortOrder: 1, title: 1 })
      .select('title slug icon description image metadata.color sortOrder professionalCount commerceTypes commerceSubcategories commerceTags');

    logger.info('Category tree retrieved', { count: parents.length });

    res.json({
      success: true,
      message: 'Category tree retrieved successfully',
      data: parents
    });

  } catch (error) {
    logger.error('Get category tree error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category tree',
      message: 'An error occurred while retrieving the category tree'
    });
  }
});

// GET /api/v1/categories/commerce-types — List all commerce types and their subcategories
router.get('/commerce-types', async (req, res) => {
  try {
    const cat = await Category.findOne({ slug: 'comercio', isActive: true })
      .select('commerceTypes commerceSubcategories commerceTags');

    if (!cat) {
      return res.json({
        success: true,
        data: { types: [], subcategories: {}, tags: [] }
      });
    }

    const subcategories = {};
    if (cat.commerceSubcategories) {
      for (const [type, subs] of cat.commerceSubcategories) {
        subcategories[type] = subs;
      }
    }

    res.json({
      success: true,
      data: {
        types: cat.commerceTypes || [],
        subcategories,
        tags: cat.commerceTags || []
      }
    });
  } catch (error) {
    logger.error('Get commerce types error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve commerce types',
      message: 'An error occurred while retrieving commerce types'
    });
  }
});

// GET /api/v1/categories/:id
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parentCategory', 'title')
      .populate('subcategories', 'title slug professionalCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'Category with the specified ID was not found'
      });
    }

    logger.info('Category retrieved', { categoryId: id, title: category.title });

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });

  } catch (error) {
    logger.error('Get category error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category',
      message: 'An error occurred while retrieving the category'
    });
  }
});

// GET /api/v1/categories/slug/:slug
router.get('/slug/:slug', [
  param('slug').isSlug().withMessage('Invalid slug format')
], handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;

    let category = await Category.findOne({ slug, isActive: true })
      .populate('subcategories', 'title slug image description metadata');
    if (!category) {
      if (slug === 'servicios-24-7') {
        category = await Category.findOne({ slug: '24-7', isActive: true })
          .populate('subcategories', 'title slug image description metadata');
      } else if (slug === '24-7') {
        category = await Category.findOne({ slug: 'servicios-24-7', isActive: true })
          .populate('subcategories', 'title slug image description metadata');
      }
    }
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'Category with the specified slug was not found'
      });
    }

    logger.info('Category retrieved by slug', { slug, categoryId: category._id });

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });

  } catch (error) {
    logger.error('Get category by slug error', { error: error.message, slug: req.params.slug });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category',
      message: 'An error occurred while retrieving the category'
    });
  }
});

// POST /api/v1/categories (Admin only)
router.post('/', [
  authenticate, requireAdmin
], async (req, res) => {
  try {
    const categoryData = req.body;

    // Check if category with same title already exists
    const existingCategory = await Category.findOne({ title: categoryData.title });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category already exists',
        message: 'A category with this title already exists'
      });
    }

    const category = new Category(categoryData);
    await category.save();

    logger.info('Category created', { categoryId: category._id, title: category.title });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    logger.error('Create category error', { error: error.message, data: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to create category',
      message: 'An error occurred while creating the category'
    });
  }
});

// PUT /api/v1/categories/:id (Admin only)
router.put('/:id', [
  authenticate, requireAdmin,
  param('id').isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'Category with the specified ID was not found'
      });
    }

    logger.info('Category updated', { categoryId: id, title: category.title });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });

  } catch (error) {
    logger.error('Update category error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
      message: 'An error occurred while updating the category'
    });
  }
});

// DELETE /api/v1/categories/:id (Admin only)
router.delete('/:id', [
  authenticate, requireAdmin,
  param('id').isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'Category with the specified ID was not found'
      });
    }

    logger.info('Category deleted', { categoryId: id, title: category.title });

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: category
    });

  } catch (error) {
    logger.error('Delete category error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to delete category',
      message: 'An error occurred while deleting the category'
    });
  }
});

// POST /api/v1/categories/:id/toggle-featured (Admin only)
router.post('/:id/toggle-featured', [
  authenticate, requireAdmin,
  param('id').isMongoId().withMessage('Invalid category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'Category with the specified ID was not found'
      });
    }

    await category.toggleFeatured();

    logger.info('Category featured status toggled', {
      categoryId: id,
      title: category.title,
      featured: category.metadata.featured
    });

    res.json({
      success: true,
      message: `Category ${category.metadata.featured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        categoryId: category._id,
        featured: category.metadata.featured
      }
    });

  } catch (error) {
    logger.error('Toggle category featured error', { error: error.message, categoryId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle featured status',
      message: 'An error occurred while toggling the category featured status'
    });
  }
});

module.exports = router;
