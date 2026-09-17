import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentsApi, paymentsApi, usersApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { studioToday, studioMonthStart } from "../../utils/date";

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-xl border p-5 card-shadow ${accent ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
      <p className={`text-sm mt-0.5 ${accent ? "text-white/70" : "text-gray-500"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/50" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const today = studioToday();
  const [stats, setStats] = useState({
    todayAppts: 0, upcomingAppts: 0, pendingBookings: 0, totalClients: 0, monthlyRevenue: 0,
    pendingPayments: 0, pendingRequests: 0,
  });
  const [queue, setQueue] = useState([]);
  const [recent, setRecent] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [pendingPaymentsList, setPendingPaymentsList] = useState([]);

  useEffect(() => {
    async function load() {
      const [appts, payments, clients] = await Promise.all([
        appointmentsApi.getAll(),
        paymentsApi.getAll(),
        usersApi.getAll("client"),
      ]);

      const now = new Date();
      const monthStart = studioMonthStart();
      const monthlyRevenue = payments
        .filter(p => p.status === "verified" && p.payment_date >= monthStart)
        .reduce((s, p) => s + p.amount, 0);

      const upcomingAppts = appts.filter(a =>
        a.date > today && ["confirmed", "pending"].includes(a.status)
      ).sort((a, b) => a.date.localeCompare(b.date));

      const pendingPays = appts
        .filter(a => ["payment_required", "payment_submitted", "under_verification"].includes(a.payment_status))
        .map(a => ({ appt: a, amount: a.remaining_balance }))
        .slice(0, 5);

      const todayQueue = appts
        .filter(a => a.date === today && !["cancelled", "no_show"].includes(a.status) && a.queue_number != null)
        .sort((a, b) => (a.queue_number || 999) - (b.queue_number || 999));

      setStats({
        todayAppts: appts.filter(a => a.date === today).length,
        upcomingAppts: upcomingAppts.length,
        pendingBookings: appts.filter(a => a.status === "pending").length,
        totalClients: clients.length,
        monthlyRevenue,
        pendingPayments: payments.filter(p => ["payment_submitted", "under_verification"].includes(p.status)).length,
        pendingRequests: appts.filter(a => ["cancellation_requested", "reschedule_requested"].includes(a.status)).length,
      });

      setQueue(todayQueue);
      setRecent([...appts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6));
      setUpcoming(upcomingAppts.slice(0, 5));
      setPendingPaymentsList(pendingPays);
    }
    load();
  }, []);

  const nowServing = queue.find(a => a.status === "now_serving");
  const waiting = queue.filter(a => a.status === "waiting");
  const confirmedToday = queue.filter(a => a.status === "confirmed");

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of studio operations and today's activity.</p>
      </div>

      {/* 5 Key stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Today's Bookings" value={stats.todayAppts} />
        <StatCard label="Upcoming" value={stats.upcomingAppts} sub="Confirmed" />
        <StatCard label="Pending Review" value={stats.pendingBookings} />
        <StatCard label="Total Clients" value={stats.totalClients} />
        <StatCard label="Monthly Revenue" value={`₱${stats.monthlyRevenue.toLocaleString()}`} accent />
      </div>

      {/* Alert strip for items needing attention */}
      {(stats.pendingBookings > 0 || stats.pendingPayments > 0 || stats.pendingRequests > 0) && (
        <div className="flex flex-wrap gap-3 mb-7">
          {stats.pendingBookings > 0 && (
            <Link to="/admin/appointments?status=pending" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-amber-100 transition-colors">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {stats.pendingBookings} booking{stats.pendingBookings !== 1 ? "s" : ""} awaiting confirmation
            </Link>
          )}
          {stats.pendingPayments > 0 && (
            <Link to="/admin/payments" className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {stats.pendingPayments} payment{stats.pendingPayments !== 1 ? "s" : ""} to verify
            </Link>
          )}
          {stats.pendingRequests > 0 && (
            <Link to="/admin/appointments" className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-orange-100 transition-colors">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {stats.pendingRequests} cancel/reschedule request{stats.pendingRequests !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900 font-semibold text-sm">Today's Queue</h2>
            <Link to="/admin/queue" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">Manage →</Link>
          </div>

          <div className="flex flex-col gap-3">
            {nowServing ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">Now Serving</p>
                </div>
                <p className="tracking-number text-lg font-bold text-gray-900">{nowServing.tracking_number}</p>
                <p className="text-gray-500 text-xs mt-0.5">{nowServing.package?.name} · #{nowServing.queue_number}</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs">No one is being served right now</p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-4 card-shadow">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Waiting / Confirmed</p>
              {[...waiting, ...confirmedToday].length > 0 ? (
                <div className="space-y-2">
                  {[...waiting, ...confirmedToday].slice(0, 5).map((a, i) => (
                    <div key={a.id} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                      <div>
                        <p className="tracking-number text-xs text-gray-700 font-medium">{a.tracking_number}</p>
                        <p className="text-gray-400 text-xs">{a.time} · {a.package?.name}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">No queue activity today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings + Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-gray-900 font-semibold text-sm">Recent Bookings</h2>
              <Link to="/admin/appointments" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">View all →</Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden card-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Tracking #", "Client", "Date", "Status"].map(h => (
                        <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3 font-medium first:pl-5 last:pr-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(appt => (
                      <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 pl-5 tracking-number text-gray-900 text-xs font-semibold">{appt.tracking_number}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{appt.client?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{appt.date}</td>
                        <td className="px-4 py-3 pr-5"><StatusBadge status={appt.status} /></td>
                      </tr>
                    ))}
                    {recent.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No bookings yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Upcoming Shoots */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-900 font-semibold text-sm">Upcoming Shoots</h2>
                <Link to="/admin/appointments" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">View all →</Link>
              </div>
              <div className="space-y-2">
                {upcoming.map(appt => (
                  <div key={appt.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between card-shadow">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-gray-100 rounded-lg px-2.5 py-2 text-center shrink-0">
                        <p className="text-gray-900 font-bold text-sm leading-none">{new Date(appt.date + "T12:00:00").getDate()}</p>
                        <p className="text-gray-400 text-[10px] uppercase mt-0.5">{new Date(appt.date + "T12:00:00").toLocaleDateString("en-PH", { month: "short" })}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 text-sm font-medium truncate">{appt.client?.name || "—"}</p>
                        <p className="text-gray-400 text-xs">{appt.package?.name} · {appt.time}</p>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Payments */}
          {pendingPaymentsList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-900 font-semibold text-sm">Pending Payments</h2>
                <Link to="/admin/payments" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">View all →</Link>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden card-shadow">
                {pendingPaymentsList.map(({ appt }, i) => (
                  <div key={appt.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                    <div>
                      <p className="tracking-number text-xs text-gray-900 font-semibold">{appt.tracking_number}</p>
                      <p className="text-gray-400 text-xs">{appt.client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-mono font-semibold text-sm">₱{appt.remaining_balance.toLocaleString()}</p>
                      <StatusBadge status={appt.payment_status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
