const test = require('node:test');
const assert = require('node:assert/strict');
const { dateKeyInTimeZone, isValidDateKey, isValidTime } = require('../utils/dateTime');
const { canAdminTransition, canClientRequest } = require('../utils/appointmentState');
const { computeDateAvailability } = require('../utils/availability');

test('date helpers use studio calendar dates', () => {
  assert.equal(dateKeyInTimeZone(new Date('2026-09-14T16:30:00Z')), '2026-09-15');
  assert.equal(isValidDateKey('2026-09-14'), true);
  assert.equal(isValidDateKey('09/14/2026'), false);
  assert.equal(isValidTime('09:30'), true);
  assert.equal(isValidTime('25:00'), false);
});

test('appointment state machine blocks invalid jumps', () => {
  assert.equal(canAdminTransition('pending', 'confirmed'), true);
  assert.equal(canAdminTransition('pending', 'completed'), false);
  assert.equal(canAdminTransition('waiting', 'now_serving'), true);
  assert.equal(canAdminTransition('completed', 'confirmed'), false);
  assert.equal(canClientRequest('confirmed', 'cancellation_requested'), true);
  assert.equal(canClientRequest('completed', 'reschedule_requested'), false);
});

test('default availability respects hours, capacity and overrides', () => {
  const result = computeDateAvailability('2026-09-14', { // Monday
      business_hours: { Mon: { open: '09:00', close: '12:00', closed: false } },
      slot_interval_minutes: 60,
      slot_capacity: 2,
      daily_capacity: 4,
    }, [
      { time: '09:00', status: 'confirmed' },
      { time: '09:00', status: 'pending' },
      { time: '10:00', status: 'confirmed' },
    ], [
      { time: '10:00', blocked: true, max_capacity: 2 },
      { time: '11:00', blocked: false, max_capacity: 1 },
    ]);
  assert.equal(result.daily_booked, 3);
  assert.equal(result.slots.find((s) => s.time === '09:00').available, false);
  assert.equal(result.slots.find((s) => s.time === '10:00').blocked, true);
  assert.equal(result.slots.find((s) => s.time === '11:00').remaining, 1);
});
