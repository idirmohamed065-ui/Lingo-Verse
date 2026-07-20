import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Subscription = sequelize.define('subscriptions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tier: {
      type: DataTypes.ENUM('free', 'premium', 'pro'),
      defaultValue: 'free'
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'paused', 'trial'),
      defaultValue: 'active'
    },
    stripe_subscription_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    stripe_price_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    current_period_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    current_period_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancel_at_period_end: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    trial_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['stripe_subscription_id'] },
      { fields: ['status'] },
      { fields: ['current_period_end'] }
    ]
  });

  return Subscription;
};
