import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'lingoverse',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

import UserModel from './User.js';
import CourseModel from './Course.js';
import LessonModel from './Lesson.js';
import QuestionModel from './Question.js';
import UserProgressModel from './UserProgress.js';
import UserStreakModel from './UserStreak.js';
import BadgeModel from './Badge.js';
import UserBadgeModel from './UserBadge.js';
import AchievementModel from './Achievement.js';
import PostModel from './Post.js';
import CommentModel from './Comment.js';
import SubscriptionModel from './Subscription.js';
import PaymentModel from './Payment.js';
import AITutorSessionModel from './AITutorSession.js';
import PronunciationAttemptModel from './PronunciationAttempt.js';
import NotificationModel from './Notification.js';
import FriendModel from './Friend.js';
import LanguageModel from './Language.js';
import AdminLogModel from './AdminLog.js';

const User = UserModel(sequelize);
const Course = CourseModel(sequelize);
const Lesson = LessonModel(sequelize);
const Question = QuestionModel(sequelize);
const UserProgress = UserProgressModel(sequelize);
const UserStreak = UserStreakModel(sequelize);
const Badge = BadgeModel(sequelize);
const UserBadge = UserBadgeModel(sequelize);
const Achievement = AchievementModel(sequelize);
const Post = PostModel(sequelize);
const Comment = CommentModel(sequelize);
const Subscription = SubscriptionModel(sequelize);
const Payment = PaymentModel(sequelize);
const AITutorSession = AITutorSessionModel(sequelize);
const PronunciationAttempt = PronunciationAttemptModel(sequelize);
const Notification = NotificationModel(sequelize);
const Friend = FriendModel(sequelize);
const Language = LanguageModel(sequelize);
const AdminLog = AdminLogModel(sequelize);

// Relationships
User.hasMany(UserProgress, { foreignKey: 'user_id', as: 'progress' });
UserProgress.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserStreak, { foreignKey: 'user_id', as: 'streaks' });
UserStreak.belongsTo(User, { foreignKey: 'user_id' });
User.belongsToMany(Badge, {
  through: UserBadge,
  foreignKey: 'user_id',
  as: 'badges'
});

Badge.belongsToMany(User, {
  through: UserBadge,
  foreignKey: 'badge_id',
  as: 'users'
});
User.hasMany(Achievement, { foreignKey: 'user_id', as: 'achievements' });
Achievement.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AITutorSession, { foreignKey: 'user_id', as: 'aiSessions' });
AITutorSession.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PronunciationAttempt, { foreignKey: 'user_id', as: 'pronunciationAttempts' });
PronunciationAttempt.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });
User.belongsToMany(User, {
  through: Friend,
  as: 'friends',
  foreignKey: 'user_id',
  otherKey: 'friend_id'
});
Language.hasMany(Course, { foreignKey: 'language_id', as: 'courses' });
Course.belongsTo(Language, { foreignKey: 'language_id' });

Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons' });
Lesson.belongsTo(Course, { foreignKey: 'course_id' });

Lesson.hasMany(Question, { foreignKey: 'lesson_id', as: 'questions' });
Question.belongsTo(Lesson, { foreignKey: 'lesson_id' });

Lesson.hasMany(UserProgress, { foreignKey: 'lesson_id', as: 'progress' });
UserProgress.belongsTo(Lesson, { foreignKey: 'lesson_id' });

User.hasMany(AdminLog, { foreignKey: 'admin_id', as: 'adminLogs' });
AdminLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('\u2705 Database connection established.');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('\u2705 Database models synchronized.');
  } catch (error) {
    console.error('\u274c Unable to connect to database:', error);
    throw error;
  }
};

export {
  sequelize,
  connectDatabase,
  User,
  Course,
  Lesson,
  Question,
  UserProgress,
  UserStreak,
  Badge,
  UserBadge,
  Achievement,
  Post,
  Comment,
  Subscription,
  Payment,
  AITutorSession,
  PronunciationAttempt,
  Notification,
  Friend,
  Language,
  AdminLog
};
