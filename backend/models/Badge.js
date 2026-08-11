import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Badge = sequelize.define('badges', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    display_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon_emoji: {
      type: DataTypes.STRING(10),
      defaultValue: '🏆'
    },
    category: {
      type: DataTypes.ENUM('streak', 'learning', 'achievement', 'social', 'special'),
      defaultValue: 'achievement'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
      defaultValue: 'common'
    },
    color: {
      type: DataTypes.STRING(50),
      defaultValue: 'blue'
    },
    requirement_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    requirement_value: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'badges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['category'] },
      { fields: ['rarity'] },
      { fields: ['is_active'] }
    ]
  });

  return Badge;
};
