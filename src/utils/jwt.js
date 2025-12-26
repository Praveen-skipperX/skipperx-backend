import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate JWT token
 */
export const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
    return token;
  } catch (error) {
    throw new Error('Error generating token');
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode token without verification (useful for debugging)
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Error decoding token');
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
};
