import express from 'express';
import { UserProgress, UserStreak, User, Lesson, Course } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get overall progress
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `progress:overview:${userId}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const allProgress = await UserProgress.findAll({
        where: { user_id: userId }
      });

      const totalLessons = allProgress.length;
      const completedLessons = allProgress.filter(p => p.status === 'completed').length;
      const inProgressLessons = allProgress.filter(p => p.status === 'in_progress').length;
      const totalXp = allProgress.reduce((sum, p) => sum + p.xp_earned, 0);
      const totalTime = allProgress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);

      // Language breakdown
      const languageStats = {};
      allProgress.forEach(p => {
        if (!languageStats[p.language_id]) {
          languageStats[p.language_id] = { lessons: 0, completed: 0, xp: 0, time: 0 };
        }
        languageStats[p.language_id].lessons++;
        if (p.status === 'completed') languageStats[p.language_id].completed++;
        languageStats[p.language_id].xp += p.xp_earned;
        languageStats[p.language_id].time += p.time_spent_seconds || 0;
      });

      // Recent activity
      const recentProgress = await UserProgress.findAll({
        where: { user_id: userId },
        include: [
          { model: Lesson, as: 'lesson', attributes: ['title'] },
          { model: Course, as: 'course', attributes: ['title', 'language_id'] }
        ],
        order: [['updated_at', 'DESC']],
        limit: 10
      });

      // Streak info
      const today = new Date().toISOString().split('T')[0];
      const todayStreak = await UserStreak.findOne({
        where: { user_id: userId, streak_date: today }
      });

      data = {
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        completion_rate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        total_xp: totalXp,
        total_time_minutes: Math.floor(totalTime / 60),
        current_level: req.user.current_level,
        current_streak: req.user.current_streak,
        longest_streak: req.user.longest_streak,
        today_xp: todayStreak?.xp_earned || 0,
        today_lessons: todayStreak?.lessons_completed || 0,
        today_minutes: todayStreak?.minutes_studied || 0,
        daily_goal: req.user.daily_goal_minutes,
        goal_reached: todayStreak?.goal_reached || false,
        language_stats: languageStats,
        recent_activity: recentProgress
      };

      await cacheSet(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get daily stats
router.get('/daily', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const streak = await UserStreak.findOne({
      where: { user_id: userId, streak_date: date }
    });

    if (!streak) {
      return res.json({
        success: true,
        data: {
          date,
          xp_earned: 0,
          lessons_completed: 0,
          minutes_studied: 0,
          goal_reached: false,
          goal_minutes: req.user.daily_goal_minutes
        }
      });
    }

    res.json({
      success: true,
      data: {
        date: streak.streak_date,
        xp_earned: streak.xp_earned,
        lessons_completed: streak.lessons_completed,
        minutes_studied: streak.minutes_studied,
        goal_reached: streak.goal_reached,
        goal_minutes: req.user.daily_goal_minutes
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get weekly progress
router.get('/weekly', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const streaks = await UserStreak.findAll({
      where: {
        user_id: userId,
        streak_date: {
          [require('sequelize').Op.gte]: weekStart.toISOString().split('T')[0],
          [require('sequelize').Op.lte]: today.toISOString().split('T')[0]
        }
      },
      order: [['streak_date', 'ASC']]
    });

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const streak = streaks.find(s => s.streak_date === dateStr);

      weekData.push({
        date: dateStr,
        day_name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        xp: streak?.xp_earned || 0,
        lessons: streak?.lessons_completed || 0,
        minutes: streak?.minutes_studied || 0,
        goal_reached: streak?.goal_reached || false
      });
    }

    res.json({
      success: true,
      data: {
        week_data: weekData,
        total_xp: weekData.reduce((sum, d) => sum + d.xp, 0),
        total_lessons: weekData.reduce((sum, d) => sum + d.lessons, 0),
        total_minutes: weekData.reduce((sum, d) => sum + d.minutes, 0),
        days_active: weekData.filter(d => d.xp > 0).length,
        goal_days: weekData.filter(d => d.goal_reached).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get skill breakdown
router.get('/skills', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const progress = await UserProgress.findAll({
      where: { user_id: userId, status: 'completed' },
      include: [{
        model: Lesson,
        as: 'lesson',
        attributes: ['lesson_type']
      }]
    });

    const skillStats = {
      vocabulary: { completed: 0, total_score: 0, avg_score: 0 },
      grammar: { completed: 0, total_score: 0, avg_score: 0 },
      conversation: { completed: 0, total_score: 0, avg_score: 0 },
      listening: { completed: 0, total_score: 0, avg_score: 0 },
      reading: { completed: 0, total_score: 0, avg_score: 0 },
      writing: { completed: 0, total_score: 0, avg_score: 0 },
      pronunciation: { completed: 0, total_score: 0, avg_score: 0 }
    };

    progress.forEach(p => {
      const type = p.lesson?.lesson_type || 'vocabulary';
      if (skillStats[type]) {
        skillStats[type].completed++;
        skillStats[type].total_score += p.score || 0;
      }
    });

    Object.keys(skillStats).forEach(key => {
      const stat = skillStats[key];
      stat.avg_score = stat.completed > 0 ? Math.round(stat.total_score / stat.completed) : 0;
      delete stat.total_score;
    });

    res.json({ success: true, data: { skills: skillStats } });
  } catch (error) {
    next(error);
  }
});

export default router;
