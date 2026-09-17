import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { availabilityApi, schedulesApi } from "../../services/api";
import { studioToday } from "../../utils/date";

function slotStatus(slot) {
  if (slot.blocked) return { label: "Blocked", color: "text-red-600 bg-red-50 border-red-200" };
  if (slot.remaining <= 0) return { label: "Full", color: "text-red-600 bg-red-50 border-red-200" };
  if (slot.remaining <= Math.max(1, Math.floor(slot.capacity / 2))) {
    return { label: "Limited", color: "text-amber-700 bg-amber-50 border-amber-200" };
  }
  return { label: "Available", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
}

export default function AdminSchedules() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(studioToday());
  const [availability, setAvailability] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTime, setNewTime] = useState("09:00");
  const [newCapacity, setNewCapacity] = useState(3);
  const [newBlocked, setNewBlocked] = useState(false);

  const overrideByTime = useMemo(
    () => new Map(overrides.map((item) => [item.time, item])),
    [overrides]
  );

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [availabilityData, overrideData] = await Promise.all([
        availabilityApi.getDate(selectedDate),
        schedulesApi.getAll(selectedDate),
      ]);
      setAvailability(availabilityData);
      setOverrides(overrideData || []);
    } catch (err) {
      toast(err.message || "Failed to load studio availability.", "error");
      setAvailability(null);
      setOverrides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const resetForm = () => {
    setEditingId(null);
    setNewTime("09:00");
    setNewCapacity(3);
    setNewBlocked(false);
    setShowForm(false);
  };

  const openNewOverride = () => {
    if (showForm && !editingId) {
      resetForm();
      return;
    }
    setEditingId(null);
    setNewTime("09:00");
    setNewCapacity(availability?.slot_capacity || 3);
    setNewBlocked(false);
    setShowForm(true);
  };

  const saveOverride = async () => {
    const capacity = Number(newCapacity);
    if (!newTime || !Number.isInteger(capacity) || capacity < 1) {
      toast("Enter a valid time and capacity.", "error");
      return;
    }
    try {
      if (editingId) {
        await schedulesApi.update(editingId, { max_capacity: capacity, blocked: newBlocked });
        toast("Schedule override updated.", "success");
      } else {
        const existing = overrideByTime.get(newTime);
        if (existing) {
          await schedulesApi.update(existing.id, { max_capacity: capacity, blocked: newBlocked });
          toast("Existing override updated.", "success");
        } else {
          await schedulesApi.create({
            date: selectedDate,
            time: newTime,
            max_capacity: capacity,
            blocked: newBlocked,
          });
          toast("Schedule override created.", "success");
        }
      }
      resetForm();
      await loadSchedules();
    } catch (err) {
      toast(err.message || "Failed to save schedule override.", "error");
    }
  };

  const toggleBlock = async (slot) => {
    try {
      const existing = overrideByTime.get(slot.time);
      if (existing) {
        await schedulesApi.update(existing.id, { blocked: !slot.blocked });
      } else {
        await schedulesApi.create({
          date: selectedDate,
          time: slot.time,
          max_capacity: slot.capacity,
          blocked: true,
        });
      }
      toast(slot.blocked ? "Slot unblocked." : "Slot blocked.", "success");
      await loadSchedules();
    } catch (err) {
      toast(err.message || "Failed to update slot.", "error");
    }
  };

  const editOverride = (slot) => {
    const existing = overrideByTime.get(slot.time);
    if (!existing) {
      setEditingId(null);
    } else {
      setEditingId(existing.id);
    }
    setNewTime(slot.time);
    setNewCapacity(slot.capacity);
    setNewBlocked(Boolean(slot.blocked));
    setShowForm(true);
  };

  const resetOverride = async (slot) => {
    const existing = overrideByTime.get(slot.time);
    if (!existing) return;
    if (!window.confirm(`Reset ${slot.time} to the default Settings rules?`)) return;
    try {
      await schedulesApi.delete(existing.id);
      toast("Schedule override removed. Default rules restored.", "success");
      await loadSchedules();
    } catch (err) {
      toast(err.message || "Failed to reset schedule override.", "error");
    }
  };

  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const slots = availability?.slots || [];

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-semibold text-gray-900">Schedule Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Default slots come from Settings. Use overrides only for special dates, blocks, or capacity changes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); resetForm(); }}
          className="w-full sm:w-auto bg-white border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-2.5 rounded-xl text-sm outline-none"
        />
        <button
          onClick={openNewOverride}
          className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {showForm && !editingId ? "Close Override Form" : "+ Add Special Override"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-4 sm:p-5 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">{editingId ? "Edit override" : "Special override"} — {selectedDate}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-gray-500 text-xs block mb-1">Time</label>
              <input
                type="time"
                value={newTime}
                disabled={Boolean(editingId)}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 text-gray-900 px-4 py-2.5 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Max Capacity</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value) || 1)}
                min={1}
                max={100}
                className="w-full bg-white border border-gray-200 focus:border-gray-400 text-gray-900 px-3 py-2.5 rounded-lg text-sm outline-none"
              />
            </div>
            <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700">
              <input type="checkbox" checked={newBlocked} onChange={(e) => setNewBlocked(e.target.checked)} />
              Block this time
            </label>
            <button
              onClick={saveOverride}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {editingId ? "Update Override" : "Save Override"}
            </button>
          </div>
        </div>
      )}

      {availability && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">Daily Capacity</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{availability.daily_capacity}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">Active Bookings</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{availability.daily_booked}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">Remaining Today</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{availability.daily_remaining}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 card-shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-gray-900 font-semibold text-sm">{formattedDate}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {availability?.closed ? "Studio closed unless a special opening override exists." : `${slots.length} generated slot${slots.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading studio availability...</div>
        ) : slots.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No available schedule is generated for this date. You can create a special opening override above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Time', 'Capacity', 'Booked', 'Remaining', 'Source', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const status = slotStatus(slot);
                  return (
                    <tr key={slot.time} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-4 font-mono text-gray-900 font-semibold">{slot.time}</td>
                      <td className="px-4 py-4 text-gray-600">{slot.capacity}</td>
                      <td className="px-4 py-4 text-gray-600">{slot.booked}</td>
                      <td className="px-4 py-4 text-gray-600">{slot.remaining}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-gray-600 capitalize">{slot.source}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex border rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => toggleBlock(slot)} className="text-xs border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded-lg">
                            {slot.blocked ? "Unblock" : "Block"}
                          </button>
                          <button onClick={() => editOverride(slot)} className="text-xs border border-gray-200 hover:border-gray-400 px-2.5 py-1.5 rounded-lg">
                            Edit
                          </button>
                          {slot.source === 'override' && (
                            <button onClick={() => resetOverride(slot)} className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg">
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { l: "Default", d: "Generated automatically from Settings." },
          { l: "Override", d: "Special date/time rule created here." },
          { l: "Reset", d: "Removes the override and restores Settings defaults." },
        ].map((item) => (
          <div key={item.l} className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-gray-800 text-xs font-semibold">{item.l}</p>
            <p className="text-gray-500 text-xs mt-1">{item.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
