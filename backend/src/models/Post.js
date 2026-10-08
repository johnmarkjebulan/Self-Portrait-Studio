const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  author_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: true },
  caption: { type: DataTypes.TEXT, allowNull: true },
  image_data: { type: DataTypes.TEXT('long'), allowNull: true },
  image_url: { type: DataTypes.STRING(500), allowNull: true },
  is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'posts', underscored: true });

module.exports = Post;
