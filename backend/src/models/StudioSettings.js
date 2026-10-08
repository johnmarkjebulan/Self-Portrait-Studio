const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudioSettings = sequelize.define('StudioSettings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1, autoIncrement: false },
  studio_name: { type: DataTypes.STRING(200), defaultValue: 'Pose and Pics Photography Studio' },
  studio_address: { type: DataTypes.TEXT, allowNull: true, defaultValue: 'San Agustin St, Poblacion 4, Calaca, 4212 Batangas' },
  studio_lat: { type: DataTypes.DOUBLE, allowNull: true },
  studio_lng: { type: DataTypes.DOUBLE, allowNull: true },
  studio_phone: { type: DataTypes.STRING(30), allowNull: true, defaultValue: '0910 831 3847' },
  studio_email: { type: DataTypes.STRING(200), allowNull: true, defaultValue: 'poseandpics@gmail.com' },
  business_hours: { type: DataTypes.JSON, defaultValue: {} },
  daily_capacity: { type: DataTypes.INTEGER, defaultValue: 10 },
  slot_capacity: { type: DataTypes.INTEGER, defaultValue: 3 },
  slot_interval_minutes: { type: DataTypes.INTEGER, defaultValue: 60 },
  down_payment_type: { type: DataTypes.ENUM('fixed', 'percentage'), defaultValue: 'fixed' },
  down_payment_value: { type: DataTypes.DECIMAL(10, 2), defaultValue: 500 },
  cancellation_hours: { type: DataTypes.INTEGER, defaultValue: 24 },
  reschedule_hours: { type: DataTypes.INTEGER, defaultValue: 48 },
  grace_period_minutes: { type: DataTypes.INTEGER, defaultValue: 15 },
  no_show_forfeits_downpayment: { type: DataTypes.BOOLEAN, defaultValue: true },
  qr_gcash_number: { type: DataTypes.STRING(20), allowNull: true },
  qr_paymaya_number: { type: DataTypes.STRING(20), allowNull: true },
}, { tableName: 'studio_settings', underscored: true });

module.exports = StudioSettings;
