import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Friend = sequelize.define('friends', {
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
    friend_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'blocked', 'declined'),
      defaultValue: 'pending'
    },
    request_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'friends',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'friend_id'], unique: true },
      { fields: ['user_id'] },
      { fields: ['friend_id'] },
      { fields: ['status'] }
    ]
  });

  return Friend;
};
