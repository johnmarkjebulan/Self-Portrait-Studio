const router = require('express').Router();
const { Appointment, Payment, User, Package, Feedback, StudioSettings } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { dateKeyInTimeZone } = require('../utils/dateTime');

router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { range = 'month' } = req.query;
    const now = new Date();

    const rangeStart = new Date(now);
    if (range === 'today') rangeStart.setHours(0, 0, 0, 0);
    else if (range === 'week') rangeStart.setDate(now.getDate() - 7);
    else if (range === 'month') rangeStart.setDate(now.getDate() - 30);
    else rangeStart.setMonth(0, 1); // year: Jan 1

    const allAppts = await Appointment.findAll({ include: [{ model: Package, as: 'package', attributes: ['id', 'name', 'price'] }] });
    const filteredAppts = allAppts.filter(a => new Date(a.created_at) >= rangeStart);

    const allPayments = await Payment.findAll();
    const verifiedPayments = allPayments.filter((p) => p.status === 'verified' && new Date(p.verified_at || p.created_at) >= rangeStart);

    const allClients = await User.findAll({ where: { role: 'client' } });
    const allPackages = await Package.findAll();
    const allFeedback = await Feedback.findAll();
    const studioSettings = await StudioSettings.findByPk(1);

    // Daily breakdown (last 14 days)
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = dateKeyInTimeZone(d);
      dailyMap[key] = { appointments: 0, revenue: 0 };
    }
    for (const a of allAppts) {
      if (dailyMap[a.date]) dailyMap[a.date].appointments++;
    }
    for (const p of allPayments.filter((payment) => payment.status === 'verified')) {
      const revenueDate = dateKeyInTimeZone(new Date(p.verified_at || p.created_at));
      if (dailyMap[revenueDate]) dailyMap[revenueDate].revenue += Number(p.amount);
    }
    const daily = Object.entries(dailyMap).map(([date, v]) => ({
      date: new Date(date + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      ...v,
    }));

    // Package breakdown
    const pkgCount = {};
    const pkgRevenue = {};
    for (const a of allAppts) {
      pkgCount[a.package_id] = (pkgCount[a.package_id] || 0) + 1;
      pkgRevenue[a.package_id] = (pkgRevenue[a.package_id] || 0) + Number(a.total_price);
    }
    const packageData = allPackages.map(p => ({
      name: p.name.replace(' Package', ''),
      bookings: pkgCount[p.id] || 0,
      revenue: pkgRevenue[p.id] || 0,
    }));

    // Status breakdown
    const statusCount = {};
    for (const a of filteredAppts) statusCount[a.status] = (statusCount[a.status] || 0) + 1;
    const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

    // Payment status breakdown
    const paymentStatus = {};
    for (const p of allPayments) paymentStatus[p.status] = (paymentStatus[p.status] || 0) + 1;
    const paymentData = Object.entries(paymentStatus).map(([name, value]) => ({ name, value }));

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map(r => ({
      rating: `${r}★`,
      count: allFeedback.filter(f => f.rating === r).length,
    }));

    const avgRating = allFeedback.length > 0
      ? (allFeedback.reduce((s, f) => s + f.rating, 0) / allFeedback.length).toFixed(1)
      : '—';

    const finalized = filteredAppts.filter(a => ['completed', 'no_show', 'cancelled'].includes(a.status));
    const noShowRate = finalized.length > 0
      ? ((filteredAppts.filter(a => a.status === 'no_show').length / finalized.length) * 100).toFixed(1)
      : '0.0';
    const completionRate = finalized.length > 0
      ? ((filteredAppts.filter(a => a.status === 'completed').length / finalized.length) * 100).toFixed(1)
      : '0.0';

    const limit14 = new Date(); limit14.setDate(limit14.getDate() - 14);
    const bookedInWindow = allAppts.filter(a => {
      const d = new Date(`${a.date}T00:00:00+08:00`);
      return d >= limit14 && d <= now && a.status !== 'cancelled';
    }).length;
    const dailyCapacity = Number(studioSettings?.daily_capacity || 10);
    const capacityUtilization = Math.min(100, Math.round((bookedInWindow / (14 * dailyCapacity)) * 100));

    const pendingRequests = allAppts.filter(a => ['cancellation_requested', 'reschedule_requested'].includes(a.status)).length;

    res.json({
      totalAppts: filteredAppts.length,
      completedAppts: filteredAppts.filter(a => a.status === 'completed').length,
      cancelledAppts: filteredAppts.filter(a => a.status === 'cancelled').length,
      noShows: filteredAppts.filter(a => a.status === 'no_show').length,
      totalRevenue: verifiedPayments.reduce((s, p) => s + Number(p.amount), 0),
      pendingPayments: allPayments.filter(p => ['payment_submitted', 'under_verification'].includes(p.status)).length,
      totalClients: allClients.length,
      newClients: allClients.filter(c => new Date(c.created_at) >= rangeStart).length,
      avgRating,
      totalFeedback: allFeedback.length,
      noShowRate,
      completionRate,
      capacityUtilization,
      pendingRequests,
      daily,
      packageData,
      statusData,
      paymentData,
      ratingDist,
    });
  } catch (err) { next(err); }
});

module.exports = router;
