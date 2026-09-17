const router = require('express').Router();
const { Feedback, Appointment, User } = require('../models');
const { authenticate } = require('../middleware/auth');
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
    const where = req.user.role === 'admin' ? {} : { client_id: req.user.id };
    const feedback = await Feedback.findAll({
      where,
      include: [
        { model: Appointment, as: 'appointment', attributes: ['id', 'tracking_number', 'date', 'time'] },
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
    const appointmentId = req.body.appointment_id;
    const appt = await Appointment.findByPk(appointmentId);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (appt.status !== 'completed') return res.status(409).json({ error: 'Feedback is available only after a completed session' });
    const existing = await Feedback.findOne({ where: { appointment_id: appointmentId } });
    if (existing) return res.status(409).json({ error: 'Feedback already submitted for this appointment' });

    const data = { appointment_id: appointmentId, client_id: appt.client_id };
    for (const field of SCORE_FIELDS) {
      const score = cleanScore(req.body[field], field === 'rating');
      if (score === undefined) return res.status(400).json({ error: `${field.replace(/_/g, ' ')} must be between 1 and 5` });
      data[field] = score;
    }
    data.comment = String(req.body.comment || '').trim().slice(0, 4000) || null;

    const fb = await Feedback.create(data);
    await notifyAdmins('New Feedback', `${req.user.name || 'A client'} submitted feedback for ${appt.tracking_number}.`, 'feedback', fb.id, 'feedback');
    await logActivity(req, 'SUBMIT_FEEDBACK', `Submitted ${data.rating}-star feedback for ${appt.tracking_number}`, 'feedback', fb.id);
    res.status(201).json({ feedback: fb });
  } catch (err) { next(err); }
});

module.exports = router;
