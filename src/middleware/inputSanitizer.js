const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

const inputSanitizer = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') return next();
  const keys = Object.keys(req.body);
  if (keys.length === 0) return next();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = req.body[key];
    if (typeof value === 'string') {
      req.body[key] = value.replace(/<[^>]*>/g, '').trim();
    }
  }
  next();
};

module.exports = { inputSanitizer, sanitizeString };
