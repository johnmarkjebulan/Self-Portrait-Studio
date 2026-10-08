const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(200), unique: true, allowNull: false },
  mobile: { type: DataTypes.STRING(20), allowNull: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('client', 'admin', 'staff'), defaultValue: 'client' },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  email_verification_code_hash: { type: DataTypes.STRING(255), allowNull: true },
  email_verification_expires_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'users', underscored: true });

module.exports = User;
