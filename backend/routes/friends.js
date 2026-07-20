import express from 'express';
import { body } from 'express-validator';
import { Friend, User, UserProgress, UserStreak } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { Op } from 'sequelize';

const router = express.Router();

// Search users
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!q || q.length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: req.user.id } },
          {
            [Op.or]: [
              { display_name: { [Op.iLike]: `%${q}%` } },
              { username: { [Op.iLike]: `%${q}%` } },
              { email: { [Op.iLike]: `%${q}%` } }
            ]
          }
        ]
      },
      attributes: ['id', 'display_name', 'username', 'avatar_url', 'total_xp', 'current_level', 'native_language'],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const friendStatuses = await Friend.findAll({
      where: {
        [Op.or]: [
          { user_id: req.user.id },
          { friend_id: req.user.id }
        ]
      }
    });

    const statusMap = {};
    friendStatuses.forEach(f => {
      const otherId = f.user_id === req.user.id ? f.friend_id : f.user_id;
      statusMap[otherId] = f.status;
    });

    const usersWithStatus = users.map(u => ({
      ...u.toJSON(),
      friendship_status: statusMap[u.id] || 'none'
    }));

    res.json({ success: true, data: { users: usersWithStatus } });
  } catch (error) {
    next(error);
  }
});

// Send friend request
router.post('/request',
  authenticate,
  [body('friend_id').isUUID(), body('message').optional().trim().isLength({ max: 500 }), validate],
  async (req, res, next) => {
    try {
      const { friend_id, message } = req.body;

      if (friend_id === req.user.id) {
        throw new AppError('Cannot add yourself as friend', 400);
      }

      const existing = await Friend.findOne({
        where: {
          [Op.or]: [
            { user_id: req.user.id, friend_id },
            { user_id: friend_id, friend_id: req.user.id }
          ]
        }
      });

      if (existing) {
        throw new AppError('Friend request already exists or you are already friends', 409);
      }

      const friendRequest = await Friend.create({
        user_id: req.user.id,
        friend_id,
        status: 'pending',
        request_message: message
      });

      res.status(201).json({
        success: true,
        message: 'Friend request sent',
        data: { friend_request: friendRequest }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Accept/decline/block friend request
router.patch('/request/:friendId',
  authenticate,
  [body('status').isIn(['accepted', 'declined', 'blocked']), validate],
  async (req, res, next) => {
    try {
      const { friendId } = req.params;
      const { status } = req.body;

      const friendRequest = await Friend.findOne({
        where: {
          friend_id: req.user.id,
          user_id: friendId,
          status: 'pending'
        }
      });

      if (!friendRequest) {
        throw new AppError('Friend request not found', 404);
      }

      const updates = { status };
      if (status === 'accepted') updates.accepted_at = new Date();

      await friendRequest.update(updates);

      res.json({
        success: true,
        message: `Friend request ${status}`,
        data: { friend_request: friendRequest }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get friends list
router.get('/list', authenticate, async (req, res, next) => {
  try {
    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { user_id: req.user.id, status: 'accepted' },
          { friend_id: req.user.id, status: 'accepted' }
        ]
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'display_name', 'username', 'avatar_url', 'total_xp', 'current_level', 'current_streak'] },
        { model: User, as: 'recipient', attributes: ['id', 'display_name', 'username', 'avatar_url', 'total_xp', 'current_level', 'current_streak'] }
      ]
    });

    const friendList = friends.map(f => {
      const isRequester = f.user_id === req.user.id;
      const friend = isRequester ? f.recipient : f.requester;
      return {
        ...friend.toJSON(),
        friendship_id: f.id,
        accepted_at: f.accepted_at
      };
    });

    res.json({ success: true, data: { friends: friendList } });
  } catch (error) {
    next(error);
  }
});

// Get pending requests
router.get('/pending', authenticate, async (req, res, next) => {
  try {
    const pending = await Friend.findAll({
      where: {
        friend_id: req.user.id,
        status: 'pending'
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'display_name', 'username', 'avatar_url'] }
      ]
    });

    res.json({
      success: true,
      data: { requests: pending }
    });
  } catch (error) {
    next(error);
  }
});

// Remove friend
router.delete('/:friendId', authenticate, async (req, res, next) => {
  try {
    const { friendId } = req.params;

    const friendship = await Friend.findOne({
      where: {
        [Op.or]: [
          { user_id: req.user.id, friend_id: friendId },
          { user_id: friendId, friend_id: req.user.id }
        ]
      }
    });

    if (!friendship) throw new AppError('Friendship not found', 404);

    await friendship.destroy();
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    next(error);
  }
});

// Get friend activity
router.get('/activity', authenticate, async (req, res, next) => {
  try {
    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { user_id: req.user.id, status: 'accepted' },
          { friend_id: req.user.id, status: 'accepted' }
        ]
      }
    });

    const friendIds = friends.map(f => 
      f.user_id === req.user.id ? f.friend_id : f.user_id
    );

    const recentActivity = await UserProgress.findAll({
      where: { user_id: { [Op.in]: friendIds } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'display_name', 'avatar_url'] },
        { model: Lesson, as: 'lesson', attributes: ['title'] },
        { model: Course, as: 'course', attributes: ['title'] }
      ],
      order: [['updated_at', 'DESC']],
      limit: 20
    });

    res.json({ success: true, data: { activity: recentActivity } });
  } catch (error) {
    next(error);
  }
});

export default router;
