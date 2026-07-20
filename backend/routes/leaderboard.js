import express from 'express';
import { User, UserProgress, Friend } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../utils/redis.js';
import { Op } from 'sequelize';

const router = express.Router();

// Global leaderboard
router.get('/global', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, period = 'all_time' } = req.query;
    const offset = (page - 1) * limit;
    const cacheKey = `leaderboard:global:${period}:${page}:${limit}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const where = { account_status: 'active' };
      let order = [['total_xp', 'DESC']];

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: ['id', 'display_name', 'username', 'avatar_url', 'total_xp', 'current_level', 'current_streak', 'lessons_completed', 'total_words_learned'],
        order,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const leaderboard = rows.map((user, index) => ({
        rank: offset + index + 1,
        ...user.toJSON()
      }));

      data = {
        leaderboard,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      };

      await cacheSet(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Friends leaderboard
router.get('/friends', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `leaderboard:friends:${userId}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const friends = await Friend.findAll({
        where: {
          [Op.or]: [
            { user_id: userId, status: 'accepted' },
            { friend_id: userId, status: 'accepted' }
          ]
        }
      });

      const friendIds = friends.map(f =>
        f.user_id === userId ? f.friend_id : f.user_id
      );
      friendIds.push(userId);

      const users = await User.findAll({
        where: { id: { [Op.in]: friendIds }, account_status: 'active' },
        attributes: ['id', 'display_name', 'username', 'avatar_url', 'total_xp', 'current_level', 'current_streak', 'lessons_completed'],
        order: [['total_xp', 'DESC']]
      });

      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        is_me: user.id === userId,
        ...user.toJSON()
      }));

      data = { leaderboard };
      await cacheSet(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Language-specific leaderboard
router.get('/language/:languageId', async (req, res, next) => {
  try {
    const { languageId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const cacheKey = `leaderboard:lang:${languageId}:${page}:${limit}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const progress = await UserProgress.findAll({
        where: { language_id: languageId, status: 'completed' },
        attributes: [
          'user_id',
          [require('sequelize').fn('SUM', require('sequelize').col('xp_earned')), 'total_xp'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'lessons_completed']
        ],
        group: ['user_id'],
        order: [[require('sequelize').fn('SUM', require('sequelize').col('xp_earned')), 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const userIds = progress.map(p => p.user_id);
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'display_name', 'username', 'avatar_url', 'current_level']
      });

      const userMap = {};
      users.forEach(u => { userMap[u.id] = u; });

      const leaderboard = progress.map((p, index) => ({
        rank: offset + index + 1,
        user: userMap[p.user_id] || null,
        total_xp: parseInt(p.get('total_xp')),
        lessons_completed: parseInt(p.get('lessons_completed'))
      }));

      data = { leaderboard };
      await cacheSet(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get user rank
router.get('/my-rank', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `leaderboard:rank:${userId}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const higherRanked = await User.count({
        where: {
          account_status: 'active',
          total_xp: { [Op.gt]: req.user.total_xp }
        }
      });

      data = {
        global_rank: higherRanked + 1,
        total_xp: req.user.total_xp,
        current_level: req.user.current_level,
        current_streak: req.user.current_streak
      };

      await cacheSet(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
