import { useEffect, useState } from "react";
import { usersApi, appointmentsApi, paymentsApi } from "../../services/api.js";
import { StatusBadge } from "../../components/common/StatusBadge";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, a, p] = await Promise.all([
          usersApi.getAll("client"),
          appointmentsApi.getAll(),
          paymentsApi.getAll(),
        ]);
        setClients([...c].sort((a, b) => b.created_at.localeCompare(a.created_at)));
        setAppointments(a);
        setPayments(p);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = clients.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile || "").includes(search)
  );

  const getClientStats = (clientId) => {
    const appts = appointments.filter((a) => a.client_id === clientId);
    const pmts = payments.filter(
      (p) => p.client_id === clientId && p.status === "verified"
    );
    const lastAppt = [...appts].sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      total: appts.length,
      completed: appts.filter((a) => a.status === "completed").length,
      cancelled: appts.filter((a) => a.status === "cancelled").length,
      spent: pmts.reduce((s, p) => s + p.amount, 0),
      lastBooking: lastAppt?.date || null,
    };
  };

  const selectedAppts = selected
    ? [...appointments.filter((a) => a.client_id === selected.id)].sort(
        (a, b) => b.date.localeCompare(a.date)
      )
    : [];

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <p className="text-gray-500 text-sm mt-1">
          {clients.length} registered client{clients.length !== 1 ? "s" : ""} in total.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:flex-1 sm:min-w-[240px] bg-white border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-2.5 rounded-xl outline-none text-sm transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Client table */}
        <div className="xl:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-8 sm:p-16 text-center">
              <p className="text-gray-400 text-sm">Loading clients...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-8 sm:p-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-semibold mb-1">
                {search ? "No clients match your search" : "No clients yet"}
              </h3>
              <p className="text-gray-500 text-sm">
                {search
                  ? "Try a different name, email, or mobile number."
                  : "Clients will appear here after they register and book a session."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden card-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Client", "Contact", "Bookings", "Last Booking", "Total Spent"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-gray-500 text-xs uppercase tracking-wider py-3 px-4 font-medium first:pl-5 last:pr-5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => {
                      const stats = getClientStats(client.id);
                      const isSelected = selected?.id === client.id;
                      return (
                        <tr
                          key={client.id}
                          onClick={() => setSelected(client)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"}`}
                        >
                          <td className="py-3.5 pl-5 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                                {client.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-gray-900 text-sm font-medium">{client.name}</p>
                                <p className="text-gray-400 text-xs">{client.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 text-gray-500 text-xs">{client.mobile}</td>
                          <td className="py-3.5 pr-4">
                            <p className="text-gray-900 text-sm font-semibold">{stats.total}</p>
                            <p className="text-gray-400 text-xs">{stats.completed} completed</p>
                          </td>
                          <td className="py-3.5 pr-4 text-gray-500 text-xs">
                            {stats.lastBooking
                              ? new Date(stats.lastBooking + "T12:00:00").toLocaleDateString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="py-3.5 pr-5 text-gray-900 font-mono text-sm font-semibold">
                            ₱{stats.spent.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-gray-400 text-xs">
                  Showing {filtered.length} of {clients.length} clients
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Client profile panel */}
        <div className="xl:col-span-1">
          {selected ? (
            (() => {
              const stats = getClientStats(selected.id);
              return (
                <div className="bg-white rounded-2xl border border-gray-200 sticky top-4 card-shadow overflow-hidden">
                  {/* Profile header */}
                  <div className="bg-gray-900 px-5 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/50 text-xs">Client Profile</span>
                      <button
                        onClick={() => setSelected(null)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {selected.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{selected.name}</p>
                        <p className="text-white/50 text-xs mt-0.5">
                          Member since{" "}
                          {new Date(selected.created_at).toLocaleDateString("en-PH", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Contact info section */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        Contact Information
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600 text-xs">{selected.email}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-600 text-xs">{selected.mobile}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats section */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        Booking Summary
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { l: "Total", v: stats.total },
                          { l: "Completed", v: stats.completed },
                          { l: "Cancelled", v: stats.cancelled },
                          { l: "Total Spent", v: `₱${stats.spent.toLocaleString()}` },
                        ].map((s) => (
                          <div key={s.l} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="font-bold text-gray-900 text-base">{s.v}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking history */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        Booking History
                      </p>
                      {selectedAppts.length > 0 ? (
                        <div className="space-y-2">
                          {selectedAppts.slice(0, 6).map((a) => (
                            <div
                              key={a.id}
                              className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <div>
                                <p className="tracking-number text-xs text-gray-700 font-semibold">
                                  {a.tracking_number}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                  {a.package?.name} · {a.date}
                                </p>
                              </div>
                              <StatusBadge status={a.status} />
                            </div>
                          ))}
                          {selectedAppts.length > 6 && (
                            <p className="text-gray-400 text-xs text-center pt-1">
                              +{selectedAppts.length - 6} more bookings
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs">No bookings yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center card-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No client selected</p>
              <p className="text-gray-400 text-xs mt-1">Click a row to view the client profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
