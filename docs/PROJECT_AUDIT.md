# Self-Portrait Studio — Baseline Project Audit

## Audit goal

Create a stable local baseline before additional UI/features are added. The uploaded project was reviewed across the React frontend, API service layer, Express routes, Sequelize models, seed/config files, and local database assumptions.

## Baseline structure decision

The existing top-level separation (`frontend/` + `backend/`) is already appropriate for this project. A risky large-scale move into a new monorepo framework was intentionally avoided. The structure was cleaned by adding only the missing support areas:

- `database/` — XAMPP/MySQL fresh-install SQL.
- `backend/utils/` — shared backend helper logic.
- `docs/` — audit/setup documentation.
- root setup/start scripts.
- `.env.example` and `.gitignore`.

This keeps imports and deployment boundaries simple while reducing regression risk.

## Critical issues found and corrected

### 1. Frontend imported a deleted `services/db`

`AdminLayout.jsx` and `ClientLayout.jsx` still depended on the old local-storage `notificationsDb`, while the project had already migrated to `services/api.js`.

**Fix:** both layouts now use `notificationsApi`. A dedicated unread-count endpoint was added so the notification badge no longer downloads the entire notification history on every poll.

### 2. Notification field mismatch

Admin Notifications expected `is_read`, while the Sequelize model/API returns `read`.

**Fix:** Admin Notifications now uses `read` consistently.

### 3. Admin notifications were rarely created

The notification retrieval API was valid, but booking/payment/feedback actions mostly created notifications only for clients.

**Fix:** reusable `notifyAdmins()` helper added. Admin accounts now receive notifications for:

- new bookings;
- cancellation requests;
- reschedule requests;
- new payment submissions;
- new feedback.

### 4. Appointment route ordering broke scanner/queue lookups

`GET /appointments/:id` was declared before `GET /appointments/tracking/:tn` and `GET /appointments/queue/today`.

**Fix:** specific routes now come before the dynamic `/:id` route.

### 5. Appointment date/time field mismatch

Some admin pages/reports used `appointment_date` and `appointment_time`, while the actual model uses `date` and `time`.

**Fix:** admin appointment display, rescheduling, and CSV reports now use `date`/`time`.

### 6. Reschedule/cancellation reasons were discarded

The client sent `cancellation_reason` and `reschedule_reason`, but those fields did not exist in the Appointment model/database.

**Fix:** fields added to the Sequelize model and SQL schema.

### 7. Admin could set `rejected`, but Appointment ENUM did not support it

**Fix:** `rejected` added to Appointment status in model and SQL schema, with client notification handling.

### 8. Appointment create/update accepted unsafe fields

The old booking route spread the entire client request into `Appointment.create()` and non-admin PATCH requests could update unintended fields.

**Fix:** create and update operations now use explicit allowlists. Client updates are restricted to cancellation/reschedule requests and their reason fields.

### 9. Tracking and queue numbering were fragile

Tracking used `count + 48`; queue numbering used `count + 1`, both of which could duplicate after deletions.

**Fix:** tracking increments from the latest tracking number for the year; queue numbers increment from the maximum queue number for the selected date.

### 10. Add-on pricing was not included in backend totals

The frontend showed package + add-on total, but backend saved package price only.

**Fix:** backend validates selected active add-ons and calculates authoritative total/down payment from package + add-ons.

### 11. Admin Payments API did not return the data its page expected

The page expected client and appointment information, but the route returned only Payment rows.

**Fix:** payment GET now includes client, appointment, and nested package data.

### 12. Payment proof was silently discarded

Client pages sent `proof_filename` and base64 `proof_data`, but the Payment model/API had only `proof_url`.

**Fix:** `proof_filename` and `proof_data` were added to model/schema/API. Local uploads are limited to 5 MB in the client UI.

### 13. Payment verification could double-count money

Repeated verification could increment `amount_paid` multiple times. Rejected previously verified payments could also leave totals inconsistent.

