const router = require('express').Router();
const { Schedule, Appointment } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const { isValidDateKey, isValidTime } = require('../utils/dateTime');
const { logActivity } = require('../utils/activityLog');

const ACTIVE_BOOKING_STATUSES = { [Op.notIn]: ['cancelled', 'rejected', 'no_show'] };

async function withBooked(schedule) {
  const booked = await Appointment.count({
    where: { date: schedule.date, time: schedule.time, status: ACTIVE_BOOKING_STATUSES },
  });
  return { ...schedule.toJSON(), booked };
}

// Schedule records are date-specific overrides. Default hours/capacity live in Settings.
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const where = req.query.date ? { date: req.query.date } : {};
    const rows = await Schedule.findAll({ where, order: [['date', 'ASC'], ['time', 'ASC']] });
    res.json({ schedules: await Promise.all(rows.map(withBooked)) });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { date, time } = req.body;
    const maxCapacity = Number(req.body.max_capacity ?? 3);
    const blocked = Boolean(req.body.blocked);
    if (!isValidDateKey(date) || !isValidTime(time)) return res.status(400).json({ error: 'Valid date and time are required' });
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) return res.status(400).json({ error: 'max_capacity must be at least 1' });
    const existing = await Schedule.findOne({ where: { date, time } });
    if (existing) return res.status(409).json({ error: 'A schedule override already exists for this date and time' });
    const schedule = await Schedule.create({ date, time, max_capacity: maxCapacity, blocked });
    await logActivity(req, 'SCHEDULE_OVERRIDE_CREATE', `${date} ${time} capacity ${maxCapacity}${blocked ? ' blocked' : ''}`, 'schedule', schedule.id);
    res.status(201).json({ schedule: await withBooked(schedule) });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule override not found' });
    const updates = {};
    if (req.body.max_capacity !== undefined) {
      const value = Number(req.body.max_capacity);
      if (!Number.isInteger(value) || value < 1) return res.status(400).json({ error: 'max_capacity must be at least 1' });
      const booked = await Appointment.count({ where: { date: schedule.date, time: schedule.time, status: ACTIVE_BOOKING_STATUSES } });
      if (!req.body.blocked && value < booked) return res.status(409).json({ error: `Capacity cannot be lower than ${booked} existing booking(s)` });
      updates.max_capacity = value;
    }
    if (req.body.blocked !== undefined) updates.blocked = Boolean(req.body.blocked);
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid schedule changes supplied' });
    await schedule.update(updates);
    await logActivity(req, 'SCHEDULE_OVERRIDE_UPDATE', `${schedule.date} ${schedule.time} override updated`, 'schedule', schedule.id);
    res.json({ schedule: await withBooked(schedule) });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule override not found' });
    const description = `${schedule.date} ${schedule.time} override removed`;
    await schedule.destroy();
    await logActivity(req, 'SCHEDULE_OVERRIDE_DELETE', description, 'schedule', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
