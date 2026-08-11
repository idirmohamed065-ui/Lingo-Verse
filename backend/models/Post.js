import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Post = sequelize.define('posts', {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    language_id: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    visibility: {
      type: DataTypes.ENUM('public', 'friends', 'private'),
      defaultValue: 'public'
    },
    post_type: {
      type: DataTypes.ENUM('text', 'achievement', 'streak', 'lesson_complete', 'milestone'),
      defaultValue: 'text'
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shares_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['visibility'] },
      { fields: ['post_type'] },
      { fields: ['created_at'] },
      { fields: ['is_pinned'] }
    ]
  });

  return Post;
};
