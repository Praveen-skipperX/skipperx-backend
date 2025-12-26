import { errorResponse } from '../utils/response.js';

/**
 * Simple rate limiter for OTP requests
 * Stores requests in memory (for production, use Redis)
 */
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 3) {
    this.windowMs = windowMs; // Time window in milliseconds
    this.maxRequests = maxRequests; // Max requests per window
    this.requests = new Map(); // Store: identifier -> [timestamps]
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  /**
   * Get remaining time until next request is allowed
   */
  getRetryAfter(identifier) {
    const userRequests = this.requests.get(identifier) || [];
    if (userRequests.length === 0) return 0;

    const oldestRequest = Math.min(...userRequests);
    const retryAfter = Math.ceil((this.windowMs - (Date.now() - oldestRequest)) / 1000);

    return Math.max(0, retryAfter);
  }

  /**
   * Clear old entries periodically
   */
  cleanup() {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs
      );

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Create rate limiter instance for OTP requests
// 3 requests per minute per identifier
const otpRateLimiter = new RateLimiter(60000, 3);

// Cleanup every 5 minutes
setInterval(() => otpRateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Rate limiting middleware for OTP requests
 */
export const otpRateLimit = (req, res, next) => {
  const identifier = req.body.email || req.body.phone;

  if (!identifier) {
    return next();
  }

  if (!otpRateLimiter.isAllowed(identifier)) {
    const retryAfter = otpRateLimiter.getRetryAfter(identifier);

    return res.status(429).json(
      errorResponse(
        `Too many requests. Please try again after ${retryAfter} seconds`
      )
    );
  }

  next();
};

export default { otpRateLimit };
