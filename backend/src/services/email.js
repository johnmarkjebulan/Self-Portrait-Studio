const BREVO_API_BASE = 'https://api.brevo.com/v3';
const BREVO_SEND_URL = `${BREVO_API_BASE}/smtp/email`;
const DEFAULT_STUDIO_NAME = 'Pose and Pics Photography Studio';
const DEFAULT_STUDIO_ADDRESS = 'San Agustin St, Poblacion 4, Calaca, 4212 Batangas';

function clean(value) {
  return String(value || '').trim();
}

function configured() {
  return Boolean(clean(process.env.BREVO_API_KEY) && clean(process.env.BREVO_SENDER_EMAIL));
}

function configurationStatus() {
  return {
    configured: configured(),
    has_api_key: Boolean(clean(process.env.BREVO_API_KEY)),
    has_sender_email: Boolean(clean(process.env.BREVO_SENDER_EMAIL)),
    sender_email: clean(process.env.BREVO_SENDER_EMAIL) || null,
    sender_name: clean(process.env.BREVO_SENDER_NAME) || DEFAULT_STUDIO_NAME,
  };
}

function assertConfigured() {
  if (configured()) return;
  const err = new Error(
    'Brevo email is not configured. Add BREVO_API_KEY and a verified BREVO_SENDER_EMAIL to backend/.env.'
  );
  err.code = 'BREVO_NOT_CONFIGURED';
  throw err;
}

function timeoutSignal(ms = Number(process.env.BREVO_TIMEOUT_MS || 12000)) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function parseBrevoError(response) {
  const raw = await response.text().catch(() => '');
  let message = raw;
  try {
    const parsed = JSON.parse(raw || '{}');
    message = parsed.message || parsed.code || raw;
  } catch {}
  return clean(message).slice(0, 450) || `HTTP ${response.status}`;
}

async function brevoFetch(url, options = {}) {
  assertConfigured();
  const timer = timeoutSignal();
  const headers = {
    Accept: 'application/json',
    'api-key': clean(process.env.BREVO_API_KEY),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };
  Object.keys(headers).forEach((key) => {
    if (headers[key] === undefined || headers[key] === null || headers[key] === '') delete headers[key];
  });

  try {
    const response = await fetch(url, {
      ...options,
      signal: timer.signal,
      headers,
    });
    if (!response.ok) {
      const detail = await parseBrevoError(response);
      const err = new Error(`Brevo request failed (${response.status}): ${detail}`);
      err.status = response.status;
      err.code = 'BREVO_REQUEST_FAILED';
      throw err;
    }
    return response;
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Brevo request timed out. Check your internet connection and try again.');
      timeoutErr.code = 'BREVO_TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    timer.clear();
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function emailShell({ eyebrow = 'POSE AND PICS', title, body }) {
  const studioName = escapeHtml(clean(process.env.BREVO_SENDER_NAME) || DEFAULT_STUDIO_NAME);
  return `
  <div style="margin:0;padding:28px 12px;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#111827">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:22px;overflow:hidden;box-shadow:0 12px 40px rgba(17,24,39,.08)">
      <div style="background:#0d1117;padding:26px 30px">
        <div style="font-size:11px;letter-spacing:3px;color:#f59e0b;font-weight:700">${escapeHtml(eyebrow)}</div>
        <div style="font-size:21px;color:#ffffff;font-weight:700;margin-top:7px">${studioName}</div>
      </div>
      <div style="padding:32px 30px">
        <h1 style="font-size:25px;line-height:1.25;margin:0 0 18px;color:#111827">${escapeHtml(title)}</h1>
        ${body}
      </div>
      <div style="padding:20px 30px;background:#fafafa;border-top:1px solid #eeeeee;font-size:12px;line-height:1.7;color:#6b7280">
        ${escapeHtml(DEFAULT_STUDIO_ADDRESS)}<br>
        0910 831 3847 · poseandpics@gmail.com
      </div>
    </div>
  </div>`;
}

async function checkBrevoAccount() {
  const response = await brevoFetch(`${BREVO_API_BASE}/account`, { method: 'GET' });
  const payload = await response.json().catch(() => ({}));
  return {
    ok: true,
    email: payload.email || null,
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    companyName: payload.companyName || null,
  };
}

async function sendEmail({ to, subject, html, text, replyTo, tags }) {
  const recipient = clean(to).toLowerCase();
  if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) {
    const err = new Error('A valid recipient email address is required.');
    err.code = 'INVALID_EMAIL_RECIPIENT';
    throw err;
  }

  const senderEmail = clean(process.env.BREVO_SENDER_EMAIL);
  const senderName = clean(process.env.BREVO_SENDER_NAME) || DEFAULT_STUDIO_NAME;
  const defaultReplyTo = clean(process.env.BREVO_REPLY_TO_EMAIL || senderEmail);

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipient }],
    subject: clean(subject),
  };
  // Brevo accepts an HTML or plain-text body. Prefer the branded HTML body
  // and keep plain text as a fallback only when HTML is not supplied.
  if (clean(html)) payload.htmlContent = html;
  else payload.textContent = clean(text);
  const reply = clean(replyTo || defaultReplyTo);
  if (reply) payload.replyTo = { email: reply, name: senderName };
  if (Array.isArray(tags) && tags.length) payload.tags = tags.slice(0, 10);

  const response = await brevoFetch(BREVO_SEND_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json().catch(() => ({}));
}

