const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tracking_number: { type: DataTypes.STRING(30), unique: true, allowNull: false },
  client_id: { type: DataTypes.UUID, allowNull: false },
  package_id: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(10), allowNull: false },
  num_people: { type: DataTypes.INTEGER, defaultValue: 1 },
  special_requests: { type: DataTypes.TEXT, allowNull: true },
  cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
  reschedule_reason: { type: DataTypes.TEXT, allowNull: true },
  total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  down_payment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  amount_paid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  remaining_balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  payment_status: {
    type: DataTypes.ENUM(
      'payment_required', 'payment_submitted', 'under_verification',
      'verified', 'rejected', 'partially_paid', 'fully_paid'
    ),
    defaultValue: 'payment_required',
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'confirmed', 'cancellation_requested', 'cancelled',
      'reschedule_requested', 'rescheduled', 'checked_in',
      'waiting', 'now_serving', 'completed', 'no_show', 'rejected'
    ),
    defaultValue: 'pending',
  },
  queue_number: { type: DataTypes.INTEGER, allowNull: true },
  addon_ids: { type: DataTypes.JSON, defaultValue: [] },
  checked_in_at: { type: DataTypes.DATE, allowNull: true },
  arrival_time: { type: DataTypes.STRING(10), allowNull: true },
  queue_entry_at: { type: DataTypes.DATE, allowNull: true },
  service_start_at: { type: DataTypes.DATE, allowNull: true },
  service_end_at: { type: DataTypes.DATE, allowNull: true },
  checked_in_by: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'appointments', underscored: true });

module.exports = Appointment;
