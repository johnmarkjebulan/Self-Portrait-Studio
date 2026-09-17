import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { appointmentsApi, paymentsApi, authApi } from "../../services/api";

export default function ClientProfile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: user?.name || "", mobile: user?.mobile || "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [statsData, setStatsData] = useState({ total: 0, completed: 0, cancelled: 0, spent: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const [appts, pmts] = await Promise.all([
          appointmentsApi.getAll(),
          paymentsApi.getAll(),
        ]);
        const totalSpent = pmts
          .filter((p) => p.status === "verified")
          .reduce((s, p) => s + p.amount, 0);
        setStatsData({
          total: appts.length,
          completed: appts.filter((a) => a.status === "completed").length,
          cancelled: appts.filter((a) => a.status === "cancelled").length,
          spent: totalSpent,
        });
      } catch {
        // stats are non-critical, silently fail
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Name is required.", "error"); return; }
    setSaving(true);
    try {
      await updateProfile({ name: form.name, mobile: form.mobile });
      toast("Profile updated successfully.", "success");
    } catch {
      toast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (passwords.next.length < 8) { toast("New password must be at least 8 characters.", "error"); return; }
    if (passwords.next !== passwords.confirm) { toast("Passwords do not match.", "error"); return; }
    setChangingPass(true);
    try {
      await authApi.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      toast("Password changed successfully.", "success");
    } catch (err) {
      toast(err?.message || "Current password is incorrect.", "error");
    } finally {
      setChangingPass(false);
    }
  };

  const stats = [
    { label: "Total Bookings", value: loadingStats ? "…" : statsData.total },
    { label: "Completed", value: loadingStats ? "…" : statsData.completed },
    { label: "Cancelled", value: loadingStats ? "…" : statsData.cancelled },
    { label: "Total Spent", value: loadingStats ? "…" : `₱${statsData.spent.toLocaleString()}` },
  ];

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center card-shadow">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 card-shadow">
        <h2 className="font-semibold text-gray-900 mb-4">Account Details</h2>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl">
            {user?.name.charAt(0)}
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <p className="text-gray-400 text-xs mt-0.5">Client Account</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm transition-colors" />
          </div>

          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Email Address</label>
            <input type="email" value={user?.email || ""} disabled
              className="w-full bg-gray-50 border border-gray-100 text-gray-400 px-4 py-3 rounded-xl text-sm cursor-not-allowed" />
            <p className="text-gray-400 text-xs mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Mobile Number</label>
            <input type="tel" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm transition-colors" />
          </div>

          <button type="submit" disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors self-start px-8"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 card-shadow">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          {["current", "next", "confirm"].map((f, i) => (
            <div key={f}>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">
                {["Current Password", "New Password", "Confirm New Password"][i]}
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={passwords[f]}
                onChange={e => setPasswords(p => ({ ...p, [f]: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors"
              />
            </div>
          ))}

          <label className="flex items-center gap-2 text-gray-500 text-xs cursor-pointer">
            <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="accent-gray-900" />
            Show passwords
          </label>

          <button type="submit" disabled={changingPass}
            className="border border-gray-200 hover:border-gray-400 text-gray-700 hover:text-gray-900 disabled:opacity-60 py-3 rounded-xl text-sm transition-colors self-start px-8"
          >
            {changingPass ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
