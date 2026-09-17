# Final Handoff — Self-Portrait Studio

## What this package is

This is the cleaned upgraded baseline built from the latest uploaded project. The goal of this pass was stability and integration first, not adding unrelated features.

## Core workflow now

1. **Settings** defines weekly operating hours, daily capacity, slot capacity, slot interval, payment policy, and cancellation/reschedule policy.
2. **Schedules** contains date-specific exceptions such as blocked slots or special capacity.
3. **Availability API** combines Settings, Schedule overrides, and existing active bookings.
4. **Client Booking** uses that same availability API.
5. **Admin rescheduling** uses the same availability validation instead of bypassing capacity rules.
6. **Scanner** checks a valid appointment into the live waiting queue.
7. **Queue** progresses Waiting → Now Serving → Completed.
8. **Payments, Feedback, Notifications, Analytics, and Reports** use the same backend records.

## Clean distribution rules

The final ZIP intentionally excludes:

- `frontend/node_modules/`
- `backend/node_modules/`
- `backend/.env`
- `*.bak`
- generated `dist/` folders
- editor/OS cache files

Run `SETUP_LOCAL.ps1` after extraction to recreate local dependencies and secrets.

## First run on the user's current PC

1. Start XAMPP MySQL. The setup script automatically finds common XAMPP locations including `D:\xampp`.
2. Open PowerShell in the project root.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\SETUP_LOCAL.ps1
```

4. Verify:

```powershell
powershell -ExecutionPolicy Bypass -File .\VERIFY_LOCAL.ps1
```

5. Start:

```powershell
powershell -ExecutionPolicy Bypass -File .\START_LOCAL.ps1
```

6. Open `http://localhost:5173`.

## Demo accounts for a fresh database

- Admin: `admin@selfportrait.studio` / `admin2026`
- Client: `maria@gmail.com` / `client2026`

An existing database is not reset by `SETUP_LOCAL.ps1`. Existing credentials therefore remain unchanged unless you intentionally reset/reseed the database.

## Database safety

Do not use reset commands on data you want to keep.

Safe:

```powershell
cd backend
npm run db:migrate
npm run db:check
npm run db:sync:safe
```

Destructive:

```powershell
npm run db:reset:danger
npm run seed:demo:reset
```

## Validation performed during packaging

- backend syntax check across project JavaScript files;
- backend foundation test suite;
- frontend relative-import resolution check;
- stale-import/field scan for the known legacy issues;
- clean-package scan to ensure secrets, dependency folders, backup files, and build output are not distributed.

A true frontend production build must be run on the user's Windows install after `npm install`, because the uploaded dependency folder contained Windows-native Vite/Rolldown binaries and cannot be executed in the Linux packaging environment. `VERIFY_LOCAL.ps1` performs that build on the user's machine.

## Next upgrade boundary

Do not add payment gateways, WebSockets, or production object storage until the manual regression checklist passes locally. The next useful development cycle should be based on real observed workflow issues from this upgraded baseline, not speculative features.
