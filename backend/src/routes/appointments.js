const router = require('express').Router();
const { Op, Transaction } = require('sequelize');
const {
  sequelize,
  Appointment,
  Package,
  Addon,
  User,
  Notification,
  ActivityLog,
  StudioSettings,
} = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { notifyAdmins } = require('../utils/notifyAdmins');
const { dateKeyInTimeZone, hoursUntilAppointment, isValidDateKey } = require('../utils/dateTime');
const { getDateAvailability, assertSlotAvailable } = require('../utils/availability');
const { canAdminTransition, canClientRequest } = require('../utils/appointmentState');

async function generateTracking(transaction) {
  const year = Number(dateKeyInTimeZone().slice(0, 4));
  const prefix = `SP-${year}-`;
  const latest = await Appointment.findOne({
    where: { tracking_number: { [Op.like]: `${prefix}%` } },
    order: [['tracking_number', 'DESC']],
    attributes: ['tracking_number'],
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
  const lastNumber = latest ? Number.parseInt(latest.tracking_number.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
}

async function generateQueueNumber(date, transaction) {
  const maxQueue = await Appointment.max('queue_number', { where: { date }, transaction });
  return (Number(maxQueue) || 0) + 1;
}

async function notify(userId, title, message, type, relatedId, relatedType) {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      related_id: relatedId,
      related_type: relatedType,
    });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
}

async function logActivity(req, action, description, appointmentId) {
  try {
    await ActivityLog.create({
      user_id: req.user.id,
      user_name: req.user.name,
      action,
      description,
      entity_type: 'appointment',
      entity_id: appointmentId,
      ip_address: req.ip,
    });
  } catch (err) {
    console.error('Activity log creation failed:', err.message);
  }
}

const appointmentInclude = [
  { model: Package, as: 'package', attributes: ['id', 'name', 'duration', 'price', 'max_people'] },
  { model: User, as: 'client', attributes: ['id', 'name', 'email', 'mobile'] },
];

// GET /api/appointments — admin: all; client: own
router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { client_id: req.user.id };
    if (req.query.date) where.date = req.query.date;
    if (req.query.status) where.status = req.query.status;
    const appointments = await Appointment.findAll({
      where,
      include: appointmentInclude,
      order: [['date', 'DESC'], ['time', 'ASC']],
    });
    res.json({ appointments });
  } catch (err) { next(err); }
});

// GET /api/appointments/tracking/:tn — QR scanner lookup
router.get('/tracking/:tn', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const appt = await Appointment.findOne({
      where: { tracking_number: req.params.tn },
      include: appointmentInclude,
    });
    if (!appt) return res.status(404).json({ error: 'Tracking number not found' });
    res.json({ appointment: appt });
  } catch (err) { next(err); }
});

// GET /api/appointments/queue/today — today roster + live queue
router.get('/queue/today', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const today = dateKeyInTimeZone();
    const queue = await Appointment.findAll({
      where: {
        date: today,
        status: { [Op.in]: ['confirmed', 'rescheduled', 'checked_in', 'waiting', 'now_serving', 'completed'] },
      },
      include: appointmentInclude,
      order: [
        [sequelize.literal("CASE WHEN status = 'now_serving' THEN 0 WHEN queue_number IS NOT NULL THEN 1 ELSE 2 END"), 'ASC'],
        ['queue_number', 'ASC'],
        ['time', 'ASC'],
      ],
    });
    res.json({ queue, date: today });
  } catch (err) { next(err); }
});

// GET /api/appointments/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id, { include: appointmentInclude });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (req.user.role !== 'admin' && appt.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ appointment: appt });
  } catch (err) { next(err); }
});

