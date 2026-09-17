import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { appointmentsApi, paymentsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { studioToday } from "../../utils/date";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result || "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function ClientPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [form, setForm] = useState({ amount: "", reference: "", payment_date: "", proof: null });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const load = async () => {
    if (!user) return;
    try {
      const [appts, pmts] = await Promise.all([
        appointmentsApi.getAll(),
        paymentsApi.getAll(),
      ]);
      const sorted = [...appts].sort((a, b) => b.created_at.localeCompare(a.created_at));
      setAppointments(sorted);
      setPayments([...pmts].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch {
      toast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const payable = appointments.filter(
    (a) => !["cancelled", "no_show", "completed"].includes(a.status) && a.remaining_balance > 0
  );

  const validate = () => {
    const e = {};
    if (!selectedAppt) e.appt = "Select an appointment.";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = "Enter a valid payment amount.";
    else if (selectedAppt && amt > selectedAppt.remaining_balance)
      e.amount = `Amount exceeds remaining balance of ₱${selectedAppt.remaining_balance.toLocaleString()}.`;
    if (!form.reference.trim()) e.reference = "Reference number is required.";
    if (!form.payment_date) e.payment_date = "Payment date is required.";
    if (!form.proof) e.proof = "Payment proof is required.";
    else if (form.proof.size > 5 * 1024 * 1024) e.proof = "Payment proof must be 5 MB or smaller.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!selectedAppt || !user) return;
    setSubmitting(true);

    try {
      const amt = parseFloat(form.amount);
      const isFullPayment = amt >= selectedAppt.remaining_balance;
      const proofData = form.proof ? await toBase64(form.proof) : "";

      await paymentsApi.create({
        appointment_id: selectedAppt.id,
        client_id: user.id,
        amount: amt,
        type: selectedAppt.amount_paid === 0 ? "down_payment" : isFullPayment ? "full" : "partial",
        reference_number: form.reference,
        payment_date: form.payment_date,
        proof_filename: form.proof?.name || "",
        proof_data: proofData,
        status: "payment_submitted",
      });

      toast("Payment proof submitted! Awaiting admin verification.", "success");
      setForm({ amount: "", reference: "", payment_date: "", proof: null });
      setSelectedAppt(null);
      if (fileRef.current) fileRef.current.value = "";
      setErrors({});
      await load();
    } catch {
      toast("Failed to submit payment. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading payments…</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Upload payment proof and track your payment status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 card-shadow">
          <h2 className="font-semibold text-gray-900 mb-1">Upload Payment Proof</h2>
          <p className="text-gray-500 text-xs mb-6">Upload your QR Ph transaction screenshot for admin verification.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Select Appointment</label>
              {payable.length === 0 ? (
                <p className="text-gray-400 text-sm bg-gray-50 rounded-xl p-3 border border-gray-200">
                  No appointments requiring payment.
                </p>
              ) : (
                <select
                  value={selectedAppt?.id || ""}
                  onChange={(e) => {
                    const a = appointments.find((a) => a.id === e.target.value);
                    setSelectedAppt(a || null);
                    setForm((f) => ({ ...f, amount: a ? String(a.remaining_balance) : "" }));
                    setErrors({});
                  }}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
                >
                  <option value="">— Select appointment —</option>
                  {payable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tracking_number} · ₱{a.remaining_balance.toLocaleString()} balance
                    </option>
                  ))}
                </select>
              )}
              {errors.appt && <p className="text-red-500 text-xs mt-1">{errors.appt}</p>}
            </div>

            {selectedAppt && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500">Total</span>
                  <span className="text-gray-900 font-mono">₱{selectedAppt.total_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-emerald-600 font-mono">₱{selectedAppt.amount_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1.5 border-t border-gray-200">
                  <span className="text-gray-700">Balance</span>
                  <span className="text-gray-900 font-mono">₱{selectedAppt.remaining_balance.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Amount Paid (₱)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setErrors({}); }}
                placeholder="0.00"
                min="1"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Transaction / Reference Number</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => { setForm((f) => ({ ...f, reference: e.target.value })); setErrors({}); }}
                placeholder="TXN1234567890"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
              {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Payment Date</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => { setForm((f) => ({ ...f, payment_date: e.target.value })); setErrors({}); }}
                max={studioToday()}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
              {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Payment Proof (Screenshot)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${form.proof ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}
              >
                {form.proof ? (
                  <div>
                    <p className="text-gray-900 text-sm font-medium">{form.proof.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{(form.proof.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 text-sm">Click to upload screenshot</p>
                    <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP · Max 5MB</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) { toast("File too large. Max 5MB.", "error"); return; }
                    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { toast("Invalid file type.", "error"); return; }
                    setForm((prev) => ({ ...prev, proof: f }));
                    setErrors((prev) => { const n = { ...prev }; delete n.proof; return n; });
                  }}
                />
              </div>
              {errors.proof && <p className="text-red-500 text-xs mt-1">{errors.proof}</p>}
              <p className="text-gray-400 text-xs mt-2">Note: Payment is verified manually by our admin team.</p>
            </div>

            <button
              type="submit"
              disabled={submitting || payable.length === 0}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Payment Proof"}
            </button>
          </form>
        </div>

        {/* QR Ph instructions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 card-shadow">
          <h2 className="font-semibold text-gray-900 mb-4">QR Ph Payment</h2>
          <div className="bg-gray-100 rounded-xl p-6 flex items-center justify-center mb-5">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">QR</div>
              <p className="text-xs text-gray-500">Self-Portrait Studio</p>
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {[
              "Open your banking app or e-wallet",
              "Tap 'Scan QR' or 'Pay via QR Ph'",
              "Scan the studio QR code above",
              "Enter the exact amount to pay",
              "Add your tracking number as reference",
              "Complete and screenshot the transaction",
              "Upload the screenshot using the form",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-gray-900 font-mono text-xs font-bold shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-gray-500">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-700 text-xs font-semibold mb-1">Important Notice</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Uploading a receipt does NOT automatically verify your payment. An admin will manually review your submission within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm card-shadow">
            No payment records yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Appointment", "Amount", "Reference", "Date", "Status"].map((h) => (
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
                  {payments.map((p) => {
                    const appt = appointments.find((a) => a.id === p.appointment_id);
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 pl-5 pr-4 tracking-number text-gray-900 text-xs font-semibold">
                          {appt?.tracking_number || "—"}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-gray-900">₱{p.amount.toLocaleString()}</td>
                        <td className="py-3.5 pr-4 text-gray-500 font-mono text-xs">{p.reference_number}</td>
                        <td className="py-3.5 pr-4 text-gray-500 text-xs">{p.payment_date}</td>
                        <td className="py-3.5 pr-5">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
