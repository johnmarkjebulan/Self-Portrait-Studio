import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { appointmentsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const UPCOMING_STATUSES = ["pending", "confirmed", "cancellation_requested", "reschedule_requested", "rescheduled", "checked_in", "waiting", "now_serving"];

function BookingCard({ appt }) {
  const formattedDate = new Date(appt.date + "T12:00:00").toLocaleDateString("en-PH", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });

  const isUpcoming = UPCOMING_STATUSES.includes(appt.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 card-shadow overflow-hidden hover:border-gray-300 transition-colors">
      {/* Card top bar */}
      <div className={`h-1 w-full ${
        appt.status === "completed" ? "bg-emerald-400" :
        appt.status === "now_serving" ? "bg-blue-500" :
        appt.status === "waiting" ? "bg-purple-400" :
        appt.status === "confirmed" ? "bg-blue-400" :
        appt.status === "cancelled" ? "bg-gray-300" :
        appt.status === "no_show" ? "bg-red-300" :
        "bg-amber-400"
      }`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-gray-900 font-semibold text-base leading-tight">{appt.package?.name || "Photography Session"}</p>
            <p className="tracking-number text-gray-400 text-xs mt-0.5">{appt.tracking_number}</p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">Date</p>
            <p className="text-gray-900 text-sm font-medium">{formattedDate}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">Time</p>
            <p className="text-gray-900 text-sm font-medium font-mono">{appt.time}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">People</p>
            <p className="text-gray-900 text-sm font-medium">{appt.num_people} {appt.num_people === 1 ? "person" : "people"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">Payment</p>
            <StatusBadge status={appt.payment_status} />
          </div>
        </div>

        {/* Balance row */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
          <div className="flex gap-4 text-xs">
            <span>
              <span className="text-gray-400">Total </span>
              <span className="font-mono font-semibold text-gray-900">₱{appt.total_price.toLocaleString()}</span>
            </span>
            {appt.remaining_balance > 0 && (
              <span>
                <span className="text-gray-400">Balance </span>
                <span className="font-mono font-semibold text-amber-600">₱{appt.remaining_balance.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to="/client/appointments"
            className="flex-1 text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
            View Details
          </Link>
          {isUpcoming && appt.payment_status === "payment_required" && (
            <Link to="/client/payments"
              className="flex-1 text-center border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm py-2.5 rounded-xl transition-colors">
              Pay Now
            </Link>
          )}
          {appt.status === "completed" && (
            <Link to="/client/feedback"
              className="flex-1 text-center border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 font-semibold text-sm py-2.5 rounded-xl transition-colors">
              Leave Review
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  const configs = {
    upcoming: {
      icon: "📅",
      title: "No upcoming bookings",
      desc: "Book a session to see it here. We would love to capture your moment.",
      cta: true,
    },
    completed: {
      icon: "✅",
      title: "No completed sessions yet",
      desc: "Completed photography sessions will appear here.",
    },
    cancelled: {
      icon: "✕",
      title: "No cancelled bookings",
      desc: "You have no cancelled or no-show bookings.",
    },
    all: {
      icon: "📋",
      title: "No bookings yet",
      desc: "Book your first photography session to get started.",
      cta: true,
    },
  };
  const c = configs[tab];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-8 sm:p-14 text-center">
      <p className="text-4xl mb-3">{c.icon}</p>
      <h3 className="text-gray-900 font-semibold mb-1.5">{c.title}</h3>
      <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">{c.desc}</p>
      {c.cta && (
        <Link to="/client/book"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Book a Session
        </Link>
      )}
    </div>
  );
}

export default function ClientBookings() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("upcoming");

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

  const filtered = (() => {
    switch (tab) {
      case "upcoming":
        return [...appointments.filter(a => UPCOMING_STATUSES.includes(a.status))].sort((a, b) => a.date.localeCompare(b.date));
      case "completed":
        return appointments.filter(a => a.status === "completed");
      case "cancelled":
        return appointments.filter(a => ["cancelled", "no_show"].includes(a.status));
      default:
        return appointments;
    }
  })();

  const counts = {
    upcoming: appointments.filter(a => UPCOMING_STATUSES.includes(a.status)).length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => ["cancelled", "no_show"].includes(a.status)).length,
    all: appointments.length,
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all your photography session bookings.</p>
        </div>
        <Link to="/client/book"
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Book a Session
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.value ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
            {counts[t.value] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(appt => (
            <BookingCard key={appt.id} appt={appt} />
          ))}
        </div>
      )}
    </div>
  );
}