**Fix:** appointment payment totals are recalculated from all currently verified payments after each status change. Verification is rejected if it would exceed the appointment total.

### 14. MySQL DECIMAL values could behave as strings in React

This could cause string concatenation when adding package/add-on prices or revenue.

**Fix:** monetary fields are normalized to JavaScript numbers in the frontend API service layer.

### 15. Add-on delete UI called a nonexistent soft-delete field

The UI sent `{ deleted: true }`, but the Addon model has no `deleted` field.

**Fix:** UI now calls the existing DELETE add-on API.

### 16. Toast API was inconsistent

Some pages used `toast`, while others expected `showToast`; the context only exposed `toast`.

**Fix:** ToastContext exposes both names, pointing to the same function.

### 17. Schedules page was only mock/local state

The page explicitly had TODOs and lost all schedules on refresh.

**Fix:** added Schedule model, SQL table, `/api/schedules` CRUD API, and a single availability service. Settings now generates the normal weekly slots automatically; Schedule rows are date-specific overrides for blocks, special openings, or capacity changes. Booking and rescheduling both validate against the merged availability result.

### 18. Automatic `sequelize.sync({ alter: true })` ran on every development start

That is risky once phpMyAdmin SQL becomes the local source of truth.

**Fix:** normal startup now only authenticates. Optional safe sync is controlled by `DB_AUTO_SYNC=true`; default is false. Destructive commands are explicitly named `db:reset:danger` and `seed:demo:reset`.

### 19. Missing `.env` caused unclear startup failures

**Fix:** `.env.example` added, server gives a clear error if `JWT_SECRET` is missing, default local DB host is `127.0.0.1`, and setup script generates a random local JWT secret.

### 20. Vite config warning for `__dirname`

**Fix:** alias now uses `import.meta.dirname`, compatible with the user's modern Node/Vite setup.

## Database package

`database/selfportrait_studio.sql` is a fresh-install SQL file for XAMPP MySQL/MariaDB. It includes:

- users;
- studio settings;
- packages;
- add-ons;
- schedules;
- appointments;
- payments;
- notifications;
- feedback;
- activity logs;
- indexes and foreign keys;
- initial studio settings/packages/add-ons;
- initial admin account.

Default local demo accounts:

- Admin: `admin@selfportrait.studio` / `admin2026`
- Client: `maria@gmail.com` / `client2026`

Change demo passwords before any real deployment.

## Validation completed

- All backend `.js` files pass `node --check` after the changes.
- Frontend relative-import resolution was checked; no missing local import remains.
- Searches for known stale fields/imports (`services/db`, `notificationsDb`, `is_read`, `appointment_date`, `appointment_time`, `is_active`, `payment_method`, fake add-on delete field) are clean.
- Model/API/SQL naming was aligned for the corrected fields.

## Validation that still requires the user's Windows/XAMPP environment

A true end-to-end run requires an actual MySQL/MariaDB process and installed npm dependencies. The working environment used for this audit does not provide the user's XAMPP service, so the final runtime checks should be performed locally after import:

1. `npm run db:check`
2. backend `npm run dev`
3. frontend `npm run dev`
4. register/login
5. create booking with add-on
6. submit payment proof
7. admin verify payment
8. cancellation/reschedule request
9. schedule slot create/block/unblock
10. QR/tracking lookup
11. feedback submit
12. notification badge/list checks

## Deliberately deferred for production deployment

The local academic/demo build is intentionally not over-engineered. Before real public deployment:

- move payment proof images from database base64 to Cloudinary/S3/object storage;
- replace localStorage JWT persistence with a secure HTTP-only cookie/session design;
- configure production CORS, HTTPS, secret storage, database backups, and monitoring;
- expand the current foundation tests into API/integration tests against a disposable database;
- consider WebSockets only if real-time queue/notification load actually requires it.

The local core workflow, migrations, availability service, state validation, queue integration, responsive pass, and shared API client are included in this upgraded package.
