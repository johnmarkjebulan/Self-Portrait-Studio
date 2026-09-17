const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Package = sequelize.define('Package', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'minutes' },
  max_people: { type: DataTypes.INTEGER, defaultValue: 1 },
  edited_photos: { type: DataTypes.INTEGER, defaultValue: 0 },
  printed_photos: { type: DataTypes.INTEGER, defaultValue: 0 },
  services: { type: DataTypes.JSON, defaultValue: [] },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'packages', underscored: true });

module.exports = Package;
