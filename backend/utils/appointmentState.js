const ADMIN_TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['waiting', 'rescheduled', 'cancelled', 'no_show'],
  cancellation_requested: ['cancelled', 'confirmed'],
  reschedule_requested: ['rescheduled', 'confirmed'],
  rescheduled: ['confirmed', 'waiting', 'cancelled', 'no_show'],
  checked_in: ['waiting', 'no_show'], // legacy compatibility
  waiting: ['now_serving', 'cancelled', 'no_show'],
  now_serving: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  rejected: [],
};

const CLIENT_REQUEST_TRANSITIONS = {
  pending: ['cancellation_requested'],
  confirmed: ['cancellation_requested', 'reschedule_requested'],
  rescheduled: ['cancellation_requested', 'reschedule_requested'],
};

function canAdminTransition(from, to) {
  if (!to || from === to) return true;
  return (ADMIN_TRANSITIONS[from] || []).includes(to);
}

function canClientRequest(from, to) {
  return (CLIENT_REQUEST_TRANSITIONS[from] || []).includes(to);
}

module.exports = {
  ADMIN_TRANSITIONS,
  CLIENT_REQUEST_TRANSITIONS,
  canAdminTransition,
  canClientRequest,
};
