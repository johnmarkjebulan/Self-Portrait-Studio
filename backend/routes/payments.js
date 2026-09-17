const router = require('express').Router();
const { Op } = require('sequelize');
const { Payment, Appointment, Package, User, Notification } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { notifyAdmins } = require('../utils/notifyAdmins');
const { dateKeyInTimeZone, isValidDateKey } = require('../utils/dateTime');
const { logActivity } = require('../utils/activityLog');

const SUBMISSION_STATUSES = ['payment_submitted', 'under_verification'];
const FINAL_STATUSES = ['verified', 'rejected'];

const include = [
  {
    model: Appointment,
    as: 'appointment',
    attributes: ['id', 'tracking_number', 'date', 'time', 'total_price', 'down_payment', 'amount_paid', 'remaining_balance', 'status'],
    include: [{ model: Package, as: 'package', attributes: ['id', 'name'] }],
  },
  { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
];

async function notifyClient(userId, title, message, paymentId) {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type: 'payment',
      read: false,
      related_id: paymentId,
      related_type: 'payment',
    });
  } catch (err) {
    console.error('Payment notification failed:', err.message);
  }
}

async function recalculateAppointmentPayment(appt) {
  const verifiedTotal = Number(await Payment.sum('amount', {
    where: { appointment_id: appt.id, status: 'verified' },
  })) || 0;
  const balance = Math.max(0, Number(appt.total_price) - verifiedTotal);
  const pending = await Payment.count({ where: { appointment_id: appt.id, status: { [Op.in]: SUBMISSION_STATUSES } } });
  const paymentStatus = balance === 0
    ? 'fully_paid'
    : verifiedTotal > 0
      ? 'partially_paid'
      : pending > 0
        ? 'payment_submitted'
        : 'payment_required';
  await appt.update({ amount_paid: verifiedTotal, remaining_balance: balance, payment_status: paymentStatus });
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { client_id: req.user.id };
    if (req.query.appointment_id) where.appointment_id = req.query.appointment_id;
    const payments = await Payment.findAll({ where, include, order: [['created_at', 'DESC']] });
    res.json({ payments });
  } catch (err) { next(err); }
});

