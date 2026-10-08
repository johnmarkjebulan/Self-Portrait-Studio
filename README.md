# Pose and Pics Photography Studio

Full-stack studio booking and management system for **Owner/Admin, Staff, and Clients**.

## Latest complete update

### Visual / UI
- Consistent dark-sidebar + white-topbar interface for Owner, Staff, and Client portals.
- Notifications stay in the **upper-right bell** only; they are not duplicated in the sidebar.
- Photography-inspired motion system:
  - cinematic Ken Burns hero movement
  - soft moving light / gradient backgrounds
  - subtle grain and vignette on the landing hero
  - card lift and CTA shimmer
  - animated login/register photo panels
  - reduced-motion accessibility support
- Package cards use a consistent responsive grid and aligned card heights.

### Packages and bundles
- Owner can now **upload a package/bundle picture** from the Add/Edit Package modal.
- Uploaded package images are compressed in the browser before saving.
- Package pictures display in Owner management, public Packages, and Client booking.
- Existing Pose and Pics package posters are seeded as package references so they do not need to be manually entered again.

### Studio posts
- Owner can create, publish/hide, and delete studio posts.
- Owner post images open in a large preview when clicked.
- Staff can view published Owner posts in the Staff portal.
- Clients can view published posts, enlarge the picture, and **Like / Unlike** a post.
- Five supplied studio photos are included as initial Owner posts after migration/seed.

### Feedback
- Client ratings are **1 to 5 stars** and start unselected (not automatically 5 stars).
- General Studio Feedback is supported even without a completed appointment.
- Completed appointments can be reviewed once.
- Owner/Staff can view feedback and reply; the reply is visible to the Client.

### Registration and login
- Public registration creates Client accounts only.
- Registration requires a Gmail address and inbox verification.
- The client verifies the code, then returns to **Login** before entering the Client Dashboard.
- Staff accounts are created and controlled by the Owner.

### Brevo transactional email
- Gmail verification codes are sent through Brevo.
- Booking-received emails contain the appointment details and tracking number.
- When the Owner confirms or reschedules an appointment, a fresh appointment email is sent with:
  - tracking number
  - appointment date/time
  - package
  - total
  - scannable studio QR code
- Admin Settings includes **Email (Brevo)** status and a test-email action.
- API keys never need to be exposed to the frontend.

### QR studio check-in and automatic status
- Appointment QR payload format: `SP-STUDIO|<tracking-number>`.
- Owner/Admin scans the QR in **Scanner**.
- If the appointment is for today and is confirmed/rescheduled, a successful scan automatically changes it to **Ongoing**.
- Session start/end times are recorded.
- The system calculates the end time using the **selected package duration**.
- While the backend is running, due Ongoing sessions are checked regularly and automatically changed to **Completed** after their duration.
- The Client receives an in-app completion notification.
- Tracking number can be entered manually if the email app blocks the QR image.

### Studio location
`San Agustin St, Poblacion 4, Calaca, 4212 Batangas`

The public Contact section uses Google Maps for this address.

---

## Project structure

```text
Pose-and-Pics-Photography-Studio/
├── backend/
├── frontend/
├── package.json
└── README.md
```

## Local setup

### 1. Install dependencies
From the project root:

```powershell
npm install
```

### 2. Create `backend/.env`
This ZIP intentionally does **not** include your real `.env` credentials. Copy your existing working `backend/.env`, or copy `backend/.env.example` to `backend/.env` and fill in the real values.

Required core values:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
STUDIO_TIME_ZONE=Asia/Manila
DATABASE_URL=YOUR_SUPABASE_SESSION_POOLER_URL
DB_POOL_MAX=5
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d
```

Brevo values:

```env
BREVO_API_KEY=YOUR_REAL_BREVO_API_KEY
BREVO_SENDER_EMAIL=poseandpics@gmail.com
BREVO_SENDER_NAME=Pose and Pics Photography Studio
BREVO_REPLY_TO_EMAIL=poseandpics@gmail.com
BREVO_TIMEOUT_MS=12000
BREVO_TEST_EMAIL=
```

> The Brevo sender address must be registered/verified in the Brevo account. Keep the API key only in the backend `.env` and never commit it to GitHub.

### 3. Apply database migrations

```powershell
cd backend
npm run db:check
npm run db:migrate
```

The newest migration adds package image uploads and seeds the supplied Owner post photos.

### 4. Check Brevo
Still inside `backend`:

```powershell
npm run email:check
```

You can also log in as Owner and use **Settings → Email (Brevo)** to check the connection and send a test message.

### 5. Run backend

```powershell
npm run dev
```

Backend should be available at:

```text
http://localhost:5000
```

Keep this terminal open. The automatic Ongoing → Completed session lifecycle runs from the backend process.

### 6. Run frontend
Open another terminal:

```powershell
cd frontend
npm run dev
```

Frontend normally opens at:

```text
http://localhost:5173
```

If Vite uses another port such as 5174, update `FRONTEND_URL` in `backend/.env` to match and restart the backend.

---

## Role access

### Owner / Admin
Full studio management: appointments, scanner, queue, clients, packages/bundles, schedules, payments, analytics, reports, studio posts, feedback, staff accounts, and settings.

### Staff
Operational access only: daily appointments/booking information, client details needed for studio preparation, status/schedule monitoring, studio posts, and feedback handling. Sensitive financial reports, business reports, system settings, and staff management remain hidden.

### Client
Register/verify/login, book a session, view bookings and payments, view/like Studio Posts, submit 1–5 star feedback, see studio replies, and manage their account.

---

## Production reminder
- Vercel root directory: `frontend`
- Render root directory: `backend`
- Render start command: `npm start`
- Add all production environment variables in the hosting dashboard.
- Run `npm run db:migrate` against the production database before using the latest build.
- The automatic Ongoing → Completed worker requires the backend service to stay running.
