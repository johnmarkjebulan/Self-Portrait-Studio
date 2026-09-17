const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('booking', 'payment', 'queue', 'system', 'feedback'), defaultValue: 'system' },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  related_id: { type: DataTypes.UUID, allowNull: true },
  related_type: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'notifications', underscored: true, updatedAt: false });

module.exports = Notification;
