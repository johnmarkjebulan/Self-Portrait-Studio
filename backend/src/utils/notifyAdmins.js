const { User, Notification } = require('../models');

async function notifyAdmins(title, message, type = 'system', relatedId = null, relatedType = null) {
  try {
    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
    if (!admins.length) return;

    await Notification.bulkCreate(admins.map((admin) => ({
      user_id: admin.id,
      title,
      message,
      type,
      read: false,
      related_id: relatedId,
      related_type: relatedType,
    })));
  } catch (err) {
    console.error('Admin notification error:', err.message);
  }
}

module.exports = { notifyAdmins };
