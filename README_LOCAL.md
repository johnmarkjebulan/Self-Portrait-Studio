# Self-Portrait Studio — Upgraded Stable Baseline

This package is prepared for **XAMPP MySQL/MariaDB + Express/Sequelize + React/Vite**.

## Recommended folder structure

```text
self-portrait-studio-upgraded/
├─ backend/
│  ├─ config/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ migrations/
│  ├─ scripts/
│  ├─ seeders/
│  ├─ tests/
│  ├─ utils/
│  ├─ .env.example
│  ├─ package.json
│  └─ server.js
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ pages/
│  │  └─ services/
│  ├─ package.json
│  └─ vite.config.js
├─ database/
│  ├─ migrations/
│  └─ selfportrait_studio.sql
├─ docs/
│  ├─ PROJECT_AUDIT.md
│  ├─ UPGRADE_REPORT.md
│  └─ TEST_CHECKLIST.md
├─ SETUP_LOCAL.ps1
├─ START_LOCAL.ps1
└─ .gitignore
```

## Easiest setup

1. Install/open XAMPP and start **MySQL**.
2. Open PowerShell in this project root.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\SETUP_LOCAL.ps1
```

The setup script will:
- create `backend/.env` if missing;
- generate a random local JWT secret;
- import `database/selfportrait_studio.sql` only if the database does not exist;
- run `npm install` for backend and frontend;
- apply non-destructive schema migrations;
- test the database connection.

Then start the app:

```powershell
powershell -ExecutionPolicy Bypass -File .\START_LOCAL.ps1
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

Backend health: `http://localhost:5000/api/health`

## Default admin account

- Email: `admin@selfportrait.studio`
- Password: `admin2026`

Default client demo:

- Email: `maria@gmail.com`
- Password: `client2026`

Change the admin password after the first successful login.

## Manual phpMyAdmin import

If you prefer phpMyAdmin:

1. Start Apache and MySQL in XAMPP.
2. Open phpMyAdmin.
3. Choose **Import**.
4. Select `database/selfportrait_studio.sql`.
5. Run the import.

The SQL file creates the `selfportrait_studio` database and its initial admin/settings/packages/add-ons.

> Warning: importing `selfportrait_studio.sql` again drops and recreates the app tables. Use it for a fresh installation, not as a migration.

## Database commands

Safe connection check:

```powershell
cd backend
npm run db:check
```

Safe missing-table sync:

```powershell
npm run db:sync:safe
```

Destructive commands are intentionally named clearly:

```powershell
npm run db:reset:danger
npm run seed:demo:reset
```

Both reset-style commands can destroy current data. Do not run them on a database you want to keep.


## Upgrade architecture

- **Settings** is the source of truth for weekly business hours, daily capacity, slot capacity, and slot interval.
- **Schedules** stores date-specific overrides only.
- **Availability API** merges Settings + overrides + existing bookings.
- **Booking and rescheduling** use the same backend availability validation.
- **Scanner** sends a confirmed appointment directly to the live Waiting queue.
- **Queue** progresses Waiting → Now Serving → Completed.
- **Notifications** are linked back to their related module.

## Validation commands

```powershell
cd backend
npm test
npm run db:check
```

Then from `frontend`:

```powershell
npm run build
```

See `docs/TEST_CHECKLIST.md` for the manual regression pass.

## One-command verification after setup

After `SETUP_LOCAL.ps1` succeeds and MySQL is running, you can run:

```powershell
powershell -ExecutionPolicy Bypass -File .\VERIFY_LOCAL.ps1
```

It runs the backend foundation tests, applies pending non-destructive migrations, checks the database connection, and performs a frontend production build. Use this before major changes or before handing the project to another PC.
