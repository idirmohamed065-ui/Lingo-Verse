import express from 'express';
import { body } from 'express-validator';
import { AITutorSession, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { getTutorResponse, checkGrammar, generateLessonContent } from '../utils/ai.js';
import { cacheGet, cacheSet } from '../utils/redis.js';

const router = express.Router();

// Start new AI tutor session
router.post('/sessions',
  authenticate,
  [
    body('language_id').isIn(['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'zh', 'ar']),
    body('session_type').optional().isIn(['conversation', 'grammar', 'vocabulary', 'pronunciation', 'quiz']),
    body('title').optional().trim().isLength({ max: 200 }),
    validate
  ],
  async (req, res, next) => {
    try {
      const { language_id, session_type = 'conversation', title } = req.body;

      const session = await AITutorSession.create({
        user_id: req.user.id,
        language_id,
        session_type,
        title: title || `${session_type.charAt(0).toUpperCase() + session_type.slice(1)} Session`,
        messages: []
      });

      // Generate welcome message
      const welcomeResponse = await getTutorResponse(
        [{ role: 'user', content: 'Hello! I want to start learning.' }],
        language_id,
        session_type
      );

      const messages = [
        { role: 'assistant', content: welcomeResponse.content, timestamp: new Date() }
      ];

      await session.update({
        messages,
        total_messages: 1,
        total_tokens_used: welcomeResponse.usage?.total_tokens || 0
      });

      res.status(201).json({
        success: true,
        data: {
          session: await AITutorSession.findByPk(session.id),
          welcome_message: welcomeResponse.content
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's AI tutor sessions
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const { language_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = { user_id: req.user.id };
    if (language_id) where.language_id = language_id;

    const { count, rows } = await AITutorSession.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        sessions: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific session
router.get('/sessions/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await AITutorSession.findOne({
      where: { id: sessionId, user_id: req.user.id }
    });

    if (!session) throw new AppError('Session not found', 404);

    res.json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
});

// Send message to AI tutor
router.post('/sessions/:sessionId/message',
  authenticate,
  [body('message').trim().isLength({ min: 1, max: 2000 }), validate],
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      const session = await AITutorSession.findOne({
        where: { id: sessionId, user_id: req.user.id }
      });

      if (!session) throw new AppError('Session not found', 404);
      if (!session.is_active) throw new AppError('Session is closed', 400);

      // Build message history
      const messages = session.messages || [];
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      apiMessages.push({ role: 'user', content: message });

      // Get AI response
      const aiResponse = await getTutorResponse(
        apiMessages,
        session.language_id,
        session.session_type
      );

      // Update session
      const updatedMessages = [
        ...messages,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: aiResponse.content, timestamp: new Date() }
      ];

      await session.update({
        messages: updatedMessages,
        total_messages: updatedMessages.length,
        total_tokens_used: (session.total_tokens_used || 0) + (aiResponse.usage?.total_tokens || 0)
      });

      res.json({
        success: true,
        data: {
          response: aiResponse.content,
          session: await AITutorSession.findByPk(session.id)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Close session
router.patch('/sessions/:sessionId/close', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await AITutorSession.findOne({
      where: { id: sessionId, user_id: req.user.id }
    });

    if (!session) throw new AppError('Session not found', 404);

    await session.update({ is_active: false, ended_at: new Date() });
    res.json({ success: true, message: 'Session closed' });
  } catch (error) {
    next(error);
  }
});

// Grammar check
router.post('/grammar-check',
  authenticate,
  [body('text').trim().isLength({ min: 1, max: 5000 }), body('language_id').optional().isString(), validate],
  async (req, res, next) => {
    try {
      const { text, language_id = 'en' } = req.body;
      const result = await checkGrammar(text, language_id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// Generate custom lesson
router.post('/generate-lesson',
  authenticate,
  [
    body('topic').trim().isLength({ min: 1, max: 200 }),
    body('language_id').isIn(['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'zh', 'ar']),
    body('level').optional().isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    validate
  ],
  async (req, res, next) => {
    try {
      const { topic, language_id, level = 'A1' } = req.body;

      // Check if premium feature
      if (req.user.subscription_tier === 'free') {
        throw new AppError('Premium subscription required for AI lesson generation', 403);
      }

      const lessonContent = await generateLessonContent(topic, language_id, level);

      if (!lessonContent) {
        throw new AppError('Failed to generate lesson content', 500);
      }

      res.json({
        success: true,
        data: {
          topic,
          language_id,
          level,
          content: lessonContent
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Quick AI chat (no session persistence)
router.post('/quick-chat',
  authenticate,
  [
    body('message').trim().isLength({ min: 1, max: 2000 }),
    body('language_id').isIn(['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'zh', 'ar']),
    body('session_type').optional().isIn(['conversation', 'grammar', 'vocabulary', 'pronunciation', 'quiz']),
    validate
  ],
  async (req, res, next) => {
    try {
      const { message, language_id, session_type = 'conversation' } = req.body;

      const aiResponse = await getTutorResponse(
        [{ role: 'user', content: message }],
        language_id,
        session_type
      );

      res.json({
        success: true,
        data: { response: aiResponse.content }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
