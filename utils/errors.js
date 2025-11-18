// Custom Error Classes for consistent error handling

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.constructor.name;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    statusCode: err.statusCode
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Prepare error response
  const errorResponse = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  };

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.errors = err.errors;
  }

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  errorHandler
};

