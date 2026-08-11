import express from 'express';
import { body } from 'express-validator';
import { PronunciationAttempt, Lesson, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadAudio } from '../middleware/upload.js';

const router = express.Router();

// Submit pronunciation attempt
router.post('/attempt',
  authenticate,
  uploadAudio.single('audio'),
  [
    body('word_or_phrase').trim().isLength({ min: 1, max: 500 }),
    body('language_id').isIn(['en', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'zh', 'ar']),
    body('lesson_id').optional().isUUID(),
    validate
  ],
  async (req, res, next) => {
    try {
      const { word_or_phrase, language_id, lesson_id } = req.body;

      // Check if premium feature
      if (req.user.subscription_tier === 'free') {
        throw new AppError('Premium subscription required for pronunciation practice', 403);
      }

      const audio_url = req.file ? req.file.path : null;

      // Simulate pronunciation scoring (in production, integrate with speech API)
      const scores = {
        accuracy: Math.round((70 + Math.random() * 30) * 100) / 100,
        fluency: Math.round((60 + Math.random() * 40) * 100) / 100,
        completeness: Math.round((75 + Math.random() * 25) * 100) / 100,
        pronunciation: Math.round((65 + Math.random() * 35) * 100) / 100
      };

      const overall = Math.round((scores.accuracy + scores.fluency + scores.completeness + scores.pronunciation) / 4 * 100) / 100;

      const attempt = await PronunciationAttempt.create({
        user_id: req.user.id,
        lesson_id: lesson_id || null,
        word_or_phrase,
        language_id,
        audio_url,
        transcription: word_or_phrase, // In production, use STT API
        accuracy_score: scores.accuracy,
        fluency_score: scores.fluency,
        completeness_score: scores.completeness,
        pronunciation_score: scores.pronunciation,
        feedback: {
          overall_score: overall,
          strengths: ['Good rhythm', 'Clear vowels'],
          improvements: ['Work on R sounds', 'Practice intonation'],
          tips: ['Listen to native speakers', 'Record yourself and compare']
        }
      });

      res.status(201).json({
        success: true,
        data: {
          attempt,
          scores,
          overall_score: overall
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get pronunciation history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { language_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = { user_id: req.user.id };
    if (language_id) where.language_id = language_id;

    const { count, rows } = await PronunciationAttempt.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        attempts: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get pronunciation stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { language_id } = req.query;
    const where = { user_id: req.user.id };
    if (language_id) where.language_id = language_id;

    const attempts = await PronunciationAttempt.findAll({ where });

    const stats = {
      total_attempts: attempts.length,
      average_accuracy: 0,
      average_fluency: 0,
      average_completeness: 0,
      average_pronunciation: 0,
      overall_average: 0
    };

    if (attempts.length > 0) {
      stats.average_accuracy = Math.round(attempts.reduce((sum, a) => sum + (a.accuracy_score || 0), 0) / attempts.length * 100) / 100;
      stats.average_fluency = Math.round(attempts.reduce((sum, a) => sum + (a.fluency_score || 0), 0) / attempts.length * 100) / 100;
      stats.average_completeness = Math.round(attempts.reduce((sum, a) => sum + (a.completeness_score || 0), 0) / attempts.length * 100) / 100;
      stats.average_pronunciation = Math.round(attempts.reduce((sum, a) => sum + (a.pronunciation_score || 0), 0) / attempts.length * 100) / 100;
      stats.overall_average = Math.round((stats.average_accuracy + stats.average_fluency + stats.average_completeness + stats.average_pronunciation) / 4 * 100) / 100;
    }

    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
});

// Get text-to-speech (return audio URL or use TTS service)
router.post('/speak',
  authenticate,
  [body('text').trim().isLength({ min: 1, max: 500 }), body('language_id').isString(), validate],
  async (req, res, next) => {
    try {
      const { text, language_id } = req.body;

      // In production, integrate with Google TTS, AWS Polly, or similar
      // For now, return the text with phonetic hints
      const phoneticHints = {
        fr: 'Use French phonetic rules: nasal vowels, silent endings',
        es: "Roll your R's, clear vowel sounds",
        de: 'Pay attention to umlauts and ch sounds',
        it: 'Double consonants, musical intonation',
        ja: 'Pitch accent, mora timing',
        ko: 'Batchim rules, vowel harmony',
        zh: 'Tone patterns, retroflex consonants',
        ar: 'Emphatic consonants, vowel length'
      };

      res.json({
        success: true,
        data: {
          text,
          language_id,
          phonetic_hint: phoneticHints[language_id] || 'Practice with native speaker audio',
          audio_url: null // Would be generated by TTS service
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
