const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  appointment_id: { type: DataTypes.UUID, allowNull: false },
  client_id: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  type: { type: DataTypes.ENUM('down_payment', 'partial', 'full', 'additional'), allowNull: false },
  reference_number: { type: DataTypes.STRING(100), allowNull: true },
  payment_date: { type: DataTypes.DATEONLY, allowNull: false },
  proof_url: { type: DataTypes.TEXT, allowNull: true },
  proof_filename: { type: DataTypes.STRING(255), allowNull: true },
  proof_data: { type: DataTypes.TEXT('medium'), allowNull: true },
  status: {
    type: DataTypes.ENUM(
      'payment_required', 'payment_submitted', 'under_verification',
      'verified', 'rejected', 'partially_paid', 'fully_paid'
    ),
    defaultValue: 'payment_submitted',
  },
  verified_by: { type: DataTypes.UUID, allowNull: true },
  verified_at: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'payments', underscored: true, updatedAt: false });

module.exports = Payment;
