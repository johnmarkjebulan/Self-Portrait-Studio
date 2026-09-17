const router = require('express').Router();
const { StudioSettings } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { isValidTime, minutesFromTime } = require('../utils/dateTime');
const { DEFAULT_HOURS } = require('../utils/availability');
const { logActivity } = require('../utils/activityLog');

const FIELDS = [
  'studio_name', 'studio_address', 'studio_lat', 'studio_lng', 'studio_phone', 'studio_email',
  'business_hours', 'daily_capacity', 'slot_capacity', 'slot_interval_minutes',
  'down_payment_type', 'down_payment_value', 'cancellation_hours', 'reschedule_hours',
  'grace_period_minutes', 'no_show_forfeits_downpayment', 'qr_gcash_number', 'qr_paymaya_number',
];

function pick(body) {
  const result = {};
  for (const field of FIELDS) if (body[field] !== undefined) result[field] = body[field];
  return result;
}

function validate(data) {
  for (const field of ['daily_capacity', 'slot_capacity', 'slot_interval_minutes']) {
    if (data[field] !== undefined) {
      const value = Number(data[field]);
      if (!Number.isInteger(value) || value < 1) return `${field.replace(/_/g, ' ')} must be a positive integer`;
      data[field] = value;
    }
  }
  if (data.slot_interval_minutes !== undefined && (data.slot_interval_minutes < 15 || data.slot_interval_minutes > 240)) {
    return 'Slot interval must be between 15 and 240 minutes';
  }
  for (const field of ['cancellation_hours', 'reschedule_hours', 'grace_period_minutes']) {
    if (data[field] !== undefined) {
      const value = Number(data[field]);
      if (!Number.isInteger(value) || value < 0) return `${field.replace(/_/g, ' ')} cannot be negative`;
      data[field] = value;
    }
  }
  if (data.down_payment_type !== undefined && !['fixed', 'percentage'].includes(data.down_payment_type)) {
    return 'Invalid down payment type';
  }
  if (data.down_payment_value !== undefined) {
    const value = Number(data.down_payment_value);
    if (!Number.isFinite(value) || value < 0) return 'Down payment value cannot be negative';
    if (data.down_payment_type === 'percentage' && value > 100) return 'Percentage down payment cannot exceed 100';
    data.down_payment_value = value;
  }
  if (data.studio_lat !== undefined) {
    data.studio_lat = Number(data.studio_lat);
    if (!Number.isFinite(data.studio_lat) || data.studio_lat < -90 || data.studio_lat > 90) return 'Invalid studio latitude';
  }
  if (data.studio_lng !== undefined) {
    data.studio_lng = Number(data.studio_lng);
    if (!Number.isFinite(data.studio_lng) || data.studio_lng < -180 || data.studio_lng > 180) return 'Invalid studio longitude';
  }
  if (data.no_show_forfeits_downpayment !== undefined) data.no_show_forfeits_downpayment = Boolean(data.no_show_forfeits_downpayment);

  if (data.business_hours !== undefined) {
    if (!data.business_hours || typeof data.business_hours !== 'object' || Array.isArray(data.business_hours)) {
      return 'business_hours must be an object';
    }
    const normalized = { ...DEFAULT_HOURS };
    for (const day of Object.keys(DEFAULT_HOURS)) {
      const source = data.business_hours[day] || DEFAULT_HOURS[day];
      const closed = Boolean(source.closed);
      const open = source.open || DEFAULT_HOURS[day].open;
      const close = source.close || DEFAULT_HOURS[day].close;
      if (!closed) {
        if (!isValidTime(open) || !isValidTime(close) || minutesFromTime(close) <= minutesFromTime(open)) {
          return `Invalid business hours for ${day}`;
        }
      }
      normalized[day] = { open, close, closed };
    }
    data.business_hours = normalized;
  }
  return null;
}

async function getOrCreate() {
  let settings = await StudioSettings.findByPk(1);
  if (!settings) settings = await StudioSettings.create({ id: 1, business_hours: DEFAULT_HOURS });
  return settings;
}

// Public studio configuration. Payment QR numbers are intentionally public because
// authenticated clients use the same endpoint during checkout.
router.get('/', async (req, res, next) => {
  try {
    res.json({ settings: await getOrCreate() });
  } catch (err) { next(err); }
});

router.patch('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No valid settings fields supplied' });
    const error = validate(data);
    if (error) return res.status(400).json({ error });
    const settings = await getOrCreate();
    await settings.update(data);
    await logActivity(
      req,
      'SETTINGS_UPDATE',
      `Updated studio settings: ${Object.keys(data).join(', ')}`,
      'settings',
      String(settings.id)
    );
    res.json({ settings });
  } catch (err) { next(err); }
});

module.exports = router;
