const STUDIO_TIME_ZONE = process.env.STUDIO_TIME_ZONE || 'Asia/Manila';

function dateKeyInTimeZone(date = new Date(), timeZone = STUDIO_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function dateTimeInStudioZone(dateString, timeString = '00:00') {
  // Philippines has a fixed UTC+08:00 offset. Keep date-only values from drifting
  // through UTC conversions while still producing a real Date for policy checks.
  return new Date(`${dateString}T${timeString}:00+08:00`);
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''))) return false;
  return true;
}

function weekdayKey(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: STUDIO_TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  return weekday;
}

function minutesFromTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function hoursUntilAppointment(dateString, timeString) {
  return (dateTimeInStudioZone(dateString, timeString).getTime() - Date.now()) / 3600000;
}

module.exports = {
  STUDIO_TIME_ZONE,
  dateKeyInTimeZone,
  dateTimeInStudioZone,
  isValidDateKey,
  isValidTime,
  weekdayKey,
  minutesFromTime,
  timeFromMinutes,
  hoursUntilAppointment,
};
