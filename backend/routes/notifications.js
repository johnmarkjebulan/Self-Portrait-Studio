const router = require('express').Router();
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — own
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json({ notifications });
  } catch (err) { next(err); }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await Notification.count({ where: { user_id: req.user.id, read: false } });
    res.json({ count });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await Notification.update({ read: true }, { where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', authenticate, async (req, res, next) => {
  try {
    await Notification.update({ read: true }, { where: { user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
