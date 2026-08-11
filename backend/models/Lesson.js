import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Lesson = sequelize.define('lessons', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'courses', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    lesson_type: {
      type: DataTypes.ENUM('vocabulary', 'grammar', 'conversation', 'listening', 'reading', 'writing', 'pronunciation', 'culture'),
      defaultValue: 'vocabulary'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    xp_reward: {
      type: DataTypes.INTEGER,
      defaultValue: 20
    },
    estimated_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    total_questions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    prerequisites: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'lessons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['course_id'] },
      { fields: ['slug'], unique: true },
      { fields: ['lesson_type'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  return Lesson;
};
