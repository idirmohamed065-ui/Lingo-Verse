import { sequelize, User, Language, Course, Lesson, Question, Badge } from '../backend/models/index.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Languages
    const languages = [
      { id: 'en', name: 'English', native_name: 'English', flag_emoji: '🇬🇧', language_family: 'Germanic', difficulty_rating: 'easy', sort_order: 1 },
      { id: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷', language_family: 'Romance', difficulty_rating: 'medium', sort_order: 2 },
      { id: 'es', name: 'Spanish', native_name: 'Español', flag_emoji: '🇪🇸', language_family: 'Romance', difficulty_rating: 'easy', sort_order: 3 },
      { id: 'de', name: 'German', native_name: 'Deutsch', flag_emoji: '🇩🇪', language_family: 'Germanic', difficulty_rating: 'medium', sort_order: 4 },
      { id: 'it', name: 'Italian', native_name: 'Italiano', flag_emoji: '🇮🇹', language_family: 'Romance', difficulty_rating: 'easy', sort_order: 5 },
      { id: 'ja', name: 'Japanese', native_name: '日本語', flag_emoji: '🇯🇵', language_family: 'Japonic', difficulty_rating: 'hard', sort_order: 6 },
      { id: 'ko', name: 'Korean', native_name: '한국어', flag_emoji: '🇰🇷', language_family: 'Koreanic', difficulty_rating: 'hard', sort_order: 7 },
      { id: 'zh', name: 'Chinese', native_name: '中文', flag_emoji: '🇨🇳', language_family: 'Sino-Tibetan', difficulty_rating: 'hard', sort_order: 8 },
      { id: 'ar', name: 'Arabic', native_name: 'العربية', flag_emoji: '🇸🇦', language_family: 'Semitic', difficulty_rating: 'hard', sort_order: 9 },
    ];

    for (const lang of languages) {
      await Language.findOrCreate({ where: { id: lang.id }, defaults: lang });
    }
    console.log('✅ Languages seeded');

    // Demo Users
    const passwordHash = await bcrypt.hash('password', 12);
    const adminHash = await bcrypt.hash('admin123', 12);

    const users = [
      {
        email: 'learner@lingoverse.com',
        password_hash: passwordHash,
        display_name: 'Alex Johnson',
        username: 'alexj',
        role: 'user',
        account_status: 'active',
        email_verified: true,
        native_language: 'en',
        total_xp: 12450,
        current_level: 'B1',
        total_words_learned: 342,
        lessons_completed: 89,
        current_streak: 45,
        longest_streak: 67,
        last_activity_date: new Date().toISOString().split('T')[0]
      },
      {
        email: 'admin@lingoverse.com',
        password_hash: adminHash,
        display_name: 'Admin User',
        username: 'admin',
        role: 'admin',
        account_status: 'active',
        email_verified: true,
        native_language: 'en',
        total_xp: 25600,
        current_level: 'C1',
        total_words_learned: 890,
        lessons_completed: 234,
        current_streak: 89,
        longest_streak: 120,
        last_activity_date: new Date().toISOString().split('T')[0]
      },
      {
        email: 'sarah@example.com',
        password_hash: passwordHash,
        display_name: 'Sarah Chen',
        username: 'sarahc',
        role: 'user',
        account_status: 'active',
        email_verified: true,
        native_language: 'en',
        total_xp: 5430,
        current_level: 'A2',
        total_words_learned: 156,
        lessons_completed: 34,
        current_streak: 12,
        longest_streak: 30,
        last_activity_date: new Date().toISOString().split('T')[0]
      }
    ];

    for (const user of users) {
      await User.findOrCreate({ where: { email: user.email }, defaults: user });
    }
    console.log('✅ Demo users seeded');

    // Badges
    const badges = [
      { name: 'streak_7', display_name: 'Week Warrior', description: 'Maintain a 7-day streak', icon_emoji: '🔥', category: 'streak', rarity: 'common', color: 'orange', requirement_type: 'streak', requirement_value: 7 },
      { name: 'streak_30', display_name: 'Monthly Master', description: 'Maintain a 30-day streak', icon_emoji: '📅', category: 'streak', rarity: 'uncommon', color: 'purple', requirement_type: 'streak', requirement_value: 30 },
      { name: 'streak_60', display_name: 'Dedication', description: 'Maintain a 60-day streak', icon_emoji: '💎', category: 'streak', rarity: 'rare', color: 'blue', requirement_type: 'streak', requirement_value: 60 },
      { name: 'words_100', display_name: 'Word Smith', description: 'Learn 100 words', icon_emoji: '📖', category: 'learning', rarity: 'common', color: 'green', requirement_type: 'words', requirement_value: 100 },
      { name: 'words_500', display_name: 'Vocabulary Pro', description: 'Learn 500 words', icon_emoji: '📚', category: 'learning', rarity: 'uncommon', color: 'indigo', requirement_type: 'words', requirement_value: 500 },
      { name: 'first_lesson', display_name: 'First Steps', description: 'Complete your first lesson', icon_emoji: '👣', category: 'achievement', rarity: 'common', color: 'slate', requirement_type: 'lessons', requirement_value: 1 },
      { name: 'perfect_quiz', display_name: 'Perfect Score', description: 'Get 100% on a quiz', icon_emoji: '⭐', category: 'achievement', rarity: 'uncommon', color: 'yellow', requirement_type: 'score', requirement_value: 100 },
      { name: 'night_owl', display_name: 'Night Owl', description: 'Study after midnight', icon_emoji: '🦉', category: 'special', rarity: 'rare', color: 'indigo', requirement_type: 'time', requirement_value: 0 },
    ];

    for (const badge of badges) {
      await Badge.findOrCreate({ where: { name: badge.name }, defaults: badge });
    }
    console.log('✅ Badges seeded');

    // French Courses & Lessons
    const frenchCourse = await Course.findOrCreate({
      where: { slug: 'french-basics' },
      defaults: {
        language_id: 'fr',
        title: 'French Basics',
        description: 'Learn the fundamentals of French language',
        slug: 'french-basics',
        level: 'A1',
        skill_category: 'fundamentals',
        total_lessons: 5,
        estimated_hours: 5,
        color_theme: 'blue'
      }
    });

    if (frenchCourse[1]) {
      const lessons = [
        { course_id: frenchCourse[0].id, title: 'Greetings', description: 'Learn basic greetings and introductions', slug: 'greetings', sort_order: 1, lesson_type: 'vocabulary', xp_reward: 20, estimated_minutes: 5, total_questions: 5 },
        { course_id: frenchCourse[0].id, title: 'Common Phrases', description: 'Essential phrases for daily conversation', slug: 'common-phrases', sort_order: 2, lesson_type: 'vocabulary', xp_reward: 25, estimated_minutes: 5, total_questions: 5 },
        { course_id: frenchCourse[0].id, title: 'Numbers 1-20', description: 'Learn to count in French', slug: 'numbers', sort_order: 3, lesson_type: 'vocabulary', xp_reward: 20, estimated_minutes: 5, total_questions: 5 },
        { course_id: frenchCourse[0].id, title: 'Family Members', description: 'Talk about your family', slug: 'family', sort_order: 4, lesson_type: 'vocabulary', xp_reward: 25, estimated_minutes: 5, total_questions: 5 },
        { course_id: frenchCourse[0].id, title: 'Food & Drink', description: 'Order food at a restaurant', slug: 'food', sort_order: 5, lesson_type: 'vocabulary', xp_reward: 30, estimated_minutes: 5, total_questions: 5 },
      ];

      for (const lesson of lessons) {
        await Lesson.findOrCreate({ where: { slug: lesson.slug }, defaults: lesson });
      }
      console.log('✅ French lessons seeded');

      // Questions for first lesson
      const greetingLesson = await Lesson.findOne({ where: { slug: 'greetings' } });
      if (greetingLesson) {
        const questions = [
          {
            lesson_id: greetingLesson.id,
            question_type: 'multiple_choice',
            question_text: 'How do you say "Hello" in French?',
            options: ['Bonjour', 'Hola', 'Ciao', 'Hallo'],
            correct_answer: { correct_index: 0 },
            explanation: '"Bonjour" means "Hello" or "Good day" in French.',
            hint: 'It starts with "B"',
            sort_order: 1
          },
          {
            lesson_id: greetingLesson.id,
            question_type: 'multiple_choice',
            question_text: 'What does "Merci" mean?',
            options: ['Please', 'Thank you', 'Goodbye', 'Sorry'],
            correct_answer: { correct_index: 1 },
            explanation: '"Merci" is the French word for "Thank you".',
            hint: 'Express gratitude',
            sort_order: 2
          },
          {
            lesson_id: greetingLesson.id,
            question_type: 'translation',
            question_text: 'Translate: "My name is Marie"',
            correct_answer: { text: "Je m'appelle Marie" },
            explanation: '"Je m'appelle" literally means "I call myself" and is used to introduce your name.',
            hint: 'Use "Je m'appelle..."',
            sort_order: 3
          },
          {
            lesson_id: greetingLesson.id,
            question_type: 'multiple_choice',
            question_text: 'Choose the correct article: "___ livre" (the book)',
            options: ['Le', 'La', 'Les', "L'"],
            correct_answer: { correct_index: 0 },
            explanation: '"Livre" (book) is masculine, so we use "Le".',
            hint: 'Livre is masculine',
            sort_order: 4
          },
          {
            lesson_id: greetingLesson.id,
            question_type: 'translation',
            question_text: 'Translate: "Good evening"',
            correct_answer: { text: 'Bonsoir' },
            explanation: '"Bonsoir" = "Bon" (good) + "soir" (evening).',
            hint: 'Think "good" + "evening"',
            sort_order: 5
          }
        ];

        for (const q of questions) {
          await Question.findOrCreate({ where: { lesson_id: q.lesson_id, question_text: q.question_text }, defaults: q });
        }
        console.log('✅ French questions seeded');
      }
    }

    // Spanish Course
    const spanishCourse = await Course.findOrCreate({
      where: { slug: 'spanish-basics' },
      defaults: {
        language_id: 'es',
        title: 'Spanish Basics',
        description: 'Start your Spanish journey with essential vocabulary',
        slug: 'spanish-basics',
        level: 'A1',
        skill_category: 'fundamentals',
        total_lessons: 3,
        estimated_hours: 3,
        color_theme: 'red'
      }
    });

    if (spanishCourse[1]) {
      const spanishLessons = [
        { course_id: spanishCourse[0].id, title: 'Hola Mundo', description: 'Basic greetings in Spanish', slug: 'hola-mundo', sort_order: 1, lesson_type: 'vocabulary', xp_reward: 20, estimated_minutes: 5, total_questions: 3 },
        { course_id: spanishCourse[0].id, title: 'La Familia', description: 'Family members in Spanish', slug: 'la-familia', sort_order: 2, lesson_type: 'vocabulary', xp_reward: 25, estimated_minutes: 5, total_questions: 3 },
        { course_id: spanishCourse[0].id, title: 'En el Restaurante', description: 'Ordering food in Spanish', slug: 'restaurante', sort_order: 3, lesson_type: 'conversation', xp_reward: 30, estimated_minutes: 5, total_questions: 3 },
      ];

      for (const lesson of spanishLessons) {
        await Lesson.findOrCreate({ where: { slug: lesson.slug }, defaults: lesson });
      }
      console.log('✅ Spanish lessons seeded');
    }

    console.log('\n🎉 Database seeding complete!');
    console.log('\nDemo accounts:');
    console.log('  learner@lingoverse.com / password');
    console.log('  admin@lingoverse.com / admin123');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
