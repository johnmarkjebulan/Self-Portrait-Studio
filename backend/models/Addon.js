const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Addon = sequelize.define('Addon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'addons', underscored: true, updatedAt: false });

module.exports = Addon;
