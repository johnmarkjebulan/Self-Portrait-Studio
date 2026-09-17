import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { appointmentsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { studioToday } from "../../utils/date";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const appts = await appointmentsApi.getAll();
        setAppointments(appts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [user]);

  const today = studioToday();

  // Next active session (soonest upcoming)
  const upcomingActive = appointments
    .filter(a => ["pending", "confirmed", "reschedule_requested", "rescheduled"].includes(a.status) && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSession = upcomingActive[0] ?? null;

  // Queue info for today
  const todayActive = appointments.find(a =>
    a.date === today && ["checked_in", "waiting", "now_serving"].includes(a.status)
  );

  const getQueueInfo = (appt) => {
    if (!appt.queue_number) return null;
    const isNowServing = appt.status === "now_serving";
    return {
      queueNumber: appt.queue_number,
      nowServingNum: null,
      isNowServing,
      ahead: isNowServing ? 0 : appt.queue_number,
      estimated: appt.queue_number * 45,
    };
  };

  const queueInfo = todayActive ? getQueueInfo(todayActive) : null;

  // Stats
  const upcomingCount = upcomingActive.length;
  const pendingPaymentsCount = appointments.filter(a =>
    ["payment_required", "payment_submitted", "under_verification"].includes(a.payment_status)
  ).length;
  const completedCount = appointments.filter(a => a.status === "completed").length;
  const hasAnyBookings = appointments.length > 0;

  // Recent bookings
  const recent = appointments.slice(0, 4);

  const needsPayment = appointments.find(a => a.payment_status === "payment_required" && !["cancelled", "no_show"].includes(a.status));

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Welcome back, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here is everything happening with your bookings.</p>
      </div>

      {/* Payment nudge — highest priority */}
      {needsPayment && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-lg">💳</span>
            <div>
              <p className="text-amber-800 text-sm font-semibold">Payment required</p>
              <p className="text-amber-600 text-xs mt-0.5">Your booking <span className="tracking-number font-semibold">{needsPayment.tracking_number}</span> is awaiting your down payment.</p>
            </div>
          </div>
          <Link to="/client/payments"
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors">
            Pay now
          </Link>
        </div>
      )}

      {/* Next session card */}
      {nextSession && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 card-shadow">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-4">Your Next Session</p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-semibold text-lg leading-tight mb-1">{nextSession.package?.name || "Photography Session"}</p>
              <p className="text-gray-500 text-sm">
                {new Date(nextSession.date + "T12:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                {" · "}{nextSession.time}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <StatusBadge status={nextSession.status} />
                <StatusBadge status={nextSession.payment_status} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-gray-400 text-xs mb-0.5">Total</p>
              <p className="font-mono text-xl font-bold text-gray-900">₱{nextSession.total_price.toLocaleString()}</p>
              {nextSession.remaining_balance > 0 && (
                <p className="text-gray-400 text-xs mt-0.5 font-mono">Balance: ₱{nextSession.remaining_balance.toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex gap-3">
            <Link to="/client/bookings"
              className="flex-1 sm:flex-none text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
              View Booking
            </Link>
            {nextSession.payment_status === "payment_required" && (
              <Link to="/client/payments"
                className="flex-1 sm:flex-none text-center border border-gray-200 hover:border-gray-400 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
                Upload Payment
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Queue status — only when in queue today */}
      {queueInfo && todayActive && (
        <div className={`rounded-2xl border p-5 mb-6 ${queueInfo.isNowServing ? "bg-emerald-50 border-emerald-200" : "bg-purple-50 border-purple-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            {queueInfo.isNowServing ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-emerald-700 text-sm font-bold uppercase tracking-wider">{"It's your turn!"}</p>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <p className="text-purple-700 text-sm font-bold uppercase tracking-wider">{"You're in the queue"}</p>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Queue Number", value: `#${queueInfo.queueNumber}`, colored: true },
              { label: "Now Serving", value: queueInfo.nowServingNum ? `#${queueInfo.nowServingNum}` : "—", colored: false },
              { label: "Ahead of You", value: String(queueInfo.ahead), colored: false },
              { label: "Est. Wait", value: queueInfo.ahead === 0 ? "Soon!" : `~${queueInfo.estimated}m`, colored: false },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-bold font-mono ${item.colored ? (queueInfo.isNowServing ? "text-emerald-700" : "text-purple-700") : "text-gray-900"}`}>
                  {item.value}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <Link to="/client/bookings" className="bg-white rounded-xl border border-gray-200 p-5 card-shadow hover:border-gray-300 transition-colors group">
          <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-700">{upcomingCount}</p>
          <p className="text-gray-500 text-xs mt-1">Upcoming</p>
          <p className="text-gray-400 text-xs">Booking{upcomingCount !== 1 ? "s" : ""}</p>
        </Link>
        <Link to="/client/payments" className={`bg-white rounded-xl border p-5 card-shadow transition-colors ${pendingPaymentsCount > 0 ? "border-amber-200 hover:border-amber-300" : "border-gray-200 hover:border-gray-300"}`}>
          <p className={`text-2xl font-bold ${pendingPaymentsCount > 0 ? "text-amber-600" : "text-gray-900"}`}>{pendingPaymentsCount}</p>
          <p className="text-gray-500 text-xs mt-1">Pending</p>
          <p className="text-gray-400 text-xs">Payment{pendingPaymentsCount !== 1 ? "s" : ""}</p>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-shadow">
          <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          <p className="text-gray-500 text-xs mt-1">Completed</p>
          <p className="text-gray-400 text-xs">Session{completedCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* No bookings yet */}
      {!hasAnyBookings ? (
        <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-2">No bookings yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Book your first photography session and we will create a beautiful experience for you.</p>
          <Link to="/client/book"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Book a Session
          </Link>
        </div>
      ) : (
        /* Recent bookings */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-semibold text-sm">Recent Bookings</h2>
            <Link to="/client/bookings" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">View all →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recent.map(appt => (
              <Link key={appt.id} to="/client/bookings"
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 card-shadow hover:border-gray-300 transition-colors group">
                <div className="min-w-0">
                  <p className="text-gray-900 font-semibold text-sm">{appt.package?.name || "Photography Session"}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(appt.date + "T12:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · {appt.time}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={appt.status} />
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
