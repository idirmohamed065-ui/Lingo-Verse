import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserStreak = sequelize.define('user_streaks', {
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
    streak_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    xp_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lessons_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    minutes_studied: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    goal_reached: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    streak_frozen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'user_streaks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'streak_date'], unique: true },
      { fields: ['user_id'] },
      { fields: ['streak_date'] }
    ]
  });

  return UserStreak;
};
