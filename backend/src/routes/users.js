const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticate, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireStaffOrAdmin, async (req, res, next) => {
  try {
    const where = req.query.role ? { role: req.query.role } : {};
    const users = await User.findAll({ where, attributes: { exclude: ['password_hash'] }, order: [['created_at', 'DESC']] });
    res.json({ users });
  } catch (err) { next(err); }
});

router.post('/staff', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim().replace(/\s+/g, ' ').slice(0, 150);
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = String(req.body.mobile || '').trim().slice(0, 20) || null;
    const password = String(req.body.password || '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'Valid name, email, and password (8+ characters) are required' });
    if (await User.findOne({ where: { email } })) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, mobile, password_hash: await bcrypt.hash(password, 12), role: 'staff', is_active: true });
    const { password_hash: _, ...safe } = user.toJSON();
    res.status(201).json({ user: safe });
  } catch (err) { next(err); }
});

router.patch('/staff/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const staff = await User.findOne({ where: { id: req.params.id, role: 'staff' } });
    if (!staff) return res.status(404).json({ error: 'Staff account not found' });
    const changes = {};
    if (req.body.is_active !== undefined) changes.is_active = Boolean(req.body.is_active);
    if (req.body.name !== undefined) changes.name = String(req.body.name || '').trim().slice(0, 150);
    if (req.body.mobile !== undefined) changes.mobile = String(req.body.mobile || '').trim().slice(0, 20) || null;
    if (req.body.password) {
      if (String(req.body.password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      changes.password_hash = await bcrypt.hash(String(req.body.password), 12);
    }
    await staff.update(changes);
    const { password_hash: _, ...safe } = staff.toJSON();
    res.json({ user: safe });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (!['admin', 'staff'].includes(req.user.role) && req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});
module.exports = router;
