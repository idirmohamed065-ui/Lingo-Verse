import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserProgress = sequelize.define('user_progress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id'
      }
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    language_id: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'mastered'),
      defaultValue: 'not_started'
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_questions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    correct_answers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    time_spent_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    xp_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    answers_data: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    mistakes_made: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    words_learned: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    attempts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    best_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'user_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'lesson_id'], unique: true },
      { fields: ['user_id', 'course_id'] },
      { fields: ['user_id', 'language_id'] },
      { fields: ['status'] },
      { fields: ['completed_at'] }
    ]
  });

  return UserProgress;
};
