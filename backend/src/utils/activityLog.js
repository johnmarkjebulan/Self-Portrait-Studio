const { ActivityLog } = require('../models');

async function logActivity(req, action, description, entityType = null, entityId = null) {
  try {
    await ActivityLog.create({
      user_id: req.user?.id || null,
      user_name: req.user?.name || 'System',
      action,
      description: description ? String(description).slice(0, 4000) : null,
      entity_type: entityType,
      entity_id: entityId || null,
      ip_address: req.ip || null,
    });
  } catch (error) {
    // Audit logging must never break the primary workflow.
    console.error('Activity log creation failed:', error.message);
  }
}

module.exports = { logActivity };
