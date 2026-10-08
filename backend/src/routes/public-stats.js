const router = require('express').Router();
const { fn, col } = require('sequelize');
const { Appointment, Feedback, Package } = require('../models');

// Public landing-page statistics. Only aggregate values are returned.
router.get('/', async (_req, res, next) => {
  try {
    const [sessionsDone, ratingRow, availablePackages] = await Promise.all([
      Appointment.count({ where: { status: 'completed' } }),
      Feedback.findOne({ attributes: [[fn('AVG', col('rating')), 'average_rating']], raw: true }),
      Package.count({ where: { active: true } }),
    ]);

    const averageRating = ratingRow?.average_rating == null ? null : Number(ratingRow.average_rating);
    res.json({
      sessions_done: Number(sessionsDone || 0),
      average_rating: Number.isFinite(averageRating) ? Number(averageRating.toFixed(1)) : null,
      available_packages: Number(availablePackages || 0),
    });
  } catch (err) { next(err); }
});

module.exports = router;
