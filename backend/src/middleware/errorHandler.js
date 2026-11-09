const multer = require('multer');

const errorHandler = (error, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let statusCode = error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = error.message;

  console.error('Error:', error);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (error.name === 'MongoServerError' && error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(val => val.message).join(', ');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please login again.';
  }

  // Upload errors (file too large, wrong field, rejected file type)
  if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10MB)' : error.message;
  }

  // Never expose internal error text for server errors in production
  if (statusCode >= 500 && isProduction) {
    message = 'Server Error';
  }

  res.status(statusCode).json({
    success: false,
    message: message || 'Server Error',
    error: message || 'Server Error',
    ...(!isProduction && { stack: error.stack })
  });
};

module.exports = { errorHandler };
