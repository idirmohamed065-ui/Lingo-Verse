import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    native_language: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'en'
    },
    role: {
      type: DataTypes.ENUM('user', 'moderator', 'admin'),
      defaultValue: 'user',
      allowNull: false
    },
    account_status: {
      type: DataTypes.ENUM('active', 'suspended', 'deactivated', 'pending_verification'),
      defaultValue: 'pending_verification',
      allowNull: false
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    current_level: {
      type: DataTypes.STRING(10),
      defaultValue: 'A1',
      allowNull: false
    },
    total_words_learned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lessons_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    current_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    longest_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    last_activity_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    daily_goal_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      allowNull: false
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC',
      allowNull: false
    },
    subscription_tier: {
      type: DataTypes.ENUM('free', 'premium', 'pro'),
      defaultValue: 'free',
      allowNull: false
    },
    subscription_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    stripe_customer_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        email_lesson_reminder: true,
        email_streak_warning: true,
        email_achievements: true,
        push_daily_reminder: true,
        push_friend_activity: false,
        push_mentions: true
      }
    },
    privacy_settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        profile_visible: true,
        show_streak: true,
        show_xp: true,
        allow_friend_requests: true,
        show_activity_feed: true
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['username'], unique: true },
      { fields: ['role'] },
      { fields: ['account_status'] },
      { fields: ['subscription_tier'] },
      { fields: ['total_xp'] },
      { fields: ['created_at'] }
    ]
  });

  return User;
};
