import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Question = sequelize.define('questions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id'
      }
    },
    question_type: {
      type: DataTypes.ENUM('multiple_choice', 'translation', 'fill_blank', 'listening', 'speaking', 'matching', 'ordering', 'true_false'),
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    question_text_translation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    correct_answer: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    explanation_translation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hint: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    xp_reward: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['lesson_id'] },
      { fields: ['question_type'] },
      { fields: ['difficulty'] }
    ]
  });

  return Question;
};
