import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import NotificationBell from "../common/NotificationBell";

const Icon = ({ d }) => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const items = [
  ["/staff/dashboard", "Dashboard", "M3 12l2-2 7-7 7 7M5 10v10h4v-6h6v6h4V10"],
  ["/staff/appointments", "Appointments", "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"],
  ["/staff/clients", "Clients", "M12 4a4 4 0 110 8 4 4 0 010-8zm-7 17a7 7 0 0114 0"],
  ["/staff/posts", "Studio Posts", "M4 16l4-4a3 3 0 014 0l4 4m-2-2 1-1a3 3 0 014 0l1 1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"],
  ["/staff/feedback", "Feedback", "M11.049 2.927l1.519 4.674h4.915l-3.976 2.888 1.519 4.674L12 12.275 8.974 15.163l1.519-4.674L6.517 7.601h4.915l1.519-4.674z"],
];

export default function StaffLayout() {
  const { user, logout, isStaff, authReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authReady && !user) return <div className="min-h-screen bg-gray-100" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/client/dashboard"} replace />;

  const current = items.find(([path]) => path === location.pathname);
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[#0d1117] transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-xs">SP</div>
            <div><p className="text-white font-semibold text-xs">Pose and Pics</p><p className="text-white/40 text-[10px] mt-0.5">Staff Portal</p></div>
          </Link>
        </div>
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-semibold text-xs">{user.name?.charAt(0)?.toUpperCase()}</div>
            <div className="min-w-0"><p className="text-white text-xs font-semibold truncate">{user.name}</p><p className="text-amber-400 text-[10px] mt-0.5">Staff Account</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2">DAILY OPERATIONS</p>
          {items.map(([path, label, d]) => {
            const active = location.pathname === path;
            return <Link key={path} to={path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-xs font-medium transition-colors ${active ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/5 hover:text-white/80"}`}><span className={active ? "text-amber-400" : "text-white/30"}><Icon d={d} /></span>{label}</Link>;
          })}
        </nav>
        <div className="px-3 pb-4 pt-2 border-t border-white/5">
          <button onClick={handleLogout} className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-white/35 hover:bg-red-500/10 hover:text-red-400">Log Out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30 shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 min-w-0"><h1 className="text-gray-900 font-semibold text-sm truncate">{current?.[1] || "Staff Portal"}</h1><p className="text-gray-400 text-xs hidden sm:block">Pose and Pics Photography Studio</p></div>
          <NotificationBell role="staff" />
          <div className="flex items-center gap-2 pl-1"><div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">{user.name?.charAt(0)?.toUpperCase()}</div><span className="text-xs font-medium text-gray-700 hidden sm:block max-w-28 truncate">{user.name}</span></div>
        </header>
        <main className="portal-canvas flex-1 p-4 sm:p-6 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
