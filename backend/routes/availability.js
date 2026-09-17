const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getDateAvailability, getMonthAvailability } = require('../utils/availability');

// Availability contains aggregate counts only; authentication prevents anonymous scraping.
router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.query.date) {
      const excludeAppointmentId = req.user.role === 'admin' ? (req.query.exclude_appointment_id || null) : null;
      return res.json({ availability: await getDateAvailability(req.query.date, { excludeAppointmentId }) });
    }
    if (req.query.month) {
      return res.json({ availability: await getMonthAvailability(req.query.month) });
    }
    return res.status(400).json({ error: 'Provide date=YYYY-MM-DD or month=YYYY-MM' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
