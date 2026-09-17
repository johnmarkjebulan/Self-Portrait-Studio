const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(10), allowNull: false },
  max_capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  blocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'schedules',
  underscored: true,
  indexes: [{ unique: true, fields: ['date', 'time'] }],
});

module.exports = Schedule;
