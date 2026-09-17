import { useState } from "react";
import {
  appointmentsApi,
  paymentsApi,
  usersApi,
  packagesApi,
  feedbackApi,
} from "../../services/api.js";
import { useToast } from "../../contexts/ToastContext";

const REPORT_TYPES = [
  { value: "appointments", label: "Appointments" },
  { value: "revenue", label: "Revenue" },
  { value: "payments", label: "Payments" },
  { value: "clients", label: "Clients" },
  { value: "packages", label: "Packages" },
  { value: "feedback", label: "Feedback" },
];

function escapeCell(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function filterByDateRange(items, dateField, from, to) {
  return items.filter((item) => {
    const d = item[dateField] ? item[dateField].slice(0, 10) : null;
    if (!d) return true;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

export default function Reports() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState("appointments");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [summaryStats, setSummaryStats] = useState(null);

  async function handleExport() {
    setExporting(true);
    setSummaryStats(null);
    try {
      const [appointments, payments, clients, packages, feedback] =
        await Promise.all([
          appointmentsApi.getAll(),
          paymentsApi.getAll(),
          usersApi.getAll("client"),
          packagesApi.getAll(true),
          feedbackApi.getAll(),
        ]);

      const clientMap = Object.fromEntries(
        (clients || []).map((c) => [c.id, c])
      );
      const pkgMap = Object.fromEntries(
        (packages || []).map((p) => [p.id, p])
      );

      let csv = "";
      let filename = `${reportType}-report.csv`;
      let stats = null;

      if (reportType === "appointments") {
        const rows = filterByDateRange(
          appointments,
          "date",
          fromDate,
          toDate
        );
        const headers = [
          "Tracking #",
          "Client",
          "Email",
          "Package",
          "Date",
          "Time",
          "People",
          "Total Price",
          "Amount Paid",
          "Payment Status",
          "Status",
          "Created At",
        ];
        const data = rows.map((a) => [
          a.tracking_number,
          a.client?.name || clientMap[a.client_id]?.name || "",
          a.client?.email || clientMap[a.client_id]?.email || "",
          a.package?.name || pkgMap[a.package_id]?.name || "",
          a.date,
          a.time,
          a.num_people,
          a.total_price,
          a.amount_paid,
          a.payment_status,
          a.status,
          a.created_at,
        ]);
        csv = buildCsv(data, headers);
        stats = {
          total: rows.length,
          completed: rows.filter((a) => a.status === "completed").length,
          cancelled: rows.filter((a) => a.status === "cancelled").length,
          pending: rows.filter((a) => a.status === "pending").length,
        };
      } else if (reportType === "revenue") {
        const verifiedRevenue = payments
          .filter((p) => p.status === "verified")
          .map((p) => ({
            ...p,
            revenue_date: String(p.verified_at || p.payment_date || p.created_at || "").slice(0, 10),
          }));
        const rows = filterByDateRange(verifiedRevenue, "revenue_date", fromDate, toDate);
        const headers = [
          "Payment ID",
          "Tracking #",
          "Client",
          "Package",
          "Payment Date",
          "Payment Type",
          "Amount",
          "Reference",
        ];
        const data = rows.map((p) => {
          const appt = p.appointment || appointments.find((a) => a.id === p.appointment_id);
          return [
            p.id,
            appt?.tracking_number || "",
            p.client?.name || clientMap[p.client_id]?.name || "",
            appt?.package?.name || pkgMap[appt?.package_id]?.name || "",
            p.revenue_date,
            p.type,
            p.amount,
            p.reference_number || "",
          ];
        });
        csv = buildCsv(data, headers);
        const totalRevenue = rows.reduce((sum, p) => sum + (p.amount || 0), 0);
        stats = {
          verifiedPayments: rows.length,
          totalRevenue: `₱${totalRevenue.toLocaleString()}`,
        };
      } else if (reportType === "payments") {
        const rows = filterByDateRange(payments, "created_at", fromDate, toDate);
        const headers = [
          "ID",
          "Appointment",
          "Client",
          "Amount",
          "Payment Type",
          "Status",
          "Date",
        ];
        const data = rows.map((p) => [
          p.id,
          p.appointment?.tracking_number || p.appointment_id || "",
          p.client?.name || clientMap[p.client_id]?.name || "",
          p.amount,
          p.type,
          p.status,
          p.created_at,
        ]);
        csv = buildCsv(data, headers);
        const totalAmount = rows.reduce((sum, p) => sum + (p.amount || 0), 0);
        stats = {
          totalPayments: rows.length,
          totalAmount: `₱${totalAmount.toLocaleString()}`,
          verified: rows.filter((p) => p.status === "verified").length,
          pending: rows.filter((p) => ["payment_submitted", "under_verification"].includes(p.status)).length,
        };
      } else if (reportType === "clients") {
        const rows = filterByDateRange(clients, "created_at", fromDate, toDate);
        const headers = ["ID", "Name", "Email", "Mobile", "Registered At"];
        const data = rows.map((c) => [
          c.id,
          c.name,
          c.email,
          c.mobile,
          c.created_at,
        ]);
        csv = buildCsv(data, headers);
        stats = { totalClients: rows.length };
      } else if (reportType === "packages") {
        const headers = [
          "ID",
          "Name",
          "Description",
          "Price",
          "Duration",
          "Max People",
          "Status",
        ];
        const data = (packages || []).map((p) => [
          p.id,
          p.name,
          p.description,
          p.price,
          p.duration,
          p.max_people,
          p.active ? "Active" : "Inactive",
        ]);
        csv = buildCsv(data, headers);
        stats = {
          totalPackages: packages.length,
          active: packages.filter((p) => p.active).length,
        };
      } else if (reportType === "feedback") {
        const rows = filterByDateRange(feedback, "created_at", fromDate, toDate);
        const headers = [
          "ID",
          "Client",
          "Appointment",
          "Rating",
          "Comment",
          "Date",
        ];
        const data = rows.map((f) => [
          f.id,
          f.client?.name || clientMap[f.client_id]?.name || "",
          f.appointment?.tracking_number || "",
          f.rating,
          f.comment,
          f.created_at,
        ]);
        csv = buildCsv(data, headers);
        const avgRating =
          rows.length > 0
            ? (
                rows.reduce((sum, f) => sum + (f.rating || 0), 0) / rows.length
              ).toFixed(2)
            : "N/A";
        stats = { totalReviews: rows.length, averageRating: avgRating };
      }

      downloadCsv(csv, filename);
      setSummaryStats(stats);
      showToast("CSV exported successfully", "success");
    } catch (err) {
      showToast(err?.message || "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-screen-md mx-auto">
      <div className="mb-6"><h1 className="font-display text-2xl font-semibold text-gray-900">Reports</h1><p className="text-gray-500 text-sm mt-1">Export operational data using the same verified-payment definition used by Analytics.</p></div>

      {/* Filter Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Export Summary
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(summaryStats).map(([key, val]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-800">{val}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
