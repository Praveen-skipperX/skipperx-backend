import config from '../config/index.js';
import { errorResponse } from '../utils/response.js';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json(
      errorResponse('Validation error', errors)
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      errorResponse(`${field} already exists`)
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(
      errorResponse('Invalid ID format')
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token expired'));
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // In production, don't leak error details
  const response = config.isProduction
    ? errorResponse('An error occurred')
    : errorResponse(message);

  return res.status(statusCode).json(response);
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  return res.status(404).json(
    errorResponse(`Route ${req.originalUrl} not found`)
  );
};

export default { errorHandler, notFoundHandler };
