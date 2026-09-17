import { useState, useEffect } from "react";
import { appointmentsApi, availabilityApi } from "../../services/api.js";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useToast } from "../../contexts/ToastContext";

const ALL_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "checked_in",
  "waiting",
  "now_serving",
  "completed",
  "cancelled",
  "no_show",
  "cancellation_requested",
  "reschedule_requested",
  "rescheduled",
  "rejected",
];

function statusBorderColor(status) {
  const map = {
    pending: "border-amber-400",
    confirmed: "border-blue-400",
    checked_in: "border-cyan-400",
    waiting: "border-purple-400",
    now_serving: "border-green-500",
    completed: "border-emerald-400",
    cancelled: "border-red-400",
    no_show: "border-gray-400",
    cancellation_requested: "border-orange-400",
    reschedule_requested: "border-yellow-400",
    rescheduled: "border-sky-400",
    rejected: "border-red-600",
  };
  return map[status] || "border-gray-300";
}

export default function Appointments() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await appointmentsApi.getAll();
      setAppointments(data);
    } catch (err) {
      showToast("Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!showRescheduleInput || !rescheduleData.date) {
      setRescheduleSlots([]);
      return;
    }
    let active = true;
    setRescheduleLoading(true);
    availabilityApi.getDate(rescheduleData.date, selected?.id)
      .then((data) => {
        if (!active) return;
        setRescheduleSlots((data.slots || []).filter((slot) => slot.available));
        setRescheduleData((current) => ({
          ...current,
          time: (data.slots || []).some((slot) => slot.available && slot.time === current.time) ? current.time : "",
        }));
      })
      .catch(() => { if (active) setRescheduleSlots([]); })
      .finally(() => { if (active) setRescheduleLoading(false); });
    return () => { active = false; };
  }, [showRescheduleInput, rescheduleData.date, selected?.id]);

  const filtered = appointments.filter((a) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (a.tracking_number || "").toLowerCase().includes(q) ||
      (a.client?.name || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  async function doAction(id, status, extra = {}) {
    setActionLoading(true);
    try {
      await appointmentsApi.update(id, { status, ...extra });
      showToast("Appointment updated", "success");
      setSelected(null);
      setShowRescheduleInput(false);
      setRescheduleData({ date: "", time: "" });
      await load();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveReschedule(appt) {
    if (!rescheduleData.date || !rescheduleData.time) {
      showToast("Please enter a new date and time", "error");
      return;
    }
    await doAction(appt.id, "rescheduled", {
      date: rescheduleData.date,
      time: rescheduleData.time,
    });
  }

  function renderActions(appt) {
    if (!appt) return null;
    const s = appt.status;
    return (
      <div className="flex flex-col gap-2 mt-4">
        {s === "pending" && (
          <>
            <button
              onClick={() => doAction(appt.id, "confirmed")}
              disabled={actionLoading}
              className="w-full py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => doAction(appt.id, "rejected")}
              disabled={actionLoading}
              className="w-full py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {["confirmed", "rescheduled"].includes(s) && (
          <button
            onClick={() => doAction(appt.id, "waiting")}
            disabled={actionLoading}
            className="w-full py-2 rounded bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-50"
          >
            Check In
          </button>
        )}
        {s === "cancellation_requested" && (
          <>
            <button
              onClick={() => doAction(appt.id, "cancelled")}
              disabled={actionLoading}
              className="w-full py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Approve Cancellation
            </button>
          </>
        )}
        {s === "reschedule_requested" && (
          <>
            {!showRescheduleInput ? (
              <button
                onClick={() => setShowRescheduleInput(true)}
                className="w-full py-2 rounded bg-sky-600 text-white font-medium hover:bg-sky-700"
              >
                Approve Reschedule
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) =>
                    setRescheduleData((d) => ({ ...d, date: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm"
                />
                <select
                  value={rescheduleData.time}
                  disabled={!rescheduleData.date || rescheduleLoading}
                  onChange={(e) => setRescheduleData((d) => ({ ...d, time: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100"
                >
                  <option value="">{rescheduleLoading ? "Loading times…" : "Select available time"}</option>
                  {rescheduleSlots.map((slot) => (
                    <option key={slot.time} value={slot.time}>{slot.time} ({slot.remaining} left)</option>
                  ))}
                </select>
                <button
                  onClick={() => handleApproveReschedule(appt)}
                  disabled={actionLoading}
                  className="w-full py-2 rounded bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50"
                >
                  Confirm New Schedule
                </button>
                <button
                  onClick={() => setShowRescheduleInput(false)}
                  className="w-full py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={() => doAction(appt.id, "confirmed")}
              disabled={actionLoading}
              className="w-full py-2 rounded bg-gray-600 text-white font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              Deny Reschedule
            </button>
          </>
        )}
        {(s === "checked_in" || s === "waiting") && (
          <button
            onClick={() => doAction(appt.id, "no_show")}
            disabled={actionLoading}
            className="w-full py-2 rounded bg-gray-600 text-white font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            Mark No Show
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by tracking number or client name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Table */}
        <div className="flex-1 min-w-0 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No appointments found
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
                  <th className="px-3 py-3 font-semibold">Tracking #</th>
                  <th className="px-3 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Package</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Time</th>
                  <th className="px-3 py-3 font-semibold">People</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    onClick={() => {
                      setSelected(appt);
                      setShowRescheduleInput(false);
                      setRescheduleData({ date: "", time: "" });
                    }}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer border-l-4 ${statusBorderColor(appt.status)} ${
                      selected?.id === appt.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-gray-700">
                      {appt.tracking_number}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800">
                        {appt.client?.name || "—"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {appt.client?.email || ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {appt.package?.name || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {appt.date || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {appt.time || "—"}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">
                      {appt.num_people ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={appt.payment_status} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(appt);
                          setShowRescheduleInput(false);
                          setRescheduleData({ date: "", time: "" });
                        }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-full xl:w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 self-start xl:sticky xl:top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Appointment Detail</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="font-mono text-lg font-bold text-gray-900 mb-4">
              {selected.tracking_number}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                  Client
                </div>
                <div className="font-medium">{selected.client?.name || "—"}</div>
                <div className="text-gray-500">{selected.client?.email || "—"}</div>
                <div className="text-gray-500">{selected.client?.mobile || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                  Package
                </div>
                <div>{selected.package?.name || "—"}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    Date
                  </div>
                  <div>{selected.date || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    Time
                  </div>
                  <div>{selected.time || "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                  People
                </div>
                <div>{selected.num_people ?? "—"}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    Total
                  </div>
                  <div>₱{(selected.total_price || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    Paid
                  </div>
                  <div>₱{(selected.amount_paid || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">
                    Balance
                  </div>
                  <div>
                    ₱
                    {(
                      (selected.total_price || 0) - (selected.amount_paid || 0)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.payment_status} />
              </div>
            </div>

            {renderActions(selected)}
          </div>
        )}
      </div>
    </div>
  );
}
