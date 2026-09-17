import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { appointmentsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { studioToday } from "../../utils/date";

export default function AdminQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState(studioToday());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const appts = await appointmentsApi.getAll({ date });
    const filtered = appts
      .filter(a => !["cancelled", "no_show"].includes(a.status))
      .sort((a, b) => (a.queue_number || 999) - (b.queue_number || 999) || a.time.localeCompare(b.time));
    setAppointments(filtered);
  };

  useEffect(() => { load(); }, [date]);

  const nowServing = appointments.find(a => a.status === "now_serving");
  const waiting = appointments.filter(a => a.status === "waiting");
  const confirmed = appointments.filter(a => ["confirmed", "rescheduled"].includes(a.status));
  const completed = appointments.filter(a => a.status === "completed");

  const act = async (action, appt) => {
    if (!user) return;
    setLoading(true);
    try {
      switch (action) {
        case "add_to_queue":
          if (!["confirmed", "rescheduled"].includes(appt.status)) { toast("Only confirmed or rescheduled appointments can join the queue.", "error"); return; }
          await appointmentsApi.update(appt.id, { status: "waiting" });
          toast(`${appt.tracking_number} added to queue`, "success");
          break;

        case "call_next":
          if (nowServing) {
            toast("Complete or skip current client first.", "error");
            return;
          }
          const next = waiting[0];
          if (!next) { toast("No clients in queue.", "info"); return; }
          await appointmentsApi.update(next.id, { status: "now_serving" });
          toast(`Calling ${next.tracking_number}`, "success");
          break;

        case "complete":
          if (appt.status !== "now_serving") { toast("Only the client currently being served can be completed.", "error"); return; }
          await appointmentsApi.update(appt.id, { status: "completed" });
          toast(`${appt.tracking_number} completed`, "success");
          break;

        case "no_show":
          await appointmentsApi.update(appt.id, { status: "no_show" });
          toast(`${appt.tracking_number} marked as no-show`, "warning");
          break;

        case "cancel":
          await appointmentsApi.update(appt.id, { status: "cancelled", queue_number: null });
          toast(`${appt.tracking_number} cancelled`, "info");
          break;
      }
      await load();
    } catch (err) {
      toast(err.message || "Queue action failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const ApptCard = ({ appt, isPrimary }) => {
    const pkg = appt.package;
    const client = appt.client;
    return (
      <div className={`rounded-xl border p-4 card-shadow ${isPrimary ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"}`}>
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {appt.queue_number && (
                <span className="bg-gray-100 text-gray-700 font-mono text-xs px-2 py-0.5 rounded-md">#{appt.queue_number}</span>
              )}
              <span className="tracking-number text-sm font-bold text-gray-900">{appt.tracking_number}</span>
            </div>
            <p className="text-gray-600 text-xs">{client?.name} · {pkg?.name}</p>
            <p className="text-gray-400 text-xs">{appt.time} · {appt.num_people} {appt.num_people === 1 ? "person" : "people"}</p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {["confirmed", "rescheduled"].includes(appt.status) && (
            <button onClick={() => act("add_to_queue", appt)} disabled={loading}
              className="text-xs bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
              Add to Queue
            </button>
          )}
          {appt.status === "waiting" && (
            <>
              <button onClick={() => act("call_next", appt)} disabled={loading || !!nowServing}
                className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                Call Next
              </button>
              <button onClick={() => act("no_show", appt)} disabled={loading}
                className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 px-3 py-1.5 rounded-lg transition-colors">
                No Show
              </button>
            </>
          )}
          {appt.status === "now_serving" && (
            <button onClick={() => act("complete", appt)} disabled={loading}
              className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
              Mark Complete
            </button>
          )}
          {!["completed", "cancelled", "no_show"].includes(appt.status) && (
            <button onClick={() => act("cancel", appt)} disabled={loading}
              className="text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Queue Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage today's appointment queue in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-xl text-sm outline-none" />
          <button onClick={load} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {waiting.length > 0 && !nowServing && (
        <button onClick={() => act("call_next", waiting[0])} disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base mb-8 transition-colors">
          📢 Call Next Client ({waiting[0].tracking_number})
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-gray-900 font-semibold text-sm">Now Serving</h2>
            <span className="text-gray-400 text-xs">({completed.length} done today)</span>
          </div>
          {nowServing ? (
            <ApptCard appt={nowServing} isPrimary />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm card-shadow">
              No active client
            </div>
          )}

          {completed.length > 0 && (
            <div className="mt-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Completed Today</h3>
              <div className="flex flex-col gap-2">
                {completed.map(a => (
                  <div key={a.id} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 flex justify-between items-center opacity-70">
                    <span className="tracking-number text-xs text-gray-500">{a.tracking_number}</span>
                    <span className="text-emerald-600 text-xs">✓ Done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <h2 className="text-gray-900 font-semibold text-sm">In Queue</h2>
            <span className="text-gray-400 text-xs">({waiting.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {waiting.map(a => <ApptCard key={a.id} appt={a} />)}
            {waiting.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm card-shadow">
                Queue is empty
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <h2 className="text-gray-900 font-semibold text-sm">Confirmed / Upcoming</h2>
            <span className="text-gray-400 text-xs">({confirmed.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {confirmed.map(a => <ApptCard key={a.id} appt={a} />)}
            {confirmed.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm card-shadow">
                No upcoming appointments
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
