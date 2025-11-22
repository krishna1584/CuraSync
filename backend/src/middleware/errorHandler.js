const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  console.error('Error:', error);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    err = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const message = 'Duplicate field value entered';
    err = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    err = { message, statusCode: 400 };
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again.';
    err = { message, statusCode: 401 };
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please login again.';
    err = { message, statusCode: 401 };
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = { errorHandler };