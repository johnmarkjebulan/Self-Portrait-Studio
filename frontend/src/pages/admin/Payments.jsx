import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { paymentsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";

export default function AdminPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const all = await paymentsApi.getAll();
      setPayments(
        all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
    } catch (e) {
      toast(e.message || "Failed to load payments.", "error");
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (p.appointment?.tracking_number || "").toLowerCase().includes(q) ||
      (p.client?.name || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const updatePaymentStatus = async (payment, newStatus) => {
    setLoading(true);
    try {
      await paymentsApi.update(payment.id, { status: newStatus });
      if (newStatus === "verified") {
        toast("Payment verified successfully.", "success");
      } else if (newStatus === "rejected") {
        toast("Payment rejected.", "warning");
      } else {
        toast("Payment marked as under verification.", "success");
      }
      await load();
      setSelected(null);
    } catch (e) {
      toast(e.message || "Failed to update payment.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "payment_submitted", label: "Submitted" },
    { value: "under_verification", label: "Under Review" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Payment Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and verify client payment submissions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tracking # or client name…"
          className="w-full max-w-sm bg-white border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-3 py-2 rounded-xl text-sm outline-none"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Tracking #", "Client", "Type", "Amount", "Reference", "Date", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4 font-medium"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isSelected = selected?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 pr-4 font-mono text-gray-700 text-xs font-semibold">
                      {p.appointment?.tracking_number || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-900 text-xs">
                      {p.client?.name || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs capitalize">
                      {(p.type || "").replace("_", " ")}
                    </td>
                    <td className="py-3 pr-4 text-gray-900 font-mono text-xs font-semibold">
                      ₱{(p.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 font-mono text-xs">
                      {p.reference_number}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {p.payment_date}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-1">
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Payment Details
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  ["Tracking #", selected.appointment?.tracking_number || "—"],
                  ["Client", selected.client?.name || "—"],
                  ["Email", selected.client?.email || "—"],
                  ["Amount", `₱${(selected.amount || 0).toLocaleString()}`],
                  ["Reference", selected.reference_number || "—"],
                  ["Payment Date", selected.payment_date || "—"],
                  ["Type", (selected.type || "").replace("_", " ")],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">{l}</span>
                    <span className="text-gray-900 font-medium text-right capitalize">
                      {v}
                    </span>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <StatusBadge status={selected.status} />
                </div>

                {/* Appointment balance */}
                {selected.appointment && (
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <p className="text-gray-500 uppercase tracking-wider">
                      Appointment Balance
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Package</span>
                      <span className="text-gray-900 font-medium">
                        {selected.appointment.package?.name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total</span>
                      <span className="text-gray-900 font-mono">
                        ₱{(selected.appointment.total_price || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid</span>
                      <span className="text-emerald-600 font-mono">
                        ₱{(selected.appointment.amount_paid || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Balance</span>
                      <span className="text-amber-600 font-mono">
                        ₱{(selected.appointment.remaining_balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selected.notes && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-500 uppercase tracking-wider mb-1">
                      Notes
                    </p>
                    <p className="text-gray-700">{selected.notes}</p>
                  </div>
                )}

                {/* Payment proof image */}
                {selected.proof_data && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-500 uppercase tracking-wider mb-2">
                      Payment Proof
                    </p>
                    <img
                      src={selected.proof_data}
                      alt="Payment proof"
                      className="w-full rounded-lg max-h-40 object-contain bg-gray-100"
                    />
                    {selected.proof_filename && (
                      <p className="text-gray-400 text-xs mt-1">
                        {selected.proof_filename}
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  {selected.status === "payment_submitted" && (
                    <button
                      onClick={() =>
                        updatePaymentStatus(selected, "under_verification")
                      }
                      disabled={loading}
                      className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 py-2 rounded-xl text-xs transition-colors"
                    >
                      Mark Under Verification
                    </button>
                  )}

                  {["payment_submitted", "under_verification"].includes(
                    selected.status
                  ) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updatePaymentStatus(selected, "verified")
                        }
                        disabled={loading}
                        className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl text-xs transition-colors"
                      >
                        ✓ Verify
                      </button>
                      <button
                        onClick={() =>
                          updatePaymentStatus(selected, "rejected")
                        }
                        disabled={loading}
                        className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {selected.status === "rejected" && (
                    <button
                      onClick={() =>
                        updatePaymentStatus(selected, "under_verification")
                      }
                      disabled={loading}
                      className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 py-2 rounded-xl text-xs transition-colors"
                    >
                      Re-open for Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-8 text-center text-gray-400 text-sm">
              Click a payment to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
