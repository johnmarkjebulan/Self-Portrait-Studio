const router = require('express').Router();
const { User, Appointment, Payment } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users — admin only
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: req.query.role ? { role: req.query.role } : {},
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ users });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;
