const router = require('express').Router();
const { Package, Appointment, Addon } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLog');

const PACKAGE_FIELDS = ['name', 'description', 'price', 'duration', 'max_people', 'edited_photos', 'printed_photos', 'services', 'active'];
const ADDON_FIELDS = ['name', 'description', 'price', 'active'];

function pick(body, fields) {
  const result = {};
  for (const field of fields) if (body[field] !== undefined) result[field] = body[field];
  return result;
}

function validatePackage(data, { partial = false } = {}) {
  if (!partial || data.name !== undefined) {
    if (!String(data.name || '').trim()) return 'Package name is required';
    data.name = String(data.name).trim().slice(0, 150);
  }
  for (const field of ['price', 'duration', 'max_people']) {
    if (!partial || data[field] !== undefined) {
      const value = Number(data[field]);
      if (!Number.isFinite(value) || value <= 0) return `${field.replace(/_/g, ' ')} must be greater than zero`;
      data[field] = field === 'price' ? value : Math.trunc(value);
    }
  }
  for (const field of ['edited_photos', 'printed_photos']) {
    if (data[field] !== undefined) data[field] = Math.max(0, Math.trunc(Number(data[field]) || 0));
  }
  if (data.description !== undefined) data.description = String(data.description || '').trim().slice(0, 3000);
  if (data.services !== undefined) {
    if (!Array.isArray(data.services)) return 'services must be an array';
    data.services = data.services.map((item) => String(item).trim()).filter(Boolean).slice(0, 30);
  }
  if (data.active !== undefined) data.active = Boolean(data.active);
  return null;
}

function validateAddon(data, { partial = false } = {}) {
  if (!partial || data.name !== undefined) {
    if (!String(data.name || '').trim()) return 'Add-on name is required';
    data.name = String(data.name).trim().slice(0, 150);
  }
  if (!partial || data.price !== undefined) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) return 'Add-on price must be zero or greater';
    data.price = price;
  }
  if (data.description !== undefined) data.description = String(data.description || '').trim().slice(0, 3000);
  if (data.active !== undefined) data.active = Boolean(data.active);
  return null;
}

// Public package catalog — active items only.
router.get('/', async (req, res, next) => {
  try {
    const packages = await Package.findAll({ where: { active: true }, order: [['price', 'ASC']] });
    res.json({ packages });
  } catch (err) { next(err); }
});

// Admin package catalog — includes inactive items.
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const packages = await Package.findAll({ order: [['price', 'ASC']] });
    res.json({ packages });
  } catch (err) { next(err); }
});

// Add-on routes MUST remain above /:id or Express will treat "addons" as a package id.
router.get('/addons/list', async (req, res, next) => {
  try {
    const addons = await Addon.findAll({ where: { active: true }, order: [['price', 'ASC']] });
    res.json({ addons });
  } catch (err) { next(err); }
});

router.get('/addons/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const addons = await Addon.findAll({ order: [['price', 'ASC']] });
    res.json({ addons });
  } catch (err) { next(err); }
});

router.post('/addons', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = pick(req.body, ADDON_FIELDS);
    const error = validateAddon(data);
    if (error) return res.status(400).json({ error });
    const addon = await Addon.create(data);
    await logActivity(req, 'ADDON_CREATE', `Created add-on ${addon.name}`, 'addon', addon.id);
    res.status(201).json({ addon });
  } catch (err) { next(err); }
});

router.patch('/addons/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const addon = await Addon.findByPk(req.params.id);
    if (!addon) return res.status(404).json({ error: 'Add-on not found' });
    const data = pick(req.body, ADDON_FIELDS);
    const error = validateAddon(data, { partial: true });
    if (error) return res.status(400).json({ error });
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No valid fields supplied' });
    await addon.update(data);
    await logActivity(req, 'ADDON_UPDATE', `Updated add-on ${addon.name}`, 'addon', addon.id);
    res.json({ addon });
  } catch (err) { next(err); }
});

router.delete('/addons/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const addon = await Addon.findByPk(req.params.id);
    if (!addon) return res.status(404).json({ error: 'Add-on not found' });
    const appointments = await Appointment.findAll({ attributes: ['addon_ids'] });
    const used = appointments.some((appt) => {
      const ids = Array.isArray(appt.addon_ids) ? appt.addon_ids : [];
      return ids.includes(addon.id);
    });
    if (used) return res.status(409).json({ error: 'Add-on is used by an existing booking — deactivate it instead' });
    const addonName = addon.name;
    await addon.destroy();
    await logActivity(req, 'ADDON_DELETE', `Deleted add-on ${addonName}`, 'addon', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pkg = await Package.findOne({ where: { id: req.params.id, active: true } });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ package: pkg });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = pick(req.body, PACKAGE_FIELDS);
    const error = validatePackage(data);
    if (error) return res.status(400).json({ error });
    const pkg = await Package.create(data);
    await logActivity(req, 'PACKAGE_CREATE', `Created package ${pkg.name}`, 'package', pkg.id);
    res.status(201).json({ package: pkg });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    const data = pick(req.body, PACKAGE_FIELDS);
    const error = validatePackage(data, { partial: true });
    if (error) return res.status(400).json({ error });
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No valid fields supplied' });
    await pkg.update(data);
    await logActivity(req, 'PACKAGE_UPDATE', `Updated package ${pkg.name}`, 'package', pkg.id);
    res.json({ package: pkg });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const count = await Appointment.count({ where: { package_id: req.params.id } });
    if (count > 0) return res.status(409).json({ error: 'Package has bookings — deactivate it instead', bookings: count });
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    const pkgName = pkg.name;
    await pkg.destroy();
    await logActivity(req, 'PACKAGE_DELETE', `Deleted package ${pkgName}`, 'package', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
