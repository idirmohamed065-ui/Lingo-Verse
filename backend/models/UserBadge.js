import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserBadge = sequelize.define('user_badges', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    badge_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    earned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    context_data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'user_badges',
    timestamps: false,
    indexes: [
      { fields: ['user_id', 'badge_id'], unique: true }
    ]
  });

  return UserBadge;
};
