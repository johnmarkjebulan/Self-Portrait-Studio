# Self-Portrait Studio Upgrade Report

## Baseline decision

The project stays on React/Vite + Express/Sequelize + XAMPP MySQL/MariaDB. The main problem was not the stack; it was duplicated business rules and incomplete connections between modules.

## Foundation changes

- Booking availability now comes from one backend availability service instead of client-visible appointment lists.
- Admin Settings defines weekly operating hours, daily capacity, slot capacity, and slot interval.
- Admin Schedules is a date/time override layer for blocks or special capacity.
- Booking creation and rescheduling use the same authoritative capacity check.
- Philippine calendar dates use `Asia/Manila` helpers instead of UTC-only date slicing.
- Appointment status changes are validated by a backend state machine.
- QR check-in enters the live `waiting` queue and duplicate status jumps are restricted.
- Package/add-on admin routes are separated from public active-only routes.
- Payment creation and verification are server validated; balances are recalculated from verified payments.
- Feedback can only be submitted by the appointment owner after completion.
- Notification badges use an unread-count endpoint; notifications can deep-link to the related module.
- Authentication/profile inputs are allowlisted and password rules are consistent.
- API errors are centralized and React has a render error boundary.
- Fresh SQL, seed credentials, Login demo buttons, docs, and setup scripts use the same demo accounts.
- A non-destructive migration runner was added for future schema changes.

## Responsive pass

- Portal layout padding adapts on small screens.
- Key dashboard/stat grids collapse at mobile widths.
- Booking calendar/time selection and administrative detail panels use responsive layouts.
- Notification headers/dropdowns adapt to narrow viewports.
- Existing data tables retain horizontal scrolling where converting them to cards would remove useful density.

## Deliberately not added yet

- WebSockets: 10-second notification polling is sufficient at this project scale.
- Payment gateway integration: core manual payment workflow should remain stable before adding a provider.
- Cloud object storage: base64 proof storage remains acceptable for a local academic/demo dataset, but should move to Cloudinary/S3-like storage before production scale.
- Framework rewrite: not justified.

## Removed from distribution

- `backend/.env` (local secret)
- frontend/backend `node_modules`
- `frontend/src/services/api.js.bak`
- generated build/cache files

## Remaining production considerations

Before public deployment, move payment proofs to object storage, use production secret management, enforce HTTPS, use a managed database backup strategy, and consider HTTP-only cookie authentication.
