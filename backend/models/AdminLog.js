import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AdminLog = sequelize.define('admin_logs', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    target_type: {
      type: DataTypes.ENUM('user', 'course', 'lesson', 'post', 'comment', 'badge', 'system'),
      allowNull: false
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'admin_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['action'] },
      { fields: ['target_type'] },
      { fields: ['created_at'] }
    ]
  });

  return AdminLog;
};
