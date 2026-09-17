const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ActivityLog } = require('../models');
const { authenticate } = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeName = (name) => String(name || '').trim().replace(/\s+/g, ' ').slice(0, 150);

router.post('/register', async (req, res, next) => {
  try {
    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || '').trim().slice(0, 20) || null;
    const password = String(req.body.password || '');
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, mobile, password_hash: await bcrypt.hash(password, 12), role: 'client' });
    await ActivityLog.create({ user_id: user.id, user_name: user.name, action: 'CLIENT_REGISTER', description: `New client registered: ${email}`, entity_type: 'auth', entity_id: user.id, ip_address: req.ip });
    const { password_hash: _, ...safe } = user.toJSON();
    res.status(201).json({ user: safe, token: sign(user) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
    await ActivityLog.create({ user_id: user.id, user_name: user.name, action: user.role === 'admin' ? 'ADMIN_LOGIN' : 'CLIENT_LOGIN', description: `${user.role} logged in`, entity_type: 'auth', entity_id: user.id, ip_address: req.ip });
    const { password_hash: _, ...safe } = user.toJSON();
    res.json({ user: safe, token: sign(user) });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    res.json({ user });
  } catch (err) { next(err); }
});

router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const data = {};
    if (req.body.name !== undefined) {
      data.name = normalizeName(req.body.name);
      if (!data.name) return res.status(400).json({ error: 'Name is required' });
    }
    if (req.body.mobile !== undefined) data.mobile = String(req.body.mobile || '').trim().slice(0, 20) || null;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No valid profile changes supplied' });
    await User.update(data, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json({ user });
  } catch (err) { next(err); }
});

router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const user = await User.findByPk(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) return res.status(400).json({ error: 'Current password is incorrect' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    if (currentPassword === newPassword) return res.status(400).json({ error: 'New password must be different from the current password' });
    await user.update({ password_hash: await bcrypt.hash(newPassword, 12) });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
