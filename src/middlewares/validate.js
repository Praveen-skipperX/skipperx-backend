import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json(
      errorResponse('Validation failed', extractedErrors)
    );
  }

  next();
};

export default validate;
