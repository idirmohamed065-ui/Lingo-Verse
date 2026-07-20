import express from 'express';
import { body } from 'express-validator';
import { Post, Comment, User, UserProgress, Course, Lesson, Friend } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get social feed
router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Get friend IDs
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

    const where = {
      [Op.or]: [
        { visibility: 'public' },
        { user_id: userId },
        { user_id: { [Op.in]: friendIds }, visibility: 'friends' }
      ]
    };

    if (type !== 'all') where.post_type = type;

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'display_name', 'username', 'avatar_url'] },
        { model: Comment, as: 'comments', limit: 3, include: [
          { model: User, as: 'author', attributes: ['id', 'display_name', 'avatar_url'] }
        ]}
      ],
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

// Create post
router.post('/posts',
  authenticate,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
    body('visibility').optional().isIn(['public', 'friends', 'private']),
    body('post_type').optional().isIn(['text', 'achievement', 'streak', 'lesson_complete', 'milestone']),
    validate
  ],
  async (req, res, next) => {
    try {
      const { content, visibility = 'public', post_type = 'text', language_id } = req.body;

      const post = await Post.create({
        user_id: req.user.id,
        content,
        visibility,
        post_type,
        language_id
      });

      const postWithAuthor = await Post.findByPk(post.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'display_name', 'username', 'avatar_url'] }]
      });

      await cacheInvalidatePattern('feed:*');

      res.status(201).json({
        success: true,
        data: { post: postWithAuthor }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Like/unlike post
router.post('/posts/:postId/like', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findByPk(postId);
    if (!post) throw new AppError('Post not found', 404);

    const newCount = post.likes_count + 1;
    await post.update({ likes_count: newCount });

    res.json({ success: true, data: { likes_count: newCount, liked: true } });
  } catch (error) {
    next(error);
  }
});

// Get post comments
router.get('/posts/:postId/comments', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const post = await Post.findByPk(postId);
    if (!post) throw new AppError('Post not found', 404);

    const { count, rows } = await Comment.findAndCountAll({
      where: { post_id: postId, parent_id: null },
      include: [
        { model: User, as: 'author', attributes: ['id', 'display_name', 'avatar_url'] },
        { model: Comment, as: 'replies', include: [
          { model: User, as: 'author', attributes: ['id', 'display_name', 'avatar_url'] }
        ]}
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add comment
router.post('/posts/:postId/comments',
  authenticate,
  [body('content').trim().isLength({ min: 1, max: 1000 }), validate],
  async (req, res, next) => {
    try {
      const { postId } = req.params;
      const { content, parent_id } = req.body;

      const post = await Post.findByPk(postId);
      if (!post) throw new AppError('Post not found', 404);

      const comment = await Comment.create({
        post_id: postId,
        user_id: req.user.id,
        content,
        parent_id: parent_id || null
      });

      await post.update({ comments_count: post.comments_count + 1 });

      const commentWithAuthor = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'display_name', 'avatar_url'] }]
      });

      res.status(201).json({
        success: true,
        data: { comment: commentWithAuthor }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Share achievement to social feed
router.post('/share/achievement', authenticate, async (req, res, next) => {
  try {
    const { achievement, message } = req.body;

    const post = await Post.create({
      user_id: req.user.id,
      content: message || `I just earned the "${achievement}" achievement!`,
      post_type: 'achievement',
      visibility: 'public',
      metadata: { achievement }
    });

    res.status(201).json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
});

// Share streak to social feed
router.post('/share/streak', authenticate, async (req, res, next) => {
  try {
    const { streak_days, message } = req.body;

    const post = await Post.create({
      user_id: req.user.id,
      content: message || `I'm on a ${streak_days}-day learning streak!`,
      post_type: 'streak',
      visibility: 'public',
      metadata: { streak_days }
    });

    res.status(201).json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
