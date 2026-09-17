import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { activityLogsApi } from "../../services/api";

const ACTION_COLOR = {
  ADMIN_LOGIN: "text-blue-600",
  CLIENT_LOGIN: "text-blue-500",
  CLIENT_REGISTER: "text-emerald-600",
  CREATE_BOOKING: "text-amber-600",
  APPOINTMENT_CREATE: "text-amber-600",
  APPOINTMENT_UPDATE: "text-blue-600",
  CONFIRM_BOOKING: "text-emerald-600",
  REJECT_BOOKING: "text-red-500",
  CANCEL_APPT: "text-red-500",
  COMPLETE_APPT: "text-emerald-600",
  VERIFY_PAYMENT: "text-emerald-600",
  REJECT_PAYMENT: "text-red-500",
  PAYMENT_UPLOAD: "text-amber-600",
  CALL_NEXT: "text-purple-500",
  ADD_TO_QUEUE: "text-purple-500",
  NO_SHOW: "text-red-500",
  SUBMIT_FEEDBACK: "text-pink-500",
  SETTINGS_UPDATE: "text-cyan-600",
  PACKAGE_CREATE: "text-indigo-600",
  PACKAGE_UPDATE: "text-indigo-500",
  PACKAGE_DELETE: "text-red-500",
  ADDON_CREATE: "text-violet-600",
  ADDON_UPDATE: "text-violet-500",
  ADDON_DELETE: "text-red-500",
  SCHEDULE_OVERRIDE_CREATE: "text-teal-600",
  SCHEDULE_OVERRIDE_UPDATE: "text-teal-500",
  SCHEDULE_OVERRIDE_DELETE: "text-red-500",
  PAYMENT_REVIEW: "text-amber-600",
};

const ENTITY_TYPES = [
  "all",
  "auth",
  "appointment",
  "payment",
  "queue",
  "feedback",
  "settings",
  "package",
  "addon",
  "schedule",
  "user",
];

export default function ActivityLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await activityLogsApi.getAll();
        setLogs(data || []);
      } catch (err) {
        showToast("Could not load activity logs", "error");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesEntity =
      entityFilter === "all" ||
      (log.entity_type || "").toLowerCase() === entityFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (log.action || "").toLowerCase().includes(q) ||
      (log.description || "").toLowerCase().includes(q) ||
      (log.user_name || "").toLowerCase().includes(q) ||
      (log.ip_address || "").toLowerCase().includes(q);
    return matchesEntity && matchesSearch;
  });

  return (
    <div className="animate-fade-in max-w-screen-xl mx-auto">
      <div className="mb-6"><h1 className="font-display text-2xl font-semibold text-gray-900">Activity Logs</h1><p className="text-gray-500 text-sm mt-1">Audit trail for important actions across the studio.</p></div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by action, description, user, or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Entity Type Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ENTITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setEntityFilter(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              entityFilter === type
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {type === "all" ? "All" : type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          Loading activity logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {logs.length === 0
            ? "No activity logs available"
            : "No logs match your filter"}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full min-w-[760px] text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr
                  key={log.id || idx}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        ACTION_COLOR[log.action] || "text-gray-700"
                      }`}
                    >
                      {log.action || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {log.user_name || log.user_email || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {log.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {log.entity_type && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                        {log.entity_type}
                        {log.entity_id ? ` #${log.entity_id}` : ""}
                      </span>
                    )}
                    {!log.entity_type && "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {log.ip_address || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
