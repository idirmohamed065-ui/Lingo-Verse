import express from 'express';
import { body } from 'express-validator';
import {
  User, Course, Lesson, Question, Post, Comment,
  AdminLog, Payment, Subscription, Badge, Language
} from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';
import { Op, fn, col } from 'sequelize';

const router = express.Router();

// All admin routes require admin or moderator role
router.use(authenticate, authorize('admin', 'moderator'));

// Log admin action
const logAction = async (adminId, action, targetType, targetId, details, req) => {
  await AdminLog.create({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });
};

// Dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const cacheKey = 'admin:dashboard';
    let stats = await cacheGet(cacheKey);

    if (!stats) {
      const [totalUsers, activeUsers, totalCourses, totalLessons, totalPosts, totalPayments] = await Promise.all([
        User.count(),
        User.count({ where: { account_status: 'active' } }),
        Course.count(),
        Lesson.count(),
        Post.count(),
        Payment.count({ where: { status: 'succeeded' } })
      ]);

      const recentUsers = await User.findAll({
        order: [['created_at', 'DESC']],
        limit: 5,
        attributes: ['id', 'display_name', 'email', 'created_at', 'account_status']
      });

      const recentPayments = await Payment.findAll({
        where: { status: 'succeeded' },
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [{ model: User, attributes: ['display_name', 'email'] }]
      });

      const subscriptionStats = await Subscription.findAll({
        attributes: ['tier', [fn('COUNT', col('tier')), 'count']],
        group: ['tier']
      });

      stats = {
        total_users: totalUsers,
        active_users: activeUsers,
        total_courses: totalCourses,
        total_lessons: totalLessons,
        total_posts: totalPosts,
        total_revenue: totalPayments,
        recent_users: recentUsers,
        recent_payments: recentPayments,
        subscription_stats: subscriptionStats
      };

      await cacheSet(cacheKey, stats, 300);
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// User management
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, role, status, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { display_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) where.role = role;
    if (status) where.account_status = status;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'display_name', 'email', 'username', 'role', 'account_status', 'total_xp', 'current_level', 'subscription_tier', 'created_at', 'last_login_at'],
      order: [[sort_by, sort_order]],
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

// Update user status
router.patch('/users/:userId/status',
  [body('account_status').isIn(['active', 'suspended', 'deactivated']), validate],
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { account_status, reason } = req.body;

      const user = await User.findByPk(userId);
      if (!user) throw new AppError('User not found', 404);

      await user.update({ account_status });
      await logAction(req.user.id, 'update_user_status', 'user', userId, { new_status: account_status, reason }, req);
      await cacheInvalidatePattern(`user:*:${userId}*`);

      res.json({ success: true, message: `User status updated to ${account_status}` });
    } catch (error) {
      next(error);
    }
  }
);

// Update user role
router.patch('/users/:userId/role',
  [body('role').isIn(['user', 'moderator', 'admin']), validate],
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await User.findByPk(userId);
      if (!user) throw new AppError('User not found', 404);

      await user.update({ role });
      await logAction(req.user.id, 'update_user_role', 'user', userId, { new_role: role }, req);

      res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
      next(error);
    }
  }
);

// Content moderation - posts
router.get('/moderation/posts', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, flagged } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (flagged === 'true') {
      where[Op.or] = [
        { content: { [Op.iLike]: '%spam%' } },
        { content: { [Op.iLike]: '%inappropriate%' } }
      ];
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'display_name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        posts: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/moderation/posts/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) throw new AppError('Post not found', 404);

    await post.destroy();
    await logAction(req.user.id, 'delete_post', 'post', postId, { reason }, req);

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

// Delete comment
router.delete('/moderation/comments/:commentId', async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    await comment.destroy();
    await logAction(req.user.id, 'delete_comment', 'comment', commentId, { reason }, req);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
});

// Course management
router.post('/courses',
  [
    body('language_id').isString(),
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('slug').trim().isLength({ min: 1, max: 200 }),
    body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    validate
  ],
  async (req, res, next) => {
    try {
      const course = await Course.create(req.body);
      await logAction(req.user.id, 'create_course', 'course', course.id, { title: course.title }, req);
      res.status(201).json({ success: true, data: { course } });
    } catch (error) {
      next(error);
    }
  }
);

// Lesson management
router.post('/lessons',
  [
    body('course_id').isUUID(),
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('slug').trim().isLength({ min: 1, max: 200 }),
    validate
  ],
  async (req, res, next) => {
    try {
      const lesson = await Lesson.create(req.body);
      await logAction(req.user.id, 'create_lesson', 'lesson', lesson.id, { title: lesson.title }, req);
      res.status(201).json({ success: true, data: { lesson } });
    } catch (error) {
      next(error);
    }
  }
);

// Question management
router.post('/questions',
  [
    body('lesson_id').isUUID(),
    body('question_type').isIn(['multiple_choice', 'translation', 'fill_blank', 'listening', 'speaking', 'matching', 'ordering', 'true_false']),
    body('question_text').trim().isLength({ min: 1 }),
    body('correct_answer').isObject(),
    validate
  ],
  async (req, res, next) => {
    try {
      const question = await Question.create(req.body);
      await logAction(req.user.id, 'create_question', 'question', question.id, {}, req);
      res.status(201).json({ success: true, data: { question } });
    } catch (error) {
      next(error);
    }
  }
);

// Badge management
router.post('/badges',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('display_name').trim().isLength({ min: 1, max: 200 }),
    body('requirement_type').isString(),
    validate
  ],
  async (req, res, next) => {
    try {
      const badge = await Badge.create(req.body);
      await logAction(req.user.id, 'create_badge', 'badge', badge.id, { name: badge.name }, req);
      res.status(201).json({ success: true, data: { badge } });
    } catch (error) {
      next(error);
    }
  }
);

// Admin logs
router.get('/logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, admin_id, action, target_type } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (admin_id) where.admin_id = admin_id;
    if (action) where.action = action;
    if (target_type) where.target_type = target_type;

    const { count, rows } = await AdminLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'admin', attributes: ['display_name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
