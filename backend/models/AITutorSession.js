import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AITutorSession = sequelize.define('ai_tutor_sessions', {
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
    language_id: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    session_type: {
      type: DataTypes.ENUM('conversation', 'grammar', 'vocabulary', 'pronunciation', 'quiz'),
      defaultValue: 'conversation'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    messages: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    total_messages: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_tokens_used: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'ai_tutor_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['language_id'] },
      { fields: ['session_type'] },
      { fields: ['is_active'] },
      { fields: ['created_at'] }
    ]
  });

  return AITutorSession;
};
