// Input validation utilities

const { ValidationError } = require('./errors');

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 */
function validatePassword(password, minLength = 8) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= minLength;
}

/**
 * Validate required fields
 */
function validateRequired(data, fields) {
  const errors = [];
  
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return true;
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = null) {
  if (typeof str !== 'string') {
    return '';
  }
  
  let sanitized = str.trim();
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize request body
 */
function validateRequestBody(req, schema) {
  const errors = [];
  const sanitized = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`
      });
      continue;
    }
    
    // Skip if not required and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push({
        field,
        message: `${field} must be of type ${rules.type}`
      });
      continue;
    }
    
    // String validation
    if (rules.type === 'string') {
      const sanitizedValue = sanitizeString(value, rules.maxLength);
      
      if (rules.minLength && sanitizedValue.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters`
        });
        continue;
      }
      
      if (rules.email && !validateEmail(sanitizedValue)) {
        errors.push({
          field,
          message: `${field} must be a valid email`
        });
        continue;
      }
      
      sanitized[field] = sanitizedValue;
    } else {
      sanitized[field] = value;
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return sanitized;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  sanitizeString,
  validateRequestBody
};

