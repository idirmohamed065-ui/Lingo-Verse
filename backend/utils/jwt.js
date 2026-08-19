import jwt from 'jsonwebtoken';

// Fail fast with a clear, operational error if JWT secrets are missing.
// Prevents a masked 500 ("Something went wrong") during login/register.
const requireSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 16) {
    const err = new Error(`Missing or invalid ${name} environment variable`);
    err.statusCode = 500;
    err.isOperational = true;
    throw err;
  }
  return value;
};

export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    requireSecret('JWT_SECRET'),
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    requireSecret('JWT_REFRESH_SECRET'),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export const generateVerificationToken = (email) => {
  return jwt.sign(
    { email, type: 'verification' },
    requireSecret('JWT_SECRET'),
    { expiresIn: '24h' }
  );
};

export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'password_reset' },
    requireSecret('JWT_SECRET'),
    { expiresIn: '1h' }
  );
};
