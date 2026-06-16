const logger = require('./logger');

const LEGACY_DEPRECATED_MSG = 'categoryId/subcategoryId is deprecated — use categoryIds[] query param (matches categories.categoryId)';

function checkCategoryQuery(req, res, next) {
  if (req.query.categoryId || req.query.subcategoryId) {
    logger.warn('RegressionGuard: legacy categoryId/subcategoryId used in query', {
      path: req.originalUrl,
      query: req.query
    });
  }
  next();
}

module.exports = { checkCategoryQuery, LEGACY_DEPRECATED_MSG };
