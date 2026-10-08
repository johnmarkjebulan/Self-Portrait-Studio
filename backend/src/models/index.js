const sequelize = require('../config/database');
const User = require('./User');
const Package = require('./Package');
const Addon = require('./Addon');
const Appointment = require('./Appointment');
const Payment = require('./Payment');
const Notification = require('./Notification');
const Feedback = require('./Feedback');
const ActivityLog = require('./ActivityLog');
const StudioSettings = require('./StudioSettings');
const Schedule = require('./Schedule');
const Post = require('./Post');
const PostLike = require('./PostLike');

User.hasMany(Appointment, { foreignKey: 'client_id', as: 'appointments' });
Appointment.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
Package.hasMany(Appointment, { foreignKey: 'package_id', as: 'appointments' });
Appointment.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
Appointment.hasMany(Payment, { foreignKey: 'appointment_id', as: 'payments' });
Payment.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
Appointment.hasOne(Feedback, { foreignKey: 'appointment_id', as: 'feedback' });
Feedback.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Feedback, { foreignKey: 'client_id', as: 'feedback' });
Feedback.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Payment, { foreignKey: 'client_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Post.hasMany(PostLike, { foreignKey: 'post_id', as: 'likes', onDelete: 'CASCADE' });
PostLike.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
User.hasMany(PostLike, { foreignKey: 'client_id', as: 'postLikes', onDelete: 'CASCADE' });
PostLike.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

async function sync(options = {}) { return sequelize.sync(options); }
module.exports = { sequelize, User, Package, Addon, Appointment, Payment, Notification, Feedback, ActivityLog, StudioSettings, Schedule, Post, PostLike, sync };
