import express from 'express';
import { Lesson, Question, UserProgress } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get lesson questions
router.get('/:lessonId/questions', authenticate, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const lesson = await Lesson.findByPk(lessonId, {
      include: [{
        model: Question,
        as: 'questions',
        order: [['sort_order', 'ASC']],
        attributes: { exclude: ['correct_answer'] } // Don't send correct answers
      }]
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check premium access
    if (lesson.is_premium && req.user.subscription_tier === 'free') {
      throw new AppError('Premium subscription required', 403);
    }

    // Get previous progress
    const progress = await UserProgress.findOne({
      where: { user_id: userId, lesson_id: lessonId }
    });

    res.json({
      success: true,
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          lesson_type: lesson.lesson_type,
          xp_reward: lesson.xp_reward,
          estimated_minutes: lesson.estimated_minutes
        },
        questions: lesson.questions,
        previous_attempt: progress ? {
          status: progress.status,
          score: progress.score,
          best_score: progress.best_score,
          attempts_count: progress.attempts_count,
          mistakes: progress.mistakes_made
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get question hint
router.get('/:lessonId/questions/:questionId/hint', authenticate, async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByPk(questionId, {
      attributes: ['id', 'hint', 'question_type']
    });

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Deduct small XP for using hint (optional gamification)
    res.json({
      success: true,
      data: {
        hint: question.hint,
        xp_penalty: 1 // Small penalty for using hint
      }
    });
  } catch (error) {
    next(error);
  }
});

// Skip question (for premium users)
router.post('/:lessonId/questions/:questionId/skip', authenticate, async (req, res, next) => {
  try {
    if (req.user.subscription_tier === 'free') {
      throw new AppError('Premium feature: question skip', 403);
    }

    const { questionId } = req.params;
    const question = await Question.findByPk(questionId, {
      attributes: ['id', 'correct_answer', 'explanation']
    });

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    res.json({
      success: true,
      data: {
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        skipped: true
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
