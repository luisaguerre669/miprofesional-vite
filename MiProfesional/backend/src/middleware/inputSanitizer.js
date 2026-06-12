const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').replace(/[\${}]/, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const k of Object.keys(value)) {
      sanitized[k] = sanitizeValue(value[k]);
    }
    return sanitized;
  }
  return value;
};

const SKIP_FIELDS = new Set(['password', 'newPassword', 'currentPassword', 'confirmPassword', 'token']);

const inputSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    for (let i = 0; i < keys.length; i++) {
      if (SKIP_FIELDS.has(keys[i])) continue;
      req.body[keys[i]] = sanitizeValue(req.body[keys[i]]);
    }
  }
  if (req.query && typeof req.query === 'object') {
    for (const k of Object.keys(req.query)) {
      req.query[k] = sanitizeValue(req.query[k]);
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const k of Object.keys(req.params)) {
      req.params[k] = sanitizeValue(req.params[k]);
    }
  }
  next();
};

module.exports = { inputSanitizer };
