const { Op } = require('sequelize');
const { Appointment, Notification } = require('../models');

async function autoCompleteDueSessions() {
  const now = new Date();
  const due = await Appointment.findAll({
    where: {
      status: 'now_serving',
      service_end_at: { [Op.ne]: null, [Op.lte]: now },
    },
  });

  for (const appointment of due) {
    const [updated] = await Appointment.update(
      { status: 'completed' },
      { where: { id: appointment.id, status: 'now_serving' } },
    );
    if (!updated) continue;
    try {
      await Notification.create({
        user_id: appointment.client_id,
        title: 'Session Completed',
        message: `Your session ${appointment.tracking_number} has been completed. Thank you for choosing Pose and Pics!`,
        type: 'booking',
        read: false,
        related_id: appointment.id,
        related_type: 'appointment',
      });
    } catch (err) {
      console.error('Auto-complete notification failed:', err.message);
    }
  }

  return due.length;
}

module.exports = { autoCompleteDueSessions };
