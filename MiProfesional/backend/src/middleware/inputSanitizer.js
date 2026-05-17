const validator = require('validator');

const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  const clean = email.replace(/<[^>]*>/g, '').trim().toLowerCase();
  return clean;
};

const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;
  const clean = phone.replace(/<[^>]*>/g, '').trim();
  return clean.replace(/[^\d+\-]/g, '');
};

const sanitizeName = (name) => {
  if (typeof name !== 'string') return name;
  const clean = name.replace(/<[^>]*>/g, '').trim();
  return clean.replace(/[^a-zA-Z\s\-\.']/g, '');
};

const sanitizeLocation = (location) => {
  if (typeof location !== 'string') return location;
  const clean = location.replace(/<[^>]*>/g, '').trim();
  return clean.replace(/[^a-zA-Z0-9\s,\-\.]/g, '');
};

const inputSanitizer = (req, res, next) => {
  try {
    if (req.body) {
      const sanitizedBody = {};
      for (const [key, value] of Object.entries(req.body)) {
        switch (key) {
          case 'email':
            sanitizedBody[key] = sanitizeEmail(value);
            break;
          case 'password':
          case 'confirmPassword':
          case 'newPassword':
            sanitizedBody[key] = typeof value === 'string' ? value : value;
            break;
          case 'phone':
            sanitizedBody[key] = sanitizePhone(value);
            break;
          case 'name':
          case 'firstName':
          case 'lastName':
            sanitizedBody[key] = sanitizeName(value);
            break;
          case 'location':
          case 'address':
          case 'city':
          case 'country':
            sanitizedBody[key] = sanitizeLocation(value);
            break;
          case 'message':
          case 'description':
          case 'bio':
            sanitizedBody[key] = sanitizeString(value);
            break;
          default:
            sanitizedBody[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }
      }
      req.body = sanitizedBody;
    }
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    next();
  }
};

module.exports = {
  inputSanitizer,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeLocation
};
