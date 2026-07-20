import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Course = sequelize.define('courses', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    language_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: { model: 'languages', key: 'id' }
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
    level: {
      type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
      defaultValue: 'A1'
    },
    skill_category: {
      type: DataTypes.ENUM('fundamentals', 'conversation', 'grammar', 'vocabulary', 'business', 'travel', 'culture'),
      defaultValue: 'fundamentals'
    },
    total_lessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    estimated_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    color_theme: {
      type: DataTypes.STRING(50),
      defaultValue: 'blue'
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['language_id'] },
      { fields: ['slug'], unique: true },
      { fields: ['level'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  return Course;
};
