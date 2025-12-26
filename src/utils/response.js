/**
 * Standard API response format
 */
export const successResponse = (data = null, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Standard API error response format
 */
export const errorResponse = (message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Pagination helper
 */
export const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

  return {
    skip: (pageNum - 1) * limitNum,
    limit: limitNum,
    page: pageNum,
  };
};

export default {
  successResponse,
  errorResponse,
  paginate,
};