// Client submits a new proof. Admins should verify/reject via PATCH, not impersonate a client submission.
router.post('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ error: 'Client account required to submit a payment' });
    const { appointment_id, amount, reference_number, payment_date, proof_url, proof_filename, proof_data, notes } = req.body;
    const appt = await Appointment.findByPk(appointment_id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (['cancelled', 'rejected', 'no_show'].includes(appt.status)) return res.status(409).json({ error: 'Payments are disabled for this appointment' });

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    if (numericAmount > Number(appt.remaining_balance) + 0.001) return res.status(400).json({ error: 'Payment amount exceeds the remaining balance' });

    const cleanReference = String(reference_number || '').trim().slice(0, 100);
    if (!cleanReference) return res.status(400).json({ error: 'Reference number is required' });
    const duplicateReference = await Payment.findOne({ where: { reference_number: cleanReference } });
    if (duplicateReference) return res.status(409).json({ error: 'This payment reference number was already submitted' });

    const pending = await Payment.findOne({ where: { appointment_id: appt.id, status: { [Op.in]: SUBMISSION_STATUSES } } });
    if (pending) return res.status(409).json({ error: 'This appointment already has a payment awaiting verification' });

    const cleanDate = payment_date || dateKeyInTimeZone();
    if (!isValidDateKey(cleanDate) || cleanDate > dateKeyInTimeZone()) return res.status(400).json({ error: 'Invalid payment date' });

    if (!proof_data && !proof_url) return res.status(400).json({ error: 'Payment proof is required' });
    if (proof_data) {
      const proof = String(proof_data);
      if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(proof)) return res.status(400).json({ error: 'Payment proof must be a JPG, PNG, or WebP image' });
      if (proof.length > 7_500_000) return res.status(413).json({ error: 'Payment proof is too large. Maximum file size is 5MB.' });
    }

    const previousPaid = Number(appt.amount_paid || 0);
    const type = numericAmount >= Number(appt.remaining_balance)
      ? 'full'
      : previousPaid <= 0 && numericAmount <= Number(appt.down_payment || numericAmount)
        ? 'down_payment'
        : 'partial';

    const payment = await Payment.create({
      appointment_id: appt.id,
      client_id: appt.client_id,
      amount: numericAmount,
      type,
      reference_number: cleanReference,
      payment_date: cleanDate,
      proof_url: proof_url || null,
      proof_filename: String(proof_filename || '').trim().slice(0, 255) || null,
      proof_data: proof_data || null,
      status: 'payment_submitted',
      notes: String(notes || '').trim().slice(0, 2000) || null,
    });

    await recalculateAppointmentPayment(appt);
    await notifyClient(appt.client_id, 'Payment Submitted', `Your payment of ₱${numericAmount.toLocaleString('en-PH')} for ${appt.tracking_number} is awaiting verification.`, payment.id);
    await notifyAdmins('New Payment Submitted', `${req.user.name || 'A client'} submitted ₱${numericAmount.toLocaleString('en-PH')} for ${appt.tracking_number}.`, 'payment', payment.id, 'payment');
    await logActivity(req, 'PAYMENT_UPLOAD', `Submitted ₱${numericAmount.toLocaleString('en-PH')} for ${appt.tracking_number}`, 'payment', payment.id);

    const result = await Payment.findByPk(payment.id, { include });
    res.status(201).json({ payment: result });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const status = req.body.status;
    const notes = String(req.body.notes || '').trim().slice(0, 2000) || null;
    if (!['under_verification', 'verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid payment status' });
    if (payment.status === 'verified') return res.status(409).json({ error: 'Verified payments are final and cannot be changed' });
    if (payment.status === 'rejected') return res.status(409).json({ error: 'Rejected payments are final; ask the client to submit a new proof' });

    const appt = await Appointment.findByPk(payment.appointment_id);
    if (!appt) return res.status(409).json({ error: 'The related appointment no longer exists' });

    if (status === 'verified') {
      const otherVerified = Number(await Payment.sum('amount', {
        where: { appointment_id: appt.id, status: 'verified', id: { [Op.ne]: payment.id } },
      })) || 0;
      if (otherVerified + Number(payment.amount) > Number(appt.total_price) + 0.001) {
        return res.status(409).json({ error: 'Verifying this payment would exceed the appointment total' });
      }
    }

    await payment.update({
      status,
      notes,
      verified_by: FINAL_STATUSES.includes(status) ? req.user.id : null,
      verified_at: FINAL_STATUSES.includes(status) ? new Date() : null,
    });
    await recalculateAppointmentPayment(appt);

    const messages = {
      under_verification: ['Payment Under Review', `Your payment of ₱${Number(payment.amount).toLocaleString('en-PH')} is being reviewed.`],
      verified: ['Payment Verified', `Your payment of ₱${Number(payment.amount).toLocaleString('en-PH')} has been verified.`],
      rejected: ['Payment Rejected', `Your payment was rejected.${notes ? ` ${notes}` : ''}`],
    };
    await notifyClient(payment.client_id, ...messages[status], payment.id);
    await logActivity(
      req,
      status === 'verified' ? 'VERIFY_PAYMENT' : status === 'rejected' ? 'REJECT_PAYMENT' : 'PAYMENT_REVIEW',
      `${status.replace(/_/g, ' ')} ₱${Number(payment.amount).toLocaleString('en-PH')} for ${appt.tracking_number}`,
      'payment',
      payment.id,
    );

    const result = await Payment.findByPk(payment.id, { include });
    res.json({ payment: result });
  } catch (err) { next(err); }
});

module.exports = router;
