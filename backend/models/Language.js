import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Language = sequelize.define('languages', {
    id: {
      type: DataTypes.STRING(10),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    native_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    flag_emoji: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    language_family: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    difficulty_rating: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    speaker_count: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'languages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['is_active'] },
      { fields: ['sort_order'] },
      { fields: ['difficulty_rating'] }
    ]
  });

  return Language;
};
