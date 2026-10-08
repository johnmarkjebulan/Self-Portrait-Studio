const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PostLike = sequelize.define('PostLike', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  post_id: { type: DataTypes.UUID, allowNull: false },
  client_id: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'post_likes', underscored: true, updatedAt: false, indexes: [{ unique: true, fields: ['post_id','client_id'] }] });
module.exports = PostLike;