async function sendVerificationCode(to, name, code) {
  const safeName = escapeHtml(name || 'Client');
  const safeCode = escapeHtml(code);
  const html = emailShell({
    eyebrow: 'EMAIL VERIFICATION',
    title: 'Verify your email address',
    body: `
      <p style="margin:0 0 16px;color:#4b5563;line-height:1.7">Hi ${safeName},</p>
      <p style="margin:0 0 22px;color:#4b5563;line-height:1.7">Use the verification code below to finish creating your Pose and Pics account.</p>
      <div style="background:#fff8e8;border:1px solid #fde6ad;border-radius:16px;padding:22px;text-align:center;margin:0 0 22px">
        <div style="font-size:12px;color:#92400e;font-weight:700;letter-spacing:2px">YOUR CODE</div>
        <div style="font-size:34px;color:#111827;font-weight:800;letter-spacing:9px;margin-top:8px">${safeCode}</div>
      </div>
      <p style="margin:0;color:#6b7280;line-height:1.7;font-size:13px">This code expires in 15 minutes. If you did not create this account, you can ignore this email.</p>`,
  });

  return sendEmail({
    to,
    subject: 'Your Pose and Pics verification code',
    text: `Hi ${name}, your Pose and Pics verification code is ${code}. It expires in 15 minutes.`,
    html,
    tags: ['account-verification'],
  });
}

function buildAppointmentQrUrl(tracking) {
  const payload = `SP-STUDIO|${clean(tracking)}`;
  return `https://quickchart.io/qr?text=${encodeURIComponent(payload)}&size=240&margin=2&ecLevel=M`;
}

async function sendAppointmentConfirmation({ to, name, appointment, pkg }) {
  const total = Number(appointment.total_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tracking = clean(appointment.tracking_number);
  const packageName = pkg?.name || 'Studio Session';
  const safeName = escapeHtml(name || 'Client');
  const qrUrl = buildAppointmentQrUrl(tracking);
  const isConfirmed = ['confirmed', 'rescheduled'].includes(String(appointment.status || ''));
  const emailTitle = isConfirmed ? 'Your appointment is confirmed' : 'We received your booking';
  const statusLabel = isConfirmed ? 'Confirmed — ready for studio check-in' : 'Booking request received';

  const rows = [
    ['Tracking No.', tracking],
    ['Date', appointment.date],
    ['Time', appointment.time],
    ['Package', packageName],
    ['Status', statusLabel],
    ['Total', `₱${total}`],
  ].map(([label, value]) => `<tr><td style="padding:11px 0;color:#6b7280;border-bottom:1px solid #eeeeee;width:42%">${escapeHtml(label)}</td><td style="padding:11px 0;color:#111827;font-weight:700;border-bottom:1px solid #eeeeee">${escapeHtml(value)}</td></tr>`).join('');

  const html = emailShell({
    eyebrow: 'APPOINTMENT CONFIRMATION',
    title: emailTitle,
    body: `
      <p style="margin:0 0 16px;color:#4b5563;line-height:1.7">Hi ${safeName},</p>
      <p style="margin:0 0 22px;color:#4b5563;line-height:1.7">${isConfirmed ? 'Your appointment is confirmed. Keep the tracking number and QR code below for your studio visit.' : 'Your appointment request has been recorded. Keep the tracking number and QR code below. The QR can start the session once the Owner confirms the appointment.'}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:22px">${rows}</table>
      <div style="padding:20px;border:1px solid #fde6ad;background:#fffaf0;border-radius:18px;text-align:center;margin:0 0 22px">
        <div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#92400e">STUDIO CHECK-IN QR</div>
        <img src="${qrUrl}" alt="Appointment QR code" width="220" height="220" style="display:block;margin:14px auto 10px;width:220px;height:220px;max-width:100%;background:#fff;border-radius:12px" />
        <div style="font-family:monospace;font-size:20px;font-weight:800;color:#111827;letter-spacing:1px">${escapeHtml(tracking)}</div>
        <p style="font-size:12px;line-height:1.6;color:#6b7280;margin:10px 0 0">Show this QR code to the Owner/Admin when you arrive. Scanning it starts your studio session as <b>Ongoing</b>. The system automatically marks it <b>Completed</b> after the package duration.</p>
      </div>
      <div style="padding:15px 17px;border-radius:14px;background:#f9fafb;color:#4b5563;font-size:13px;line-height:1.7">If images are blocked in your email app, the tracking number above can also be entered manually in the studio scanner.</div>`,
  });

  return sendEmail({
    to,
    subject: `${isConfirmed ? 'Pose and Pics appointment confirmed' : 'Pose and Pics booking received'} · ${tracking}`,
    text: `Hi ${name}, your booking ${tracking} is ${isConfirmed ? 'confirmed' : 'received'} for ${appointment.date} at ${appointment.time}. Package: ${packageName}. Total: PHP ${total}. Show tracking number ${tracking} at the studio for check-in.`,
    html,
    tags: ['appointment-confirmation'],
  });
}

async function sendBrevoTestEmail(to) {
  const html = emailShell({
    eyebrow: 'EMAIL SETUP TEST',
    title: 'Brevo is connected successfully',
    body: '<p style="margin:0;color:#4b5563;line-height:1.7">This test confirms that the Pose and Pics backend can send transactional email through your Brevo account.</p>',
  });
  return sendEmail({
    to,
    subject: 'Pose and Pics · Brevo setup test',
    text: 'Brevo is connected successfully to the Pose and Pics Photography Studio backend.',
    html,
    tags: ['brevo-test'],
  });
}

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendAppointmentConfirmation,
  sendBrevoTestEmail,
  checkBrevoAccount,
  configured,
  configurationStatus,
  buildAppointmentQrUrl,
};
