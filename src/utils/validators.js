/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (basic validation)
 * Can be extended with more sophisticated validation
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Basic validation: 10-15 digits, may include +, spaces, hyphens
  const phoneRegex = /^[\d\s\-+()]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Normalize phone number (remove spaces, hyphens, etc.)
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/[\s\-()]/g, '');
};

/**
 * Normalize email (lowercase, trim)
 */
export const normalizeEmail = (email) => {
  if (!email) return null;
  return email.toLowerCase().trim();
};

/**
 * Validate OTP format
 */
export const isValidOTP = (otp, length = 4) => {
  if (!otp) return false;
  const otpRegex = new RegExp(`^\\d{${length}}$`);
  return otpRegex.test(otp.toString());
};

/**
 * Sanitize input string
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

export default {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  normalizeEmail,
  isValidOTP,
  sanitizeString,
};
