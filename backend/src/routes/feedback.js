const router = require('express').Router();
const { Feedback, Appointment, User } = require('../models');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');
const { notifyAdmins } = require('../utils/notifyAdmins');
const { logActivity } = require('../utils/activityLog');
const SCORE_FIELDS = ['rating', 'booking_experience', 'staff_service', 'studio_experience', 'cleanliness', 'overall_satisfaction'];
function cleanScore(value, required = false) {
  if ((value === undefined || value === null || value === '') && !required) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : undefined;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = ['admin', 'staff'].includes(req.user.role) ? {} : { client_id: req.user.id };
    const feedback = await Feedback.findAll({
      where,
      include: [
        { model: Appointment, as: 'appointment', attributes: ['id', 'tracking_number', 'date', 'time'], required: false },
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ feedback });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ error: 'Only clients can submit feedback' });
    const appointmentId = req.body.appointment_id || null;
    let appt = null;
    if (appointmentId) {
      appt = await Appointment.findByPk(appointmentId);
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });
      if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      if (appt.status !== 'completed') return res.status(409).json({ error: 'Select a completed appointment, or choose General Studio Feedback.' });
      if (await Feedback.findOne({ where: { appointment_id: appointmentId } })) return res.status(409).json({ error: 'Feedback already submitted for this appointment' });
    }
    const data = { appointment_id: appointmentId, client_id: req.user.id };
    for (const field of SCORE_FIELDS) {
      const score = cleanScore(req.body[field], field === 'rating');
      if (score === undefined) return res.status(400).json({ error: `${field.replace(/_/g, ' ')} must be between 1 and 5` });
      data[field] = score;
    }
    data.comment = String(req.body.comment || '').trim().slice(0, 4000) || null;
    if (!data.comment && !appointmentId) return res.status(400).json({ error: 'Please write a short comment for general feedback.' });
    const fb = await Feedback.create(data);
    const label = appt ? appt.tracking_number : 'General Studio Feedback';
    await notifyAdmins('New Feedback', `${req.user.name || 'A client'} submitted feedback: ${label}.`, 'feedback', fb.id, 'feedback');
    await logActivity(req, 'SUBMIT_FEEDBACK', `Submitted ${data.rating}-star feedback: ${label}`, 'feedback', fb.id);
    res.status(201).json({ feedback: fb });
  } catch (err) { next(err); }
});

router.patch('/:id/reply', authenticate, requireStaffOrAdmin, async (req, res, next) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    const reply = String(req.body.reply || '').trim().slice(0, 4000);
    if (!reply) return res.status(400).json({ error: 'Reply cannot be empty' });
    await feedback.update({ staff_reply: reply, replied_by: req.user.id, replied_at: new Date() });
    await logActivity(req, 'REPLY_FEEDBACK', 'Replied to client feedback', 'feedback', feedback.id);
    res.json({ feedback });
  } catch (err) { next(err); }
});
module.exports = router;
