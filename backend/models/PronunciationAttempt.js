import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PronunciationAttempt = sequelize.define('pronunciation_attempts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    lesson_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'lessons', key: 'id' }
    },
    word_or_phrase: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    language_id: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    transcription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accuracy_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    fluency_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    completeness_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    pronunciation_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    feedback: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'pronunciation_attempts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['lesson_id'] },
      { fields: ['language_id'] },
      { fields: ['created_at'] }
    ]
  });

  return PronunciationAttempt;
};
