import express from 'express';
import { User, UserStreak } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get current streak info
router.get('/current', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const todayStreak = await UserStreak.findOne({
      where: { user_id: userId, streak_date: today }
    });

    const user = await User.findByPk(userId, {
      attributes: ['current_streak', 'longest_streak', 'daily_goal_minutes', 'last_activity_date']
    });

    let streakAtRisk = false;
    if (user.last_activity_date) {
      const lastDate = new Date(user.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      streakAtRisk = diffDays >= 1 && !todayStreak;
    }

    res.json({
      success: true,
      data: {
        current_streak: user.current_streak,
        longest_streak: user.longest_streak,
        daily_goal_minutes: user.daily_goal_minutes,
        today_progress: todayStreak ? {
          xp_earned: todayStreak.xp_earned,
          lessons_completed: todayStreak.lessons_completed,
          minutes_studied: todayStreak.minutes_studied,
          goal_reached: todayStreak.goal_reached
        } : null,
        streak_at_risk: streakAtRisk,
        last_activity_date: user.last_activity_date
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get streak history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    const userId = req.user.id;

    const where = {
      user_id: userId,
      streak_date: {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`
      }
    };

    if (month) {
      where.streak_date[Op.gte] = `${year}-${month.toString().padStart(2, '0')}-01`;
      where.streak_date[Op.lte] = `${year}-${month.toString().padStart(2, '0')}-31`;
    }

    const streaks = await UserStreak.findAll({
      where,
      order: [['streak_date', 'ASC']]
    });

    const streakMap = {};
    streaks.forEach(s => {
      streakMap[s.streak_date] = {
        xp: s.xp_earned,
        lessons: s.lessons_completed,
        minutes: s.minutes_studied,
        goal_reached: s.goal_reached,
        frozen: s.streak_frozen
      };
    });

    res.json({
      success: true,
      data: {
        year,
        month: month || null,
        streaks: streakMap,
        total_days_active: streaks.length,
        total_goal_days: streaks.filter(s => s.goal_reached).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Freeze streak (premium feature)
router.post('/freeze', authenticate, async (req, res, next) => {
  try {
    if (req.user.subscription_tier === 'free') {
      throw new AppError('Premium subscription required for streak freeze', 403);
    }

    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const todayStreak = await UserStreak.findOne({
      where: { user_id: userId, streak_date: today }
    });

    if (todayStreak && todayStreak.streak_frozen) {
      throw new AppError('Streak already frozen for today', 400);
    }

    if (todayStreak) {
      await todayStreak.update({ streak_frozen: true });
    } else {
      await UserStreak.create({
        user_id: userId,
        streak_date: today,
        streak_frozen: true,
        xp_earned: 0,
        lessons_completed: 0,
        minutes_studied: 0
      });
    }

    await cacheInvalidatePattern(`streaks:${userId}*`);

    res.json({ success: true, message: 'Streak frozen for today' });
  } catch (error) {
    next(error);
  }
});

// Get streak recovery options
router.get('/recovery', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayStreak = await UserStreak.findOne({
      where: { user_id: userId, streak_date: yesterdayStr }
    });

    const canRecover = !yesterdayStreak && user.current_streak > 0;

    res.json({
      success: true,
      data: {
        can_recover: canRecover,
        current_streak: user.current_streak,
        recovery_cost: canRecover ? Math.min(100, user.current_streak * 10) : 0,
        message: canRecover ? 'Complete a recovery lesson to save your streak!' : 'Your streak is safe!'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Recover streak
router.post('/recover', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayStreak = await UserStreak.findOne({
      where: { user_id: userId, streak_date: yesterdayStr }
    });

    if (yesterdayStreak) {
      throw new AppError('Streak is already active', 400);
    }

    await UserStreak.create({
      user_id: userId,
      streak_date: yesterdayStr,
      xp_earned: 10,
      lessons_completed: 1,
      minutes_studied: 5,
      goal_reached: false
    });

    await cacheInvalidatePattern(`streaks:${userId}*`);
    await cacheInvalidatePattern(`user:profile:${userId}*`);

    res.json({
      success: true,
      message: 'Streak recovered successfully!',
      data: { current_streak: user.current_streak }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
