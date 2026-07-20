import express from 'express';
import { Notification, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheDelete } from '../utils/redis.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const cacheKey = `notifications:${userId}:${page}:${limit}:${unread_only}`;
    let data = await cacheGet(cacheKey);

    if (!data) {
      const where = { user_id: userId };
      if (unread_only === 'true') where.is_read = false;

      const { count, rows } = await Notification.findAndCountAll({
        where,
        include: [
          { model: User, as: 'sender', attributes: ['id', 'display_name', 'avatar_url'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false }
      });

      data = {
        notifications: rows,
        unread_count: unreadCount,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      };

      await cacheSet(cacheKey, data, 60);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) throw new AppError('Notification not found', 404);

    await notification.update({ is_read: true, read_at: new Date() });
    await cacheDelete(`notifications:${req.user.id}:*`);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: req.user.id, is_read: false } }
    );
    await cacheDelete(`notifications:${req.user.id}:*`);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) throw new AppError('Notification not found', 404);

    await notification.destroy();
    await cacheDelete(`notifications:${req.user.id}:*`);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

// Create notification (internal use)
export const createNotification = async ({ user_id, type, title, message, action_url, sender_id, metadata = {} }) => {
  try {
    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
      action_url,
      sender_id,
      metadata
    });

    await cacheDelete(`notifications:${user_id}:*`);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export default router;
