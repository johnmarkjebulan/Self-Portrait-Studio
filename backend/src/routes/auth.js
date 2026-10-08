const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, ActivityLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { sendVerificationCode } = require('../services/email');

const sign = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeName = (name) => String(name || '').trim().replace(/\s+/g, ' ').slice(0, 150);
const isGmail = (email) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(email);
const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));
const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

async function issueVerification(user) {
  const code = makeCode();
  await user.update({
    email_verification_code_hash: hashCode(code),
    email_verification_expires_at: new Date(Date.now() + 15 * 60 * 1000),
  });
  await sendVerificationCode(user.email, user.name, code);
}

router.post('/register', async (req, res, next) => {
  try {
    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || '').trim().slice(0, 20) || null;
    const password = String(req.body.password || '');
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, Gmail address, and password are required' });
    if (!isGmail(email)) return res.status(400).json({ error: 'Please use a valid Gmail address (example@gmail.com).' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      if (exists.role === 'client' && !exists.email_verified) {
        await issueVerification(exists);
        return res.status(200).json({ requires_verification: true, email, message: 'A new verification code was sent to your Gmail.' });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password_hash: await bcrypt.hash(password, 12),
      role: 'client',
      email_verified: false,
    });

    try {
      await issueVerification(user);
    } catch (emailErr) {
      await user.destroy();
      emailErr.status = 503;
      throw emailErr;
    }

    await ActivityLog.create({ user_id: user.id, user_name: user.name, action: 'CLIENT_REGISTER', description: `New client registration awaiting Gmail verification: ${email}`, entity_type: 'auth', entity_id: user.id, ip_address: req.ip });
    res.status(201).json({ requires_verification: true, email, message: 'Account created. Check your Gmail for the 6-digit verification code.' });
  } catch (err) { next(err); }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    if (!email || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter the 6-digit verification code.' });
    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== 'client') return res.status(404).json({ error: 'Account not found.' });
    if (user.email_verified) return res.json({ success: true, message: 'Email is already verified. You can log in.' });
    if (!user.email_verification_expires_at || new Date(user.email_verification_expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Verification code expired. Request a new code.' });
    }
    if (user.email_verification_code_hash !== hashCode(code)) return res.status(400).json({ error: 'Incorrect verification code.' });
    await user.update({ email_verified: true, email_verification_code_hash: null, email_verification_expires_at: null });
    await ActivityLog.create({ user_id: user.id, user_name: user.name, action: 'CLIENT_EMAIL_VERIFIED', description: `Client verified Gmail: ${email}`, entity_type: 'auth', entity_id: user.id, ip_address: req.ip });
    res.json({ success: true, message: 'Gmail verified successfully. Please log in to continue.' });
  } catch (err) { next(err); }
});

router.post('/resend-verification', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== 'client') return res.status(404).json({ error: 'Account not found.' });
    if (user.email_verified) return res.json({ success: true, message: 'Email is already verified.' });
    await issueVerification(user);
    res.json({ success: true, message: 'A new verification code was sent to your Gmail.' });
  } catch (err) { err.status = err.status || 503; next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.is_active === false) return res.status(403).json({ error: 'This account has been disabled. Please contact the studio owner.' });
    if (user.role === 'client' && user.email_verified === false) return res.status(403).json({ error: 'Please verify your Gmail before logging in.', requires_verification: true, email: user.email });
    const loginAction = user.role === 'admin' ? 'ADMIN_LOGIN' : user.role === 'staff' ? 'STAFF_LOGIN' : 'CLIENT_LOGIN';
    await ActivityLog.create({ user_id: user.id, user_name: user.name, action: loginAction, description: `${user.role} logged in`, entity_type: 'auth', entity_id: user.id, ip_address: req.ip });
    const { password_hash: _, email_verification_code_hash: __, ...safe } = user.toJSON();
    res.json({ user: safe, token: sign(user) });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash', 'email_verification_code_hash'] } });
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
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash', 'email_verification_code_hash'] } });
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
