import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError } from './errorHandler.js';

const getBearerToken = (req) => {
  const header = req.headers.authorization;

  if (!header) return null;

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      throw new AppError('Authentication service unavailable', 500);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401));
      }

      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token', 401));
      }

      throw error;
    }

    if (!decoded?.userId) {
      throw new AppError('Invalid token payload', 401);
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (user.account_status === 'deactivated') {
      throw new AppError('Account deactivated', 401);
    }

    if (user.account_status === 'suspended') {
      throw new AppError('Account suspended', 403);
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token || !process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return next();
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (user && user.account_status === 'active') {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};