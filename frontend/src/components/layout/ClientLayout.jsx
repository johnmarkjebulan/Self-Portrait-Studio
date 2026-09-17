import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { notificationsApi } from "../../services/api";
import { useState, useEffect, useRef } from "react";
import { notificationLink } from "../../utils/notificationLink";

const navItems = [
  {
    path: "/client/dashboard", label: "Dashboard",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    path: "/client/book", label: "Book a Session",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>,
  },
  {
    path: "/client/bookings", label: "My Bookings",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    path: "/client/payments", label: "My Payments",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    path: "/client/feedback", label: "Feedback",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

const typeIcon = {
  booking: "📅",
  payment: "💳",
  queue: "🔢",
  feedback: "⭐",
  system: "ℹ️",
};

function NotificationDropdown({ userId, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.getAll(6);
        if (active) setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };
    loadNotifications();
    return () => { active = false; };
  }, [userId]);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate("/client/notifications");
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">Notifications</span>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">🔔</p>
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <button
              key={notif.id}
              onClick={async () => { if (!notif.read) { try { await notificationsApi.markRead(notif.id); } catch (err) { console.error(err); } } onClose(); navigate("/client/notifications"); }}
              className={`w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!notif.read ? "bg-blue-50/40" : ""}`}
            >
              <span className="text-base shrink-0 mt-0.5">{typeIcon[notif.type] || "🔔"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold truncate ${!notif.read ? "text-gray-900" : "text-gray-600"}`}>{notif.title}</p>
                  {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-2">
        <button onClick={handleViewAll}
          className="w-full text-xs text-gray-600 hover:text-gray-900 font-medium py-2 hover:bg-gray-50 rounded-xl transition-colors">
          View all notifications →
        </button>
      </div>
    </div>
  );
}

function ProfileDropdown({ user, onLogout, onClose }) {
  const navigate = useNavigate();
  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-gray-900 text-sm font-semibold truncate">{user.name}</p>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{user.email}</p>
      </div>
      <div className="p-1.5">
        <button onClick={() => { onClose(); navigate("/client/profile"); }}
          className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          My Profile
        </button>
        <button onClick={() => { onClose(); onLogout(); }}
          className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default function ClientLayout() {
  const { user, logout, isClient, authReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showBell, setShowBell] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const loadUnread = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        if (active) setUnread(count);
      } catch (err) {
        console.error("Failed to load notification count:", err);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdowns on nav
  useEffect(() => { setShowBell(false); setShowProfile(false); }, [location.pathname]);

  if (!authReady && !user) return <div className="min-h-screen bg-gray-50" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isClient) return <Navigate to="/admin/dashboard" replace />;

  const handleLogout = () => { logout(); navigate("/"); };
  const currentPage = navItems.find(n => n.path === location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">SP</span>
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-xs leading-none">Self-Portrait</p>
              <p className="text-gray-500 text-[10px] leading-none mt-0.5">Studio</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path === "/client/bookings" && location.pathname === "/client/appointments");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className={isActive ? "text-white" : "text-gray-400"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Book CTA */}
        <div className="px-3 pb-5 pt-2 border-t border-gray-100 shrink-0">
          <Link to="/client/book"
            className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Book a Session
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-5 gap-3 sm:gap-4 sticky top-0 z-30 shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-900 -ml-1" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate">{currentPage?.label || "Client Portal"}</p>
          </div>

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setShowBell(b => !b); setShowProfile(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">{unread > 9 ? "9+" : unread}</span>
              )}
            </button>
            {showBell && <NotificationDropdown userId={user.id} onClose={() => setShowBell(false)} />}
          </div>

          {/* Profile avatar */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(p => !p); setShowBell(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 text-sm font-medium hidden sm:block max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
              <svg className="w-3.5 h-3.5 text-gray-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showProfile && (
              <ProfileDropdown
                user={user}
                onLogout={handleLogout}
                onClose={() => setShowProfile(false)}
              />
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
