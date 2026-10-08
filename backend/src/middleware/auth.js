const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized — no token' });
  try { req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Owner/Admin access required' });
  next();
}
function requireStaffOrAdmin(req, res, next) {
  if (!['admin', 'staff'].includes(req.user?.role)) return res.status(403).json({ error: 'Staff access required' });
  next();
}
module.exports = { authenticate, requireAdmin, requireStaffOrAdmin };