// POST /api/appointments — clients create bookings
router.post('/', authenticate, async (req, res, next) => {
  if (req.user.role !== 'client') return res.status(403).json({ error: 'Client account required to create a booking' });

  try {
    const { package_id, date, time, num_people = 1, special_requests = null } = req.body;
    const addonIds = [...new Set(Array.isArray(req.body.addon_ids) ? req.body.addon_ids : [])];
    if (!package_id || !date || !time) {
      return res.status(400).json({ error: 'package_id, date, and time are required' });
    }
    if (!isValidDateKey(date)) return res.status(400).json({ error: 'Invalid appointment date' });

    const created = await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (transaction) => {
        const settings = await StudioSettings.findByPk(1, { transaction });
        const pkg = await Package.findByPk(package_id, { transaction });
        if (!pkg || !pkg.active) {
          const err = new Error('Package not found or inactive');
          err.status = 404;
          throw err;
        }

        const people = Number(num_people);
        if (!Number.isInteger(people) || people < 1 || people > Number(pkg.max_people)) {
          const err = new Error(`Number of people must be between 1 and ${pkg.max_people}`);
          err.status = 400;
          throw err;
        }

        const addons = addonIds.length
          ? await Addon.findAll({ where: { id: addonIds, active: true }, transaction })
          : [];
        if (addons.length !== addonIds.length) {
          const err = new Error('One or more selected add-ons are invalid or inactive');
          err.status = 400;
          throw err;
        }

        const availability = await getDateAvailability(date, { transaction });
        assertSlotAvailable(availability, time);

        const addonTotal = addons.reduce((sum, addon) => sum + Number(addon.price), 0);
        const totalPrice = Number(pkg.price) + addonTotal;
        const configuredDp = settings?.down_payment_type === 'percentage'
          ? Math.ceil(totalPrice * Number(settings.down_payment_value || 0) / 100)
          : Number(settings?.down_payment_value || 500);
        const downPayment = Math.max(0, Math.min(totalPrice, configuredDp));
        const tracking = await generateTracking(transaction);

        return Appointment.create({
          client_id: req.user.id,
          package_id,
          date,
          time,
          num_people: people,
          special_requests: typeof special_requests === 'string' ? special_requests.trim().slice(0, 2000) : null,
          addon_ids: addonIds,
          tracking_number: tracking,
          total_price: totalPrice,
          down_payment: downPayment,
          remaining_balance: totalPrice,
          amount_paid: 0,
          payment_status: 'payment_required',
          status: 'pending',
        }, { transaction });
      },
    );

    await notify(req.user.id, 'Booking Submitted', `Your booking ${created.tracking_number} has been submitted.`, 'booking', created.id, 'appointment');
    await notifyAdmins('New Booking', `${req.user.name || 'A client'} submitted booking ${created.tracking_number}.`, 'booking', created.id, 'appointment');
    await logActivity(req, 'APPOINTMENT_CREATE', `Created ${created.tracking_number}`, created.id);
    const appt = await Appointment.findByPk(created.id, { include: appointmentInclude });
    res.status(201).json({ appointment: appt });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') err.status = 409;
    next(err);
  }
});

