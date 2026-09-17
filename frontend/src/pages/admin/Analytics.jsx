import { useEffect, useState } from "react";
import { analyticsApi } from "../../services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AMBER = "#f59e0b";
const CHART_COLORS = ["#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6"];
const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.5rem",
  color: "#111827",
  fontSize: 12,
};

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 card-shadow p-5">
      <p className="font-display text-2xl font-semibold text-gray-900">
        {value}
      </p>
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    analyticsApi.get(range)
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Failed to load analytics."));
  }, [range]);

  const rangeOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time studio performance metrics.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
          {rangeOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                range === o.value
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
          Loading analytics…
        </div>
      )}

      {data && (
        <>
          {/* Key metrics — 2×5 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10">
            <StatCard label="Total Appointments" value={data.totalAppts ?? 0} />
            <StatCard
              label="Completed"
              value={data.completedAppts ?? 0}
              sub={`${data.completionRate ?? "0.0"}% completion rate`}
            />
            <StatCard
              label="Revenue"
              value={`₱${(data.totalRevenue ?? 0).toLocaleString()}`}
            />
            <StatCard label="New Clients" value={data.newClients ?? 0} />
            <StatCard label="Cancelled" value={data.cancelledAppts ?? 0} />
            <StatCard
              label="No Shows"
              value={data.noShows ?? 0}
              sub={`${data.noShowRate ?? "0.0"}% no-show rate`}
            />
            <StatCard
              label="Avg. Rating"
              value={data.avgRating ?? "—"}
              sub={`${data.totalFeedback ?? 0} reviews`}
            />
            <StatCard
              label="Pending Payments"
              value={data.pendingPayments ?? 0}
            />
            <StatCard
              label="Capacity Utilization"
              value={`${data.capacityUtilization ?? 0}%`}
              sub="Last 14 days"
            />
            <StatCard
              label="Pending Requests"
              value={data.pendingRequests ?? 0}
              sub="Cancel / Reschedule"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Appointments */}
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">
                Daily Appointments (Last 14 Days)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke={AMBER}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Revenue */}
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">
                Daily Revenue (Last 14 Days)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`₱${v.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill={AMBER} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bookings by Package */}
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">
                Bookings by Package
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.packageData || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="bookings"
                    fill={AMBER}
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Appointment Status Pie */}
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">
                Appointment Status Breakdown
              </h3>
              {(data.statusData || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      style={{ fontSize: 10, fill: "#6b7280" }}
                    >
                      {data.statusData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                  No data
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">
                Feedback Rating Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.ratingDist || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="rating"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill="#f59e0b"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Status Pie */}
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">
                Payment Status Distribution
              </h3>
              {(data.paymentData || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {data.paymentData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      iconSize={10}
                      wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                  No data
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
