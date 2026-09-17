require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Package, Addon, Appointment, Payment, Notification, Feedback, StudioSettings } = require('../models');
const { dateKeyInTimeZone } = require('../utils/dateTime');

const HOURS = { open: '09:00', close: '17:00', closed: false };

async function seed() {
  console.log('Syncing database...');
  await sequelize.sync({ force: true });

  console.log('Seeding studio settings...');
  await StudioSettings.create({
    id: 1,
    studio_name: 'Self-Portrait Studio',
    studio_address: 'Baclaran, Balayan, Batangas',
    studio_lat: 13.9371,
    studio_lng: 120.7276,
    studio_phone: '0917-123-4567',
    studio_email: 'hello@selfportrait.studio',
    business_hours: {
      Mon: HOURS, Tue: HOURS, Wed: HOURS, Thu: HOURS,
      Fri: HOURS, Sat: HOURS, Sun: { ...HOURS, closed: true },
    },
    daily_capacity: 10,
    slot_capacity: 3,
    slot_interval_minutes: 60,
    down_payment_type: 'fixed',
    down_payment_value: 500,
    cancellation_hours: 24,
    reschedule_hours: 48,
    grace_period_minutes: 15,
    no_show_forfeits_downpayment: true,
    qr_gcash_number: '09171234567',
    qr_paymaya_number: '09171234567',
  });

  console.log('Seeding users...');
  const adminHash = await bcrypt.hash('admin2026', 12);
  const clientHash = await bcrypt.hash('client2026', 12);

  const admin = await User.create({ name: 'Studio Admin', email: 'admin@selfportrait.studio', mobile: '0917-000-0001', password_hash: adminHash, role: 'admin' });
  const client1 = await User.create({ name: 'Maria Santos', email: 'maria@gmail.com', mobile: '0917-111-2222', password_hash: clientHash, role: 'client' });
  const client2 = await User.create({ name: 'Juan dela Cruz', email: 'juan@example.com', mobile: '0917-333-4444', password_hash: clientHash, role: 'client' });
  const client3 = await User.create({ name: 'Ana Reyes', email: 'ana@example.com', mobile: '0917-555-6666', password_hash: clientHash, role: 'client' });

  console.log('Seeding packages...');
  const pkg1 = await Package.create({ name: 'Solo Package', description: 'Perfect for individual portraits.', price: 1500, duration: 45, max_people: 1, edited_photos: 10, printed_photos: 0, services: ['Digital copies', 'Basic retouching'], active: true });
  const pkg2 = await Package.create({ name: 'Couple Package', description: 'A romantic session for two.', price: 2500, duration: 60, max_people: 2, edited_photos: 15, printed_photos: 2, services: ['Digital copies', 'Premium retouching', 'Online gallery'], active: true });
  const pkg3 = await Package.create({ name: 'Family Package', description: 'Capture the whole family together.', price: 3500, duration: 90, max_people: 6, edited_photos: 20, printed_photos: 5, services: ['Digital copies', 'Premium retouching', 'Printed 8x10', 'Online gallery'], active: true });

  console.log('Seeding add-ons...');
  await Addon.create({ name: 'Extra Outfit Change', description: 'Add one more outfit change to your session.', price: 300, active: true });
  await Addon.create({ name: 'Printed 4R Photos (5 pcs)', description: '5 additional printed 4R photos.', price: 250, active: true });
  await Addon.create({ name: 'Rush Editing (24hrs)', description: 'Get your edited photos within 24 hours.', price: 500, active: true });

  console.log('Seeding appointments...');
  const today = dateKeyInTimeZone();
  const shiftDate = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return dateKeyInTimeZone(d); };
  const future = (days) => shiftDate(days);
  const past = (days) => shiftDate(-days);

  // Completed past appointments
  const a1 = await Appointment.create({ tracking_number: `SP-${new Date().getFullYear()}-0001`, client_id: client1.id, package_id: pkg1.id, date: past(10), time: '09:00', num_people: 1, total_price: 1500, down_payment: 500, amount_paid: 1500, remaining_balance: 0, payment_status: 'fully_paid', status: 'completed', queue_number: 1, addon_ids: [] });
  const a2 = await Appointment.create({ tracking_number: `SP-${new Date().getFullYear()}-0002`, client_id: client2.id, package_id: pkg2.id, date: past(7), time: '10:00', num_people: 2, total_price: 2500, down_payment: 500, amount_paid: 2500, remaining_balance: 0, payment_status: 'fully_paid', status: 'completed', queue_number: 2, addon_ids: [] });

  // Today's appointments
  const a3 = await Appointment.create({ tracking_number: `SP-${new Date().getFullYear()}-0003`, client_id: client3.id, package_id: pkg1.id, date: today, time: '09:00', num_people: 1, total_price: 1500, down_payment: 500, amount_paid: 500, remaining_balance: 1000, payment_status: 'partially_paid', status: 'confirmed', queue_number: null, addon_ids: [] });

  // Upcoming appointments
  const a4 = await Appointment.create({ tracking_number: `SP-${new Date().getFullYear()}-0004`, client_id: client1.id, package_id: pkg3.id, date: future(3), time: '10:00', num_people: 4, total_price: 3500, down_payment: 500, amount_paid: 500, remaining_balance: 3000, payment_status: 'partially_paid', status: 'confirmed', queue_number: null, addon_ids: [] });
  const a5 = await Appointment.create({ tracking_number: `SP-${new Date().getFullYear()}-0005`, client_id: client2.id, package_id: pkg1.id, date: future(5), time: '11:00', num_people: 1, total_price: 1500, down_payment: 500, amount_paid: 0, remaining_balance: 1500, payment_status: 'payment_required', status: 'pending', queue_number: null, addon_ids: [] });

  console.log('Seeding payments...');
  await Payment.create({ appointment_id: a1.id, client_id: client1.id, amount: 1500, type: 'full', reference_number: 'GCash-001', payment_date: past(11), status: 'verified', verified_by: admin.id, verified_at: new Date() });
  await Payment.create({ appointment_id: a2.id, client_id: client2.id, amount: 2500, type: 'full', reference_number: 'Maya-002', payment_date: past(8), status: 'verified', verified_by: admin.id, verified_at: new Date() });
  await Payment.create({ appointment_id: a3.id, client_id: client3.id, amount: 500, type: 'down_payment', reference_number: 'GCash-003', payment_date: past(2), status: 'verified', verified_by: admin.id, verified_at: new Date() });
  await Payment.create({ appointment_id: a4.id, client_id: client1.id, amount: 500, type: 'down_payment', reference_number: 'GCash-004', payment_date: past(1), status: 'verified', verified_by: admin.id, verified_at: new Date() });

  console.log('Seeding feedback...');
  await Feedback.create({ appointment_id: a1.id, client_id: client1.id, rating: 5, comment: 'Amazing experience! The photos turned out beautifully.', booking_experience: 5, staff_service: 5, studio_experience: 5, cleanliness: 5, overall_satisfaction: 5 });
  await Feedback.create({ appointment_id: a2.id, client_id: client2.id, rating: 4, comment: 'Great session, loved the backdrop options.', booking_experience: 4, staff_service: 5, studio_experience: 4, cleanliness: 5, overall_satisfaction: 4 });

  console.log('Seeding notifications...');
  await Notification.create({ user_id: client1.id, title: 'Booking Confirmed', message: `Your appointment ${a4.tracking_number} has been confirmed!`, type: 'booking', read: false, related_id: a4.id, related_type: 'appointment' });
  await Notification.create({ user_id: client2.id, title: 'Payment Required', message: `Please submit your down payment for ${a5.tracking_number}.`, type: 'payment', read: false, related_id: a5.id, related_type: 'appointment' });

  console.log('\n✅ Seed complete!');
  console.log('Admin login:  admin@selfportrait.studio / admin2026');
  console.log('Client login: maria@gmail.com / client2026');
  console.log('             juan@example.com  / client2026');
  console.log('             ana@example.com   / client2026');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