// PATCH /api/appointments/:id — controlled client requests and admin transitions
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    let targetStatus = req.body.status;
    const updateData = {};

    if (req.user.role !== 'admin') {
      if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      if (!canClientRequest(appt.status, targetStatus)) {
        return res.status(409).json({ error: `Cannot request ${String(targetStatus || '').replace(/_/g, ' ')} from ${appt.status.replace(/_/g, ' ')}` });
      }

      const settings = await StudioSettings.findByPk(1);
      const hoursRemaining = hoursUntilAppointment(appt.date, appt.time);
      const threshold = targetStatus === 'cancellation_requested'
        ? Number(settings?.cancellation_hours || 24)
        : Number(settings?.reschedule_hours || 48);
      if (hoursRemaining < threshold) {
        return res.status(409).json({
          error: `${targetStatus === 'cancellation_requested' ? 'Cancellation' : 'Reschedule'} requests must be made at least ${threshold} hours before the appointment.`,
        });
      }

      const reason = targetStatus === 'cancellation_requested'
        ? req.body.cancellation_reason
        : req.body.reschedule_reason;
      if (!String(reason || '').trim()) return res.status(400).json({ error: 'A reason is required' });

      updateData.status = targetStatus;
      if (targetStatus === 'cancellation_requested') updateData.cancellation_reason = String(reason).trim().slice(0, 2000);
      if (targetStatus === 'reschedule_requested') updateData.reschedule_reason = String(reason).trim().slice(0, 2000);
    } else {
      // checked_in is retained in the database for compatibility, but the live workflow
      // goes directly to waiting so Scanner and Queue cannot drift apart.
      if (targetStatus === 'checked_in') targetStatus = 'waiting';
      if (targetStatus && !canAdminTransition(appt.status, targetStatus)) {
        return res.status(409).json({ error: `Invalid transition: ${appt.status.replace(/_/g, ' ')} → ${targetStatus.replace(/_/g, ' ')}` });
      }

      if (targetStatus) updateData.status = targetStatus;
      if (req.body.special_requests !== undefined) updateData.special_requests = String(req.body.special_requests || '').slice(0, 2000);

      if (targetStatus === 'rescheduled') {
        const newDate = req.body.date;
        const newTime = req.body.time;
        if (!newDate || !newTime) return res.status(400).json({ error: 'New date and time are required for rescheduling' });
        const availability = await getDateAvailability(newDate, { excludeAppointmentId: appt.id });
        assertSlotAvailable(availability, newTime);
        updateData.date = newDate;
        updateData.time = newTime;
        updateData.queue_number = null;
        updateData.checked_in_at = null;
        updateData.queue_entry_at = null;
        updateData.service_start_at = null;
        updateData.service_end_at = null;
        updateData.checked_in_by = null;
      }

      if (targetStatus === 'waiting') {
        if (appt.date !== dateKeyInTimeZone()) return res.status(409).json({ error: 'Only today\'s appointments can be checked in' });
        if (!appt.queue_number) updateData.queue_number = await generateQueueNumber(appt.date);
        updateData.checked_in_at = appt.checked_in_at || new Date();
        updateData.queue_entry_at = appt.queue_entry_at || new Date();
        updateData.checked_in_by = req.user.id;
        updateData.arrival_time = req.body.arrival_time || appt.arrival_time || null;
      }
      if (targetStatus === 'now_serving') updateData.service_start_at = appt.service_start_at || new Date();
      if (targetStatus === 'completed') updateData.service_end_at = new Date();
      if (targetStatus === 'cancelled') updateData.queue_number = null;
    }

    if (!Object.keys(updateData).length) return res.status(400).json({ error: 'No valid appointment changes supplied' });
    const previousStatus = appt.status;
    await appt.update(updateData);

    if (req.user.role !== 'admin') {
      const isCancel = targetStatus === 'cancellation_requested';
      await notifyAdmins(
        isCancel ? 'Cancellation Request' : 'Reschedule Request',
        `${req.user.name || 'A client'} requested ${isCancel ? 'cancellation' : 'rescheduling'} for ${appt.tracking_number}.`,
        'booking', appt.id, 'appointment',
      );
    } else if (targetStatus && targetStatus !== previousStatus) {
      const messages = {
        confirmed: ['Booking Confirmed', `Your appointment ${appt.tracking_number} has been confirmed.`],
        cancelled: ['Booking Cancelled', `Your appointment ${appt.tracking_number} has been cancelled.`],
        rejected: ['Booking Rejected', `Your booking ${appt.tracking_number} was not approved.`],
        rescheduled: ['Booking Rescheduled', `Your appointment ${appt.tracking_number} has been rescheduled to ${appt.date} at ${appt.time}.`],
        waiting: ['Checked In', `You are checked in for ${appt.tracking_number}. Queue #${appt.queue_number}.`],
        now_serving: ["It's Your Turn!", `Queue #${appt.queue_number} — please proceed to the studio.`],
        completed: ['Session Completed', `Your session ${appt.tracking_number} has been completed. Thank you!`],
        no_show: ['Appointment Marked No Show', `Appointment ${appt.tracking_number} was marked as no-show.`],
      };
      if (messages[targetStatus]) {
        await notify(appt.client_id, ...messages[targetStatus], targetStatus === 'waiting' || targetStatus === 'now_serving' ? 'queue' : 'booking', appt.id, 'appointment');
      }
    }

    await logActivity(req, 'APPOINTMENT_UPDATE', `Status: ${previousStatus} → ${appt.status}`, appt.id);
    const updated = await Appointment.findByPk(appt.id, { include: appointmentInclude });
    res.json({ appointment: updated });
  } catch (err) { next(err); }
});

module.exports = router;
