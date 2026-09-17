export function StatusBadge({ status }) {
  const map = {
    // Appointment statuses
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    waiting: "bg-purple-50 text-purple-700 border-purple-200",
    now_serving: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-gray-100 text-gray-600 border-gray-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
    no_show: "bg-red-50 text-red-600 border-red-200",
    reschedule_requested: "bg-orange-50 text-orange-700 border-orange-200",
    cancellation_requested: "bg-orange-50 text-orange-700 border-orange-200",
    rescheduled: "bg-teal-50 text-teal-700 border-teal-200",
    checked_in: "bg-indigo-50 text-indigo-700 border-indigo-200",
    // Payment statuses
    payment_required: "bg-red-50 text-red-600 border-red-200",
    payment_submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
    under_verification: "bg-orange-50 text-orange-700 border-orange-200",
    pending_verification: "bg-yellow-50 text-yellow-700 border-yellow-200",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
    partially_paid: "bg-blue-50 text-blue-700 border-blue-200",
    fully_paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    waiting: "Waiting",
    now_serving: "Now Serving",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
    reschedule_requested: "Reschedule Req.",
    cancellation_requested: "Cancel Req.",
    rescheduled: "Rescheduled",
    checked_in: "Checked In",
    payment_required: "Payment Required",
    payment_submitted: "Submitted",
    under_verification: "Under Verification",
    pending_verification: "Pending Verification",
    verified: "Verified",
    rejected: "Rejected",
    partially_paid: "Partially Paid",
    fully_paid: "Fully Paid",
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full border font-medium ${map[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {labels[status] || status}
    </span>
  );
}
