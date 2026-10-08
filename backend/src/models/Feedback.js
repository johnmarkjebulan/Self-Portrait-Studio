const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  appointment_id: { type: DataTypes.UUID, allowNull: true, unique: true },
  client_id: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.SMALLINT, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true },
  booking_experience: { type: DataTypes.SMALLINT, allowNull: true },
  staff_service: { type: DataTypes.SMALLINT, allowNull: true },
  studio_experience: { type: DataTypes.SMALLINT, allowNull: true },
  cleanliness: { type: DataTypes.SMALLINT, allowNull: true },
  overall_satisfaction: { type: DataTypes.SMALLINT, allowNull: true },
  staff_reply: { type: DataTypes.TEXT, allowNull: true },
  replied_by: { type: DataTypes.UUID, allowNull: true },
  replied_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'feedback',
  underscored: true,
  updatedAt: false,
});

module.exports = Feedback;
