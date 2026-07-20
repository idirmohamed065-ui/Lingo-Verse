import express from 'express';
import { Course, Lesson, Language, UserProgress, User } from '../models/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../utils/redis.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all languages
router.get('/languages', async (req, res, next) => {
  try {
    const cacheKey = 'languages:all';
    let languages = await cacheGet(cacheKey);

    if (!languages) {
      languages = await Language.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC']]
      });
      await cacheSet(cacheKey, languages, 3600);
    }

    res.json({ success: true, data: { languages } });
  } catch (error) {
    next(error);
  }
});

// Get language details with courses
router.get('/languages/:languageId', async (req, res, next) => {
  try {
    const { languageId } = req.params;
    const cacheKey = `language:${languageId}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const language = await Language.findByPk(languageId);
      if (!language) {
        throw new AppError('Language not found', 404);
      }

      const courses = await Course.findAll({
        where: { language_id: languageId, is_active: true },
        order: [['sort_order', 'ASC']],
        include: [{
          model: Lesson,
          as: 'lessons',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'title', 'sort_order', 'lesson_type', 'xp_reward', 'is_premium']
        }]
      });

      data = { language, courses };
      await cacheSet(cacheKey, data, 1800);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get all courses (with optional language filter)
router.get('/', async (req, res, next) => {
  try {
    const { language, level, search } = req.query;
    const where = { is_active: true };

    if (language) where.language_id = language;
    if (level) where.level = level;

    const courses = await Course.findAll({
      where,
      include: [
        { model: Language, as: 'language', attributes: ['name', 'flag_emoji'] },
        { model: Lesson, as: 'lessons', where: { is_active: true }, required: false, attributes: ['id'] }
      ],
      order: [['sort_order', 'ASC']]
    });

    res.json({ success: true, data: { courses } });
  } catch (error) {
    next(error);
  }
});

// Get course details with lessons
router.get('/:courseId', optionalAuth, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const cacheKey = `course:${courseId}${userId ? ':user:' + userId : ''}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const course = await Course.findByPk(courseId, {
        include: [
          { model: Language, as: 'language' },
          {
            model: Lesson,
            as: 'lessons',
            where: { is_active: true },
            required: false,
            order: [['sort_order', 'ASC']]
          }
        ]
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Check if premium course and user has access
      let hasAccess = true;
      if (course.is_premium && req.user) {
        hasAccess = req.user.subscription_tier !== 'free';
      } else if (course.is_premium && !req.user) {
        hasAccess = false;
      }

      // Get user progress if authenticated
      let userProgress = {};
      if (userId) {
        const progress = await UserProgress.findAll({
          where: { user_id: userId, course_id: courseId }
        });
        progress.forEach(p => {
          userProgress[p.lesson_id] = p.status;
        });
      }

      data = { course, hasAccess, userProgress };
      await cacheSet(cacheKey, data, 600);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get lesson details with questions
router.get('/lessons/:lessonId', authenticate, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const cacheKey = `lesson:${lessonId}:user:${userId}`;

    let data = await cacheGet(cacheKey);

    if (!data) {
      const lesson = await Lesson.findByPk(lessonId, {
        include: [
          { model: Course, as: 'course', include: [{ model: Language, as: 'language' }] },
          {
            model: require('../models/index.js').Question,
            as: 'questions',
            order: [['sort_order', 'ASC']]
          }
        ]
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // Check premium access
      if (lesson.is_premium && req.user.subscription_tier === 'free') {
        throw new AppError('Premium subscription required for this lesson', 403);
      }

      // Get or create progress
      let progress = await UserProgress.findOne({
        where: { user_id: userId, lesson_id: lessonId }
      });

      if (!progress) {
        progress = await UserProgress.create({
          user_id: userId,
          lesson_id: lessonId,
          course_id: lesson.course_id,
          language_id: lesson.course.language_id,
          status: 'in_progress',
          started_at: new Date()
        });
      }

      data = { lesson, progress };
      await cacheSet(cacheKey, data, 300);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Submit lesson answers
router.post('/lessons/:lessonId/submit', authenticate, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { answers, time_spent_seconds } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findByPk(lessonId, {
      include: [{ model: Question, as: 'questions' }]
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check premium access
    if (lesson.is_premium && req.user.subscription_tier === 'free') {
      throw new AppError('Premium subscription required', 403);
    }

    // Calculate score
    let correctCount = 0;
    const mistakes = [];
    const wordsLearned = [];

    const questions = lesson.questions || [];
    answers.forEach((answer, index) => {
      const question = questions[index];
      if (!question) return;

      let isCorrect = false;
      if (question.question_type === 'multiple_choice') {
        isCorrect = answer.selected === question.correct_answer.correct_index;
      } else if (question.question_type === 'translation' || question.question_type === 'fill_blank') {
        const normalizedAnswer = (answer.text || '').toLowerCase().trim();
        const normalizedCorrect = (question.correct_answer.text || '').toLowerCase().trim();
        isCorrect = normalizedAnswer === normalizedCorrect;
      }

      if (isCorrect) {
        correctCount++;
      } else {
        mistakes.push({
          question_id: question.id,
          question_text: question.question_text,
          user_answer: answer,
          correct_answer: question.correct_answer,
          explanation: question.explanation
        });
      }

      // Extract vocabulary
      if (question.metadata && question.metadata.vocabulary) {
        wordsLearned.push(...question.metadata.vocabulary);
      }
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const xpEarned = Math.round((score / 100) * lesson.xp_reward);
    const isCompleted = score >= 70;

    // Update progress
    let progress = await UserProgress.findOne({
      where: { user_id: userId, lesson_id: lessonId }
    });

    if (!progress) {
      progress = await UserProgress.create({
        user_id: userId,
        lesson_id: lessonId,
        course_id: lesson.course_id,
        language_id: lesson.language_id || 'fr',
        status: isCompleted ? 'completed' : 'in_progress',
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        time_spent_seconds: time_spent_seconds || 0,
        xp_earned: xpEarned,
        answers_data: answers,
        mistakes_made: mistakes,
        words_learned: [...new Set(wordsLearned)],
        completed_at: isCompleted ? new Date() : null,
        attempts_count: 1,
        best_score: score
      });
    } else {
      const newAttempts = progress.attempts_count + 1;
      const newBestScore = Math.max(progress.best_score, score);
      const newStatus = isCompleted || progress.status === 'completed' ? 'completed' : 'in_progress';
      const newXp = newStatus === 'completed' && progress.status !== 'completed' ? xpEarned : 0;

      await progress.update({
        status: newStatus,
        score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        time_spent_seconds: (progress.time_spent_seconds || 0) + (time_spent_seconds || 0),
        xp_earned: progress.xp_earned + newXp,
        answers_data: answers,
        mistakes_made: mistakes,
        words_learned: [...new Set([...(progress.words_learned || []), ...wordsLearned])],
        completed_at: newStatus === 'completed' && !progress.completed_at ? new Date() : progress.completed_at,
        attempts_count: newAttempts,
        best_score: newBestScore
      });
    }

    // Update user stats
    const user = await User.findByPk(userId);
    const totalNewXp = progress.xp_earned;
    const newWordsCount = (progress.words_learned || []).length;
    const newLessonsCompleted = newStatus === 'completed' && progress.status !== 'completed' ? user.lessons_completed + 1 : user.lessons_completed;

    // Calculate level
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const xpThresholds = [0, 1000, 3000, 6000, 10000, 15000];
    let newLevel = 'A1';
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (user.total_xp + totalNewXp >= xpThresholds[i]) {
        newLevel = levels[i];
        break;
      }
    }

    await user.update({
      total_xp: user.total_xp + totalNewXp,
      total_words_learned: newWordsCount,
      lessons_completed: newLessonsCompleted,
      current_level: newLevel
    });

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    let streak = await UserStreak.findOne({
      where: { user_id: userId, streak_date: today }
    });

    if (!streak) {
      streak = await UserStreak.create({
        user_id: userId,
        streak_date: today,
        xp_earned: totalNewXp,
        lessons_completed: 1,
        minutes_studied: Math.floor((time_spent_seconds || 0) / 60)
      });
    } else {
      await streak.update({
        xp_earned: streak.xp_earned + totalNewXp,
        lessons_completed: streak.lessons_completed + 1,
        minutes_studied: streak.minutes_studied + Math.floor((time_spent_seconds || 0) / 60)
      });
    }

    // Check daily goal
    const goalReached = streak.minutes_studied >= user.daily_goal_minutes;
    if (goalReached && !streak.goal_reached) {
      await streak.update({ goal_reached: true });
    }

    // Invalidate caches
    await cacheInvalidatePattern(`lesson:${lessonId}:user:${userId}*`);
    await cacheInvalidatePattern(`user:stats:${userId}*`);
    await cacheInvalidatePattern(`user:profile:${userId}*`);
    await cacheInvalidatePattern(`course:*:user:${userId}*`);

    res.json({
      success: true,
      data: {
        score,
        correct_count: correctCount,
        total_questions: totalQuestions,
        xp_earned: totalNewXp,
        is_completed: newStatus === 'completed',
        mistakes,
        words_learned: wordsLearned,
        new_level: newLevel !== user.current_level ? newLevel : null,
        streak_updated: true,
        goal_reached: goalReached
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user progress for a course
router.get('/:courseId/progress', authenticate, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await UserProgress.findAll({
      where: { user_id: userId, course_id: courseId },
      include: [{
        model: Lesson,
        as: 'lesson',
        attributes: ['id', 'title', 'sort_order', 'xp_reward']
      }]
    });

    const completedLessons = progress.filter(p => p.status === 'completed').length;
    const totalXp = progress.reduce((sum, p) => sum + p.xp_earned, 0);

    res.json({
      success: true,
      data: {
        progress,
        completed_lessons: completedLessons,
        total_lessons: progress.length,
        completion_percentage: progress.length > 0 ? Math.round((completedLessons / progress.length) * 100) : 0,
        total_xp: totalXp
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
