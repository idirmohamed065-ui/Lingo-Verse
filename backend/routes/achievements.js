import express from 'express';
import { Achievement, Badge, UserBadge, User, UserProgress, UserStreak } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all available badges
router.get('/badges', async (req, res, next) => {
  try {
    const { category, rarity } = req.query;
    const where = { is_active: true };
    if (category) where.category = category;
    if (rarity) where.rarity = rarity;

    const badges = await Badge.findAll({
      where,
      order: [['requirement_value', 'ASC']]
    });

    res.json({ success: true, data: { badges } });
  } catch (error) {
    next(error);
  }
});

// Get user's badges
router.get('/my-badges', authenticate, async (req, res, next) => {
  try {
    const userBadges = await UserBadge.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Badge, as: 'badges' }],
      order: [['earned_at', 'DESC']]
    });

    const badges = userBadges.map(ub => ({
      ...ub.badge.toJSON(),
      earned_at: ub.earned_at,
      context: ub.context_data
    }));

    res.json({ success: true, data: { badges } });
  } catch (error) {
    next(error);
  }
});

// Get user's achievements
router.get('/my-achievements', authenticate, async (req, res, next) => {
  try {
    const achievements = await Achievement.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: { achievements } });
  } catch (error) {
    next(error);
  }
});

// Check and award badges
router.post('/check-badges', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const newlyEarned = [];

    const existingBadgeIds = await UserBadge.findAll({
      where: { user_id: userId },
      attributes: ['badge_id']
    });
    const existingIds = existingBadgeIds.map(b => b.badge_id);

    const availableBadges = await Badge.findAll({
      where: {
        is_active: true,
        id: { [Op.notIn]: existingIds.length > 0 ? existingIds : [''] }
      }
    });

    for (const badge of availableBadges) {
      let earned = false;
      let context = {};

      switch (badge.requirement_type) {
        case 'streak':
          if (user.current_streak >= badge.requirement_value) {
            earned = true;
            context = { streak_days: user.current_streak };
          }
          break;
        case 'words':
          if (user.total_words_learned >= badge.requirement_value) {
            earned = true;
            context = { words_learned: user.total_words_learned };
          }
          break;
        case 'lessons':
          if (user.lessons_completed >= badge.requirement_value) {
            earned = true;
            context = { lessons_completed: user.lessons_completed };
          }
          break;
        case 'score':
          const perfectLessons = await UserProgress.count({
            where: { user_id: userId, score: 100 }
          });
          if (perfectLessons >= badge.requirement_value) {
            earned = true;
            context = { perfect_lessons: perfectLessons };
          }
          break;
        case 'time':
          const nightStudy = await UserStreak.findOne({
            where: {
              user_id: userId,
              created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          });
          if (nightStudy) {
            earned = true;
            context = { study_time: 'after_midnight' };
          }
          break;
      }

      if (earned) {
        await UserBadge.create({
          user_id: userId,
          badge_id: badge.id,
          context_data: context
        });

        await Achievement.create({
          user_id: userId,
          title: `Earned: ${badge.display_name}`,
          description: badge.description,
          category: 'achievement',
          xp_reward: 50
        });

        newlyEarned.push({
          badge: badge.toJSON(),
          context
        });
      }
    }

    if (newlyEarned.length > 0) {
      await cacheInvalidatePattern(`user:profile:${userId}*`);
    }

    res.json({
      success: true,
      data: {
        newly_earned: newlyEarned,
        total_badges: existingIds.length + newlyEarned.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get achievement progress
router.get('/progress', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    const allBadges = await Badge.findAll({ where: { is_active: true } });
    const userBadges = await UserBadge.findAll({ where: { user_id: userId } });
    const earnedIds = userBadges.map(ub => ub.badge_id);

    const progress = allBadges.map(badge => {
      const earned = earnedIds.includes(badge.id);
      let progress_pct = 0;
      let current_value = 0;

      switch (badge.requirement_type) {
        case 'streak':
          current_value = user.current_streak;
          progress_pct = Math.min(100, Math.round((user.current_streak / badge.requirement_value) * 100));
          break;
        case 'words':
          current_value = user.total_words_learned;
          progress_pct = Math.min(100, Math.round((user.total_words_learned / badge.requirement_value) * 100));
          break;
        case 'lessons':
          current_value = user.lessons_completed;
          progress_pct = Math.min(100, Math.round((user.lessons_completed / badge.requirement_value) * 100));
          break;
      }

      return {
        ...badge.toJSON(),
        earned,
        earned_at: earned ? userBadges.find(ub => ub.badge_id === badge.id)?.earned_at : null,
        progress: progress_pct,
        current_value,
        target_value: badge.requirement_value
      };
    });

    res.json({ success: true, data: { progress } });
  } catch (error) {
    next(error);
  }
});

export default router;
