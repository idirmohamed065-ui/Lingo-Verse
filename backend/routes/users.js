import express from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User, UserProgress, UserStreak, Badge, UserBadge, Achievement, Friend, Notification, Post } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';

const router = express.Router();

// Get user profile (public or private based on settings)
router.get('/profile/:userId?', async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id;
    if (!userId) {
      throw new AppError('User ID required', 400);
    }

    const cacheKey = `user:profile:${userId}`;
    let profile = await cacheGet(cacheKey);

    if (!profile) {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'display_name', 'username', 'avatar_url', 'bio', 'total_xp', 'current_level', 'total_words_learned', 'lessons_completed', 'current_streak', 'longest_streak', 'created_at', 'privacy_settings']
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const privacy = user.privacy_settings || {};

      // Check privacy
      if (!privacy.profile_visible && (!req.user || req.user.id !== userId)) {
        throw new AppError('Profile is private', 403);
      }

      const badges = await UserBadge.findAll({
        where: { user_id: userId },
        include: [{ model: Badge, as: 'badges' }]
      });

      const achievements = await Achievement.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      const recentPosts = await Post.findAll({
        where: { user_id: userId, visibility: 'public' },
        order: [['created_at', 'DESC']],
        limit: 5
      });

      profile = {
        user: {
          id: user.id,
          display_name: user.display_name,
          username: user.username,
          avatar_url: user.avatar_url,
          bio: user.bio,
          total_xp: privacy.show_xp || req.user?.id === userId ? user.total_xp : null,
          current_level: user.current_level,
          total_words_learned: user.total_words_learned,
          lessons_completed: user.lessons_completed,
          current_streak: privacy.show_streak || req.user?.id === userId ? user.current_streak : null,
          longest_streak: user.longest_streak,
          member_since: user.created_at,
          badges: badges.map(b => b.badge),
          achievements: achievements,
          recent_posts: recentPosts
        }
      };

      await cacheSet(cacheKey, profile, 300);
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/profile',
  authenticate,
  upload.single('avatar'),
  [
    body('display_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('daily_goal_minutes').optional().isInt({ min: 5, max: 120 }),
    validate
  ],
  async (req, res, next) => {
    try {
      const updates = {};
      const allowedFields = ['display_name', 'bio', 'daily_goal_minutes', 'timezone', 'native_language', 'privacy_settings', 'notification_preferences'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (req.file) {
        updates.avatar_url = req.file.path;
      }

      await req.user.update(updates);
      await cacheInvalidatePattern(`user:profile:${req.user.id}*`);

      res.json({
        success: true,
        message: 'Profile updated',
        data: { user: req.user }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Change password
router.post('/change-password',
  authenticate,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 }),
    validate
  ],
  async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;

      const isValid = await bcrypt.compare(current_password, req.user.password_hash);
      if (!isValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      const newHash = await bcrypt.hash(new_password, 12);
      await req.user.update({ password_hash: newHash });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user:stats:${userId}`;

    let stats = await cacheGet(cacheKey);

    if (!stats) {
      const progress = await UserProgress.findAll({
        where: { user_id: userId, status: 'completed' }
      });

      const streaks = await UserStreak.findAll({
        where: { user_id: userId },
        order: [['streak_date', 'DESC']],
        limit: 30
      });

      const totalLessons = progress.length;
      const totalTime = progress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);
      const avgScore = progress.length > 0 ? progress.reduce((sum, p) => sum + p.score, 0) / progress.length : 0;

      const languageProgress = {};
      progress.forEach(p => {
        if (!languageProgress[p.language_id]) {
          languageProgress[p.language_id] = { lessons: 0, xp: 0, words: 0 };
        }
        languageProgress[p.language_id].lessons++;
        languageProgress[p.language_id].xp += p.xp_earned;
        languageProgress[p.language_id].words += (p.words_learned || []).length;
      });

      stats = {
        total_lessons: totalLessons,
        total_time_minutes: Math.floor(totalTime / 60),
        average_score: Math.round(avgScore),
        current_streak: req.user.current_streak,
        longest_streak: req.user.longest_streak,
        total_xp: req.user.total_xp,
        current_level: req.user.current_level,
        words_learned: req.user.total_words_learned,
        language_progress: languageProgress,
        recent_streaks: streaks.map(s => ({
          date: s.streak_date,
          xp: s.xp_earned,
          lessons: s.lessons_completed,
          goal_reached: s.goal_reached
        }))
      };

      await cacheSet(cacheKey, stats, 300);
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Get user badges
router.get('/badges', authenticate, async (req, res, next) => {
  try {
    const userBadges = await UserBadge.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Badge, as: 'badges' }],
      order: [['earned_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        badges: userBadges.map(ub => ({
          ...ub.badge.toJSON(),
          earned_at: ub.earned_at,
          context: ub.context_data
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get achievements
router.get('/achievements', authenticate, async (req, res, next) => {
  try {
    const achievements = await Achievement.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { achievements }
    });
  } catch (error) {
    next(error);
  }
});

// Get learning activity (heatmap data)
router.get('/activity', authenticate, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const streaks = await UserStreak.findAll({
      where: {
        user_id: req.user.id,
        streak_date: {
          [require('sequelize').Op.gte]: `${year}-01-01`,
          [require('sequelize').Op.lte]: `${year}-12-31`
        }
      },
      order: [['streak_date', 'ASC']]
    });

    const activityMap = {};
    streaks.forEach(s => {
      activityMap[s.streak_date] = {
        xp: s.xp_earned,
        lessons: s.lessons_completed,
        minutes: s.minutes_studied,
        goal_reached: s.goal_reached
      };
    });

    res.json({
      success: true,
      data: { activity: activityMap }
    });
  } catch (error) {
    next(error);
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };
    if (unread_only === 'true') {
      where.is_read = false;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        unread_count: await Notification.count({ where: { user_id: req.user.id, is_read: false } }),
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await notification.update({ is_read: true, read_at: new Date() });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.post('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/account', authenticate, async (req, res, next) => {
  try {
    const { password } = req.body;

    const isValid = await bcrypt.compare(password, req.user.password_hash);
    if (!isValid) {
      throw new AppError('Password is incorrect', 400);
    }

    await req.user.update({ account_status: 'deactivated' });
    await cacheInvalidatePattern(`user:*:${req.user.id}*`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all users
router.get('/admin/list', authenticate, authorize('admin', 'moderator'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, role, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[require('sequelize').Op.or] = [
        { display_name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { username: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) where.role = role;
    if (status) where.account_status = status;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'display_name', 'email', 'username', 'role', 'account_status', 'total_xp', 'current_level', 'subscription_tier', 'created_at', 'last_login_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
