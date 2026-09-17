import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { notificationsApi } from "../../services/api";
import { useState, useEffect } from "react";

const Icon = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  appointments: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  queue: "M4 6h16M4 10h16M4 14h8m-8 4h4",
  scanner: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 4h.01M5 8h.01M5 16h.01M4 20h4m4-16v.01",
  clients: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  packages: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  schedules: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  payments: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  analytics: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  reports: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  feedback: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  logs: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

const navGroups = [
  {
    items: [
      { path: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { path: "/admin/appointments", label: "Appointments", icon: "appointments" },
      { path: "/admin/queue", label: "Queue", icon: "queue" },
      { path: "/admin/scanner", label: "QR Scanner", icon: "scanner" },
      { path: "/admin/clients", label: "Clients", icon: "clients" },
    ],
  },
  {
    label: "STUDIO",
    items: [
      { path: "/admin/packages", label: "Packages", icon: "packages" },
      { path: "/admin/schedules", label: "Schedules", icon: "schedules" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { path: "/admin/payments", label: "Payments", icon: "payments" },
      { path: "/admin/analytics", label: "Analytics", icon: "analytics" },
      { path: "/admin/reports", label: "Reports", icon: "reports" },
    ],
  },
  {
    label: "MONITORING",
    items: [
      { path: "/admin/notifications", label: "Notifications", icon: "notifications", badge: true },
      { path: "/admin/feedback", label: "Feedback", icon: "feedback" },
      { path: "/admin/activity-logs", label: "Activity Logs", icon: "logs" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { path: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

export default function AdminLayout() {
  const { user, logout, isAdmin, authReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const loadUnread = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        if (active) setUnread(count);
      } catch (err) {
        console.error("Failed to load admin notification count:", err);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [user]);

  if (!authReady && !user) return <div className="min-h-screen" style={{ backgroundColor: "#f3f4f6" }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/client/dashboard" replace />;

  const handleLogout = () => { logout(); navigate("/"); };
  const currentPage = allNavItems.find(n => n.path === location.pathname);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f3f4f6" }}>
      {/* Dark sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}
        style={{ backgroundColor: "#0d1117" }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">SP</span>
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-none">Self-Portrait</p>
              <p className="text-white/40 text-[10px] leading-none mt-0.5">Studio Admin</p>
            </div>
          </Link>
        </div>

        {/* User */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold leading-none truncate">{user.name}</p>
              <p className="text-amber-400 text-[10px] mt-0.5 font-medium">Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-1.5">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/45 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon d={ICONS[item.icon]} className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-400" : "text-white/30 group-hover:text-white/50"}`} />
                        {item.label}
                      </span>
                      {item.badge && unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">{unread}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 pt-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-white/35 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 sticky top-0 z-30 shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-900 -ml-1" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-900 font-semibold text-sm truncate">{currentPage?.label || "Admin Panel"}</h1>
            <p className="text-gray-400 text-xs hidden sm:block">Self-Portrait Studio Management</p>
          </div>
          <span className="text-gray-400 text-xs hidden md:block">{new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</span>
          <Link to="/admin/notifications" className="relative text-gray-400 hover:text-gray-700 transition-colors p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {unread > 0 && <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>}
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
