// Input Sanitization Middleware for Production Security

const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

// Sanitize string inputs
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and dangerous content
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Trim and normalize whitespace
  return clean.trim();
};

// Sanitize email
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  
  const clean = sanitizeString(email).toLowerCase();
  
  // Validate email format
  if (!validator.isEmail(clean)) {
    throw new Error('Invalid email format');
  }
  
  return clean;
};

// Sanitize phone number
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return phone;
  
  const clean = sanitizeString(phone);
  
  // Remove all non-digit characters except + and -
  const sanitized = clean.replace(/[^\d+\-]/g, '');
  
  if (sanitized.length < 4) {
    throw new Error('Invalid phone number format');
  }
  
  return sanitized;
};

// Sanitize password (no sanitization, just validation)
const validatePassword = (password) => {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password must be less than 128 characters');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new Error('Password is too common. Please choose a stronger password');
  }
  
  return password;
};

// Sanitize name
const sanitizeName = (name) => {
  if (typeof name !== 'string') return name;
  
  const clean = sanitizeString(name);
  
  // Allow only letters, spaces, and basic punctuation
  const sanitized = clean.replace(/[^a-zA-Z\s\-\.']/g, '');
  
  if (sanitized.length < 2) {
    throw new Error('Name must be at least 2 characters long');
  }
  
  if (sanitized.length > 100) {
    throw new Error('Name must be less than 100 characters');
  }
  
  return sanitized;
};

// Sanitize location
const sanitizeLocation = (location) => {
  if (typeof location !== 'string') return location;
  
  const clean = sanitizeString(location);
  
  // Allow letters, numbers, spaces, commas, and basic punctuation
  const sanitized = clean.replace(/[^a-zA-Z0-9\s,\-\.]/g, '');
  
  if (sanitized.length < 2) {
    throw new Error('Location must be at least 2 characters long');
  }
  
  if (sanitized.length > 200) {
    throw new Error('Location must be less than 200 characters');
  }
  
  return sanitized;
};

// Middleware function
const inputSanitizer = (req, res, next) => {
  try {
    // Sanitize request body
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
            sanitizedBody[key] = validatePassword(value);
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
            // For other fields, just sanitize strings
            sanitizedBody[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }
      }
      
      req.body = sanitizedBody;
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  inputSanitizer,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  validatePassword,
  sanitizeName,
  sanitizeLocation
};
