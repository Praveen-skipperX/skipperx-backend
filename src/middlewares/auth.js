import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json(errorResponse('Invalid or expired token'));
    }

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json(errorResponse('User not found'));
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json(errorResponse('Authentication failed'));
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        try {
          const decoded = verifyToken(token);
          const user = await User.findById(decoded.userId);

          if (user) {
            req.user = user;
            req.userId = user._id;
          }
        } catch (error) {
          // Silently fail for optional auth
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

export default { authenticate, optionalAuth };
