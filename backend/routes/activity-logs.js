const router = require('express').Router();
const { ActivityLog } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/activity-logs — admin only
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { search, entity_type, limit = 200 } = req.query;
    const where = {};
    if (entity_type && entity_type !== 'all') where.entity_type = entity_type;
    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
      ];
    }
    const logs = await ActivityLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
    });
    res.json({ logs });
  } catch (err) { next(err); }
});

module.exports = router;
