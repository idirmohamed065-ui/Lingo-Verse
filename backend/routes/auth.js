import express from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User, UserStreak, Language } from '../models/index.js';
import { generateTokens, generateVerificationToken, generatePasswordResetToken, verifyAccessToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheSet, cacheGet } from '../utils/redis.js';

const router = express.Router();

// Register
router.post('/register',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('display_name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('language').isIn(['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'zh', 'ar']).withMessage('Invalid language selection'),
    validate
  ],
  async (req, res, next) => {
    try {
      const { email, password, display_name, language, username } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      const password_hash = await bcrypt.hash(password, 12);
      // Token will be generated after user creation

      const user = await User.create({
        email,
        password_hash,
        display_name,
        username: username || email.split('@')[0],
        native_language: language,
        email_verification_token: verificationToken,
        account_status: 'pending_verification'
      });

      // Send verification email
      await sendVerificationEmail(email, verificationToken, display_name);

      // Create initial streak record
      await UserStreak.create({
        user_id: user.id,
        streak_date: new Date().toISOString().split('T')[0],
        xp_earned: 0,
        lessons_completed: 0
      });

      const { accessToken, refreshToken } = generateTokens(user.id);

      res.status(201).json({
        success: true,
        message: 'Account created. Please verify your email.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            role: user.role,
            account_status: user.account_status
          },
          tokens: { accessToken, refreshToken }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post('/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate
  ],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      if (user.account_status === 'suspended') {
        throw new AppError('Account suspended', 403);
      }

      // Update login info
      await user.update({
        login_count: user.login_count + 1,
        last_login_at: new Date(),
        last_login_ip: req.ip
      });

      // Check and update streak
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = user.last_activity_date;

      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          await user.update({ current_streak: user.current_streak + 1 });
          if (user.current_streak + 1 > user.longest_streak) {
            await user.update({ longest_streak: user.current_streak + 1 });
          }
        } else if (diffDays > 1) {
          await user.update({ current_streak: 1 });
        }
      }

      await user.update({ last_activity_date: today });

      const { accessToken, refreshToken } = generateTokens(user.id);

      // Cache user session
      await cacheSet(`session:${user.id}`, {
        id: user.id,
        email: user.email,
        role: user.role,
        display_name: user.display_name
      }, 86400);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            username: user.username,
            avatar_url: user.avatar_url,
            role: user.role,
            total_xp: user.total_xp,
            current_level: user.current_level,
            current_streak: user.current_streak,
            longest_streak: user.longest_streak,
            total_words_learned: user.total_words_learned,
            lessons_completed: user.lessons_completed,
            subscription_tier: user.subscription_tier,
            daily_goal_minutes: user.daily_goal_minutes,
            native_language: user.native_language,
            account_status: user.account_status,
            email_verified: user.email_verified
          },
          tokens: { accessToken, refreshToken }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401);
    }

    const decoded = verifyAccessToken(refreshToken);
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || user.account_status !== 'active') {
      throw new AppError('User not found or inactive', 401);
    }

    const tokens = generateTokens(user.id);

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new AppError('Verification token required', 400);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.userId);

    if (!user || user.email_verification_token !== token) {
      throw new AppError('Invalid or expired token', 400);
    }

    await user.update({
      email_verified: true,
      account_status: 'active',
      email_verification_token: null
    });

    await sendWelcomeEmail(user.email, user.display_name);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password',
  authRateLimiter,
  [body('email').isEmail().normalizeEmail(), validate],
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If an account exists, a reset email has been sent'
        });
      }

      const resetToken = generatePasswordResetToken(user.id);
      await user.update({
        password_reset_token: resetToken,
        password_reset_expires: new Date(Date.now() + 3600000) // 1 hour
      });

      await sendPasswordResetEmail(email, resetToken, user.display_name);

      res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password
router.post('/reset-password',
  authRateLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
    validate
  ],
  async (req, res, next) => {
    try {
      const { token, password } = req.body;

      const decoded = verifyAccessToken(token);
      const user = await User.findByPk(decoded.userId);

      if (!user || user.password_reset_token !== token || new Date() > user.password_reset_expires) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const password_hash = await bcrypt.hash(password, 12);
      await user.update({
        password_hash,
        password_reset_token: null,
        password_reset_expires: null
      });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  // Invalidate cache
  await cacheDelete(`session:${req.user.id}`);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
