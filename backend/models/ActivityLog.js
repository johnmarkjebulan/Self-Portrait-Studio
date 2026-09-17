const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: true },
  user_name: { type: DataTypes.STRING(150), allowNull: false },
  action: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  entity_type: { type: DataTypes.STRING(50), allowNull: true },
  entity_id: { type: DataTypes.UUID, allowNull: true },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
}, { tableName: 'activity_logs', underscored: true, updatedAt: false });

module.exports = ActivityLog;
