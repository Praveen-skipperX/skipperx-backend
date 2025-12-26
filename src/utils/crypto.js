import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a string (OTP, password, etc.)
 */
export const hashString = async (str) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(str.toString(), salt);
    return hashed;
  } catch (error) {
    throw new Error('Error hashing string');
  }
};

/**
 * Compare a plain string with a hashed string
 */
export const compareHash = async (plainStr, hashedStr) => {
  try {
    const isMatch = await bcrypt.compare(plainStr.toString(), hashedStr);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing hash');
  }
};

/**
 * Generate a random numeric OTP
 */
export const generateNumericOTP = (length = 4) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Calculate OTP expiry time
 */
export const getOtpExpiryTime = (minutes = 3) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export default {
  hashString,
  compareHash,
  generateNumericOTP,
  getOtpExpiryTime,
};
