import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { QRCodeSVG } from "qrcode.react";
import { packagesApi, appointmentsApi, settingsApi, paymentsApi, availabilityApi } from "../../services/api";
import { studioToday } from "../../utils/date";

const STEP_LABELS = ["Package", "Date & Time", "Details", "Add-ons", "Summary", "Payment", "Confirmation"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result || "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// ── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-1">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${done ? "bg-emerald-500 text-white" : active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium whitespace-nowrap ${active ? "text-gray-900" : done ? "text-emerald-600" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 mb-5 transition-all ${done ? "bg-emerald-400" : "bg-gray-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Package Step ───────────────────────────────────────────────────────────

function PackageStep({ selected, onSelect }) {
  const { toast } = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packagesApi.getAll()
      .then(setPackages)
      .catch((err) => {
        setPackages([]);
        toast(err.message || "Could not load packages.", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-400 text-sm">Loading packages…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose a Package</h2>
        <p className="text-gray-500 text-sm">Select the photography package that best fits your needs.</p>
      </div>
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          onClick={() => onSelect(pkg)}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${selected?.id === pkg.id ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
              <p className="text-gray-500 text-sm mt-0.5">{pkg.description}</p>
            </div>
            <div className="text-right ml-4 shrink-0">
              <div className="text-lg font-bold text-gray-900">₱{pkg.price.toLocaleString()}</div>
              <div className="text-xs text-gray-400">{pkg.duration} min session</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
            <span>Up to {pkg.max_people} people</span>
            <span>{pkg.edited_photos} edited photos</span>
            {pkg.printed_photos > 0 && <span>{pkg.printed_photos} prints</span>}
          </div>
          {pkg.services && (
            <div className="flex flex-wrap gap-1.5">
              {pkg.services.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg">{s}</span>
              ))}
            </div>
          )}
          {selected?.id === pkg.id && (
            <div className="mt-3 flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Selected
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Schedule Step ─────────────────────────────────────────────────────────

function ScheduleStep({ selectedDate, selectedTime, onSelectDate, onSelectTime }) {
  const now = new Date();
  const todayKey = studioToday();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [monthDays, setMonthDays] = useState({});
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [loadingCal, setLoadingCal] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const getDateStr = (day) => `${monthKey}-${String(day).padStart(2, "0")}`;

  useEffect(() => {
    let active = true;
    setLoadingCal(true);
    availabilityApi.getMonth(monthKey)
      .then((result) => {
        if (!active) return;
        setMonthDays(Object.fromEntries((result.days || []).map((day) => [day.date, day])));
      })
      .catch(() => { if (active) setMonthDays({}); })
      .finally(() => { if (active) setLoadingCal(false); });
    return () => { active = false; };
  }, [monthKey]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedAvailability(null);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    availabilityApi.getDate(selectedDate)
      .then((result) => { if (active) setSelectedAvailability(result); })
      .catch(() => { if (active) setSelectedAvailability(null); })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [selectedDate]);

  const isCurrentOrPastMonth = monthKey <= todayKey.slice(0, 7);
  const prevMonth = () => {
    if (isCurrentOrPastMonth) return;
    setCurrentMonth(new Date(year, monthIndex - 1, 1));
  };
  const nextMonth = () => setCurrentMonth(new Date(year, monthIndex + 1, 1));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Date & Time</h2>
        <p className="text-gray-500 text-sm">Availability comes directly from studio hours, capacity, bookings, and Admin schedule overrides.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <button type="button" onClick={prevMonth} disabled={isCurrentOrPastMonth} aria-label="Previous month"
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-semibold text-gray-900 text-sm">{MONTH_NAMES[monthIndex]} {year}</span>
          <button type="button" onClick={nextMonth} aria-label="Next month"
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => <div key={d} className="text-center text-[10px] sm:text-xs text-gray-400 font-medium py-1">{d}</div>)}
        </div>

        {loadingCal ? (
          <div className="text-center text-gray-400 text-sm py-8">Loading availability…</div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = getDateStr(day);
              const info = monthDays[dateStr];
              const status = info?.status || "closed";
              const disabled = dateStr < todayKey || status === "closed" || status === "full";
              const isSel = selectedDate === dateStr;
              const statusClass = status === "full"
                ? "bg-red-50 text-red-300"
                : status === "limited"
                  ? "bg-yellow-50 text-gray-800 hover:bg-yellow-100"
                  : status === "available"
                    ? "text-gray-800 hover:bg-gray-100"
                    : "text-gray-300";
              const dotColor = status === "full" ? "bg-red-400" : status === "limited" ? "bg-yellow-400" : status === "available" ? "bg-emerald-400" : "";
              return (
                <button type="button" key={day} disabled={disabled}
                  onClick={() => { onSelectDate(dateStr); onSelectTime(""); }}
                  className={`min-h-[46px] sm:min-h-[52px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-xs transition-all ${isSel ? "bg-gray-900 text-white font-semibold" : `${statusClass} ${disabled ? "cursor-not-allowed" : "cursor-pointer font-medium"}`}`}>
                  <span>{day}</span>
                  {!isSel && dotColor && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`} />}
                  {!isSel && status === "closed" && dateStr >= todayKey && <span className="hidden sm:block text-[9px] mt-0.5">Closed</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
          {[{ color: "bg-emerald-400", label: "Available" }, { color: "bg-yellow-400", label: "Limited" }, { color: "bg-red-400", label: "Full" }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500"><span className={`w-2 h-2 rounded-full ${color}`} />{label}</div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-200" />Closed / Past</div>
        </div>
      </div>

      {selectedDate && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Times for {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {selectedAvailability && <span className="text-xs text-gray-400">{selectedAvailability.daily_remaining} daily booking slot(s) left</span>}
          </div>
          {loadingSlots ? (
            <div className="text-sm text-gray-400 py-5">Loading time slots…</div>
          ) : !selectedAvailability || selectedAvailability.slots.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No studio time slots are available for this date.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {selectedAvailability.slots.map((slot) => {
                const isSel = selectedTime === slot.time;
                return (
                  <button type="button" key={slot.time} disabled={!slot.available} onClick={() => onSelectTime(slot.time)}
                    className={`min-h-[52px] px-3 py-2 rounded-xl border-2 text-sm text-center transition-all font-semibold ${isSel ? "border-gray-900 bg-gray-900 text-white" : slot.available ? "border-gray-200 bg-white hover:border-gray-400 text-gray-800" : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"}`}>
                    <span className="block">{slot.time}</span>
                    <span className={`block text-[10px] mt-0.5 ${isSel ? "text-white/70" : slot.available ? "text-gray-400" : "text-gray-300"}`}>
                      {slot.blocked ? "Blocked" : slot.available ? `${slot.remaining} left` : "Full"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Details Step ───────────────────────────────────────────────────────────

function DetailsStep({ pkg, numPeople, setNumPeople, specialRequests, setSpecialRequests, errors }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Details</h2>
        <p className="text-gray-500 text-sm">Tell us more about your group and any special requests.</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
        <div className="font-medium text-gray-900 mb-1">{pkg.name}</div>
        <div className="text-gray-500">Up to {pkg.max_people} people · {pkg.duration} min</div>
      </div>
      <div>
        <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Number of People</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg transition-colors"
          >
            −
          </button>
          <span className="w-12 text-center text-gray-900 font-semibold text-lg">{numPeople}</span>
          <button
            onClick={() => setNumPeople(Math.min(pkg.max_people, numPeople + 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg transition-colors"
          >
            +
          </button>
          <span className="text-gray-400 text-sm">/ {pkg.max_people} max</span>
        </div>
        {errors.numPeople && <p className="text-red-500 text-xs mt-1">{errors.numPeople}</p>}
      </div>
      <div>
        <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">
          Special Requests <span className="normal-case">(optional)</span>
        </label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Backdrop preference, props, styling notes, accessibility needs..."
          rows={4}
          className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors resize-none"
        />
      </div>
    </div>
  );
}

// ── Addon Step ─────────────────────────────────────────────────────────────

function AddonStep({ selected, onToggle }) {
  const { toast } = useToast();
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packagesApi.getAddons()
      .then(setAddons)
      .catch((err) => {
        setAddons([]);
        toast(err.message || "Could not load add-ons.", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-400 text-sm">Loading add-ons…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Add-ons</h2>
        <p className="text-gray-500 text-sm">Enhance your session with optional extras.</p>
      </div>
      {addons.length === 0 ? (
        <div className="text-gray-400 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-5 text-center">
          No add-ons available at this time.
        </div>
      ) : (
        addons.map((addon) => {
          const isSelected = selected.includes(addon.id);
          return (
            <button
              key={addon.id}
              onClick={() => onToggle(addon.id, addon)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between
                ${isSelected ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{addon.name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{addon.description}</div>
                </div>
              </div>
              <div className="text-gray-900 font-semibold text-sm ml-4 shrink-0">+₱{addon.price.toLocaleString()}</div>
            </button>
          );
        })
      )}
    </div>
  );
}

// ── Summary Step ───────────────────────────────────────────────────────────

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function SummaryStep({ pkg, selectedDate, selectedTime, numPeople, specialRequests, selectedAddonIds, addonObjects, total, downPayment, settings }) {
  const dateDisplay = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const dpLabel =
    settings?.down_payment_type === "percentage"
      ? `Down Payment (${settings.down_payment_value}%)`
      : "Down Payment (Required)";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Booking Summary</h2>
        <p className="text-gray-500 text-sm">Review your details before confirming.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3.5">
          <div className="text-gray-900 font-semibold">{pkg.name}</div>
          <div className="text-gray-500 text-sm">{dateDisplay} · {selectedTime}</div>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3 text-sm">
          <SummaryRow label="Date" value={dateDisplay} />
          <SummaryRow label="Time" value={selectedTime} />
          <SummaryRow label="People" value={`${numPeople} person${numPeople !== 1 ? "s" : ""}`} />
          {specialRequests && <SummaryRow label="Special Requests" value={specialRequests} />}
        </div>

        <div className="border-t border-gray-200 px-5 py-4 flex flex-col gap-2 text-sm">
          <SummaryRow label="Package Price" value={`₱${pkg.price.toLocaleString()}`} />
          {addonObjects.map((a) => (
            <SummaryRow key={a.id} label={a.name} value={`+₱${a.price.toLocaleString()}`} />
          ))}
          <div className="border-t border-gray-100 pt-2 mt-1 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-5 py-4 bg-amber-50">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-700 font-medium">{dpLabel}</span>
            <span className="text-gray-900 font-bold">₱{downPayment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Remaining Balance</span>
            <span>₱{(total - downPayment).toLocaleString()}</span>
          </div>
          <p className="text-xs text-amber-700 mt-2.5 leading-relaxed">
            Pay the down payment via QR Ph on the next step. The balance is due on session day.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Payment Step ───────────────────────────────────────────────────────────

function PaymentStep({ appt, settings, onComplete }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    amount: String(appt.down_payment || appt.remaining_balance || ""),
    reference: "",
    payment_date: studioToday(),
    proof: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = "Enter a valid amount.";
    else if (amt > appt.remaining_balance) e.amount = `Amount exceeds balance of ₱${appt.remaining_balance.toLocaleString()}.`;
    if (!form.reference.trim()) e.reference = "Reference number is required.";
    if (!form.payment_date) e.payment_date = "Payment date is required.";
    if (!form.proof) e.proof = "Upload a screenshot of your transaction.";
    else if (form.proof.size > 5 * 1024 * 1024) e.proof = "Payment proof must be 5 MB or smaller.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!user) return;
    setSubmitting(true);

    try {
      const amt = parseFloat(form.amount);
      const proofData = form.proof ? await toBase64(form.proof) : "";

      await paymentsApi.create({
        appointment_id: appt.id,
        client_id: user.id,
        amount: amt,
        type: "down_payment",
        reference_number: form.reference,
        payment_date: form.payment_date,
        proof_filename: form.proof?.name || "",
        proof_data: proofData,
        status: "payment_submitted",
      });

      toast("Payment submitted! Awaiting admin verification.", "success");
      onComplete();
    } catch {
      toast("Failed to submit payment. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const qrValue = settings?.qr_gcash_number || settings?.gcash_number || "09171234567";
  const studioName = settings?.studio_name || "Self-Portrait Studio";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Pay Down Payment</h2>
        <p className="text-gray-500 text-sm">
          Scan the QR code to send your down payment, then upload your transaction screenshot.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code panel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium self-start">GCash / QR Ph</div>
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
            <QRCodeSVG value={qrValue} size={160} fgColor="#111827" bgColor="#ffffff" level="M" />
          </div>
          <div className="text-center">
            <div className="font-mono text-lg font-bold text-gray-900">{qrValue}</div>
            <div className="text-gray-500 text-sm">{studioName}</div>
          </div>
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
            <strong>Use your tracking number as reference:</strong>
            <br />
            <span className="tracking-number text-amber-900 font-semibold">{appt.tracking_number}</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
            <div className="flex justify-between mb-1.5">
              <span className="text-gray-500">Total Booking</span>
              <span className="font-mono text-gray-900">₱{appt.total_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1.5 border-t border-gray-200">
              <span className="text-gray-900">Down Payment Due</span>
              <span className="text-gray-900 font-mono">₱{(appt.down_payment || appt.remaining_balance).toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Amount Paid (₱)</label>
              <input
                type="number"
                value={form.amount}
                min="1"
                onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setErrors({}); }}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Transaction / Reference Number</label>
              <input
                type="text"
                value={form.reference}
                placeholder="TXN1234567890"
                onChange={(e) => { setForm((f) => ({ ...f, reference: e.target.value })); setErrors({}); }}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
              {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Payment Date</label>
              <input
                type="date"
                value={form.payment_date}
                max={studioToday()}
                onChange={(e) => { setForm((f) => ({ ...f, payment_date: e.target.value })); setErrors({}); }}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
              {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Transaction Screenshot</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${form.proof ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}
              >
                {form.proof ? (
                  <div>
                    <p className="text-gray-900 text-sm font-medium">{form.proof.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{(form.proof.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 text-sm">Click to upload screenshot</p>
                    <p className="text-gray-400 text-xs mt-0.5">JPG, PNG · Max 5MB</p>
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
                    setForm((prev) => ({ ...prev, proof: f }));
                    setErrors((prev) => { const n = { ...prev }; delete n.proof; return n; });
                  }}
                />
              </div>
              {errors.proof && <p className="text-red-500 text-xs mt-1">{errors.proof}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Payment Proof"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation Step ──────────────────────────────────────────────────────

function ConfirmationStep({ appt }) {
  const navigate = useNavigate();
  const dateDisplay = new Date(appt.date + "T12:00:00").toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const qrValue = `SP-STUDIO|${appt.tracking_number}|${appt.id}`;

  return (
    <div className="text-center flex flex-col items-center gap-6 py-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Submitted!</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Your booking and payment proof have been submitted. Our team will verify your payment
          and confirm your appointment within 24 hours.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 w-full max-w-xs">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Tracking Number</div>
        <div className="tracking-number text-xl font-bold text-gray-900 mb-4">{appt.tracking_number}</div>
        <div className="text-gray-500 text-sm mb-1">{dateDisplay}</div>
        <div className="text-gray-500 text-sm">{appt.time}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3 w-full max-w-xs">
        <div className="text-gray-500 text-xs uppercase tracking-wider">Check-in QR Code</div>
        <div className="bg-white border border-gray-100 rounded-xl p-3">
          <QRCodeSVG value={qrValue} size={140} fgColor="#111827" bgColor="#ffffff" level="M" />
        </div>
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          Show this QR at the studio on session day for quick check-in. Screenshot it to save offline.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate("/client/appointments")}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          View Appointment
        </button>
        <button
          onClick={() => navigate("/client/dashboard")}
          className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}

// ── Main Booking Wizard ────────────────────────────────────────────────────

export default function BookingWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [numPeople, setNumPeople] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [addonObjects, setAddonObjects] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdAppt, setCreatedAppt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingsApi.get()
      .then(setSettings)
      .catch((err) => toast(err.message || "Could not load studio payment settings.", "error"));
  }, []);

  const total = selectedPackage
    ? selectedPackage.price + addonObjects.reduce((s, a) => s + a.price, 0)
    : 0;

  const downPayment = settings
    ? settings.down_payment_type === "percentage"
      ? Math.round(total * (settings.down_payment_value / 100))
      : (settings.down_payment_value || 0)
    : 0;

  const toggleAddon = (id, addonObj) => {
    setSelectedAddonIds((prev) => {
      if (prev.includes(id)) {
        setAddonObjects((objs) => objs.filter((a) => a.id !== id));
        return prev.filter((a) => a !== id);
      } else {
        if (addonObj) setAddonObjects((objs) => [...objs, addonObj]);
        return [...prev, id];
      }
    });
  };

  const canNext = () => {
    if (step === 0) return !!selectedPackage;
    if (step === 1) return !!(selectedDate && selectedTime);
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      const e = {};
      if (numPeople < 1) e.numPeople = "At least 1 person required.";
      if (selectedPackage && numPeople > selectedPackage.max_people)
        e.numPeople = `Max ${selectedPackage.max_people} people for this package.`;
      if (Object.keys(e).length) { setFieldErrors(e); return; }
      setFieldErrors({});
    }
    setStep((s) => s + 1);
  };

  const handleCreateAppointment = async () => {
    if (!user || !selectedPackage || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    try {
      const appt = await appointmentsApi.create({
        package_id: selectedPackage.id,
        date: selectedDate,
        time: selectedTime,
        num_people: numPeople,
        special_requests: specialRequests,
        addon_ids: selectedAddonIds,
      });

      setCreatedAppt(appt);
      setStep(5);
      toast("Booking created! Please pay your down payment.", "info");
    } catch (err) {
      toast(err.message || "Failed to create booking. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 6 && createdAppt) return <ConfirmationStep appt={createdAppt} />;
    if (step === 5 && createdAppt) {
      return (
        <PaymentStep
          appt={createdAppt}
          settings={settings}
          onComplete={() => setStep(6)}
        />
      );
    }
    if (step === 4 && selectedPackage && selectedDate && selectedTime) {
      return (
        <SummaryStep
          pkg={selectedPackage}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          numPeople={numPeople}
          specialRequests={specialRequests}
          selectedAddonIds={selectedAddonIds}
          addonObjects={addonObjects}
          total={total}
          downPayment={downPayment}
          settings={settings}
        />
      );
    }
    if (step === 3) {
      return (
        <AddonStep
          selected={selectedAddonIds}
          onToggle={toggleAddon}
        />
      );
    }
    if (step === 2 && selectedPackage) {
      return (
        <DetailsStep
          pkg={selectedPackage}
          numPeople={numPeople}
          setNumPeople={setNumPeople}
          specialRequests={specialRequests}
          setSpecialRequests={setSpecialRequests}
          errors={fieldErrors}
        />
      );
    }
    if (step === 1) {
      return (
        <ScheduleStep
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectDate={setSelectedDate}
          onSelectTime={setSelectedTime}
        />
      );
    }
    return (
      <PackageStep
        selected={selectedPackage}
        onSelect={(p) => { setSelectedPackage(p); setSelectedAddonIds([]); setAddonObjects([]); }}
      />
    );
  };

  const showNav = step < 5;
  const studioAddress = settings?.studio_address || "";

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">New Booking</h1>
        <p className="text-gray-500 text-sm mt-1">
          Book your portrait session{studioAddress ? ` at ${studioAddress}` : ""}.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 card-shadow">
        <StepIndicator current={step} />
        <div className="min-h-[360px]">
          {renderStep()}
        </div>

        {showNav && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => step === 0 ? navigate("/client/dashboard") : setStep((s) => s - 1)}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateAppointment}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {submitting ? "Creating…" : "Confirm Booking"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
