export const STUDIO_TIME_ZONE = 'Asia/Manila';

export function studioDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STUDIO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function studioToday() {
  return studioDateKey(new Date());
}

export function studioMonthStart() {
  return `${studioToday().slice(0, 7)}-01`;
}

export function studioAppointmentDate(date, time = "00:00") {
  return new Date(`${date}T${time}:00+08:00`);
}
