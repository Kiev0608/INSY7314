const { auditLogger } = require('./auditLogger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  auditLogger.logError(err, req);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Invalid reference to related resource';
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    const message = 'Invalid CSRF token';
    error = { message, statusCode: 403 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Security-related errors
  if (err.message && err.message.includes('XSS')) {
    const message = 'Potentially malicious input detected';
    error = { message, statusCode: 400 };
  }

  if (err.message && err.message.includes('SQL injection')) {
    const message = 'Invalid input format';
    error = { message, statusCode: 400 };
  }

  // Banking-specific errors
  if (err.message && err.message.includes('Insufficient funds')) {
    const message = 'Insufficient funds for this transaction';
    error = { message, statusCode: 400 };
  }

  if (err.message && err.message.includes('Invalid SWIFT code')) {
    const message = 'Invalid SWIFT code provided';
    error = { message, statusCode: 400 };
  }

  if (err.message && err.message.includes('Account locked')) {
    const message = 'Account is temporarily locked due to security concerns';
    error = { message, statusCode: 423 };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error
    })
  };

  // Add request ID for tracking
  if (req.id) {
    response.requestId = req.id;
  }

  // Add security headers to error responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  res.status(statusCode).json(response);
};

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler
 */
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  next(error);
};

/**
 * Database connection error handler
 */
const handleDatabaseError = (error, req, res, next) => {
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed',
      message: 'Service temporarily unavailable'
    });
  }
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  handleValidationError,
  handleDatabaseError
};
