import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationLink } from "../../utils/notificationLink";
import { useAuth } from "../../contexts/AuthContext";
import { notificationsApi } from "../../services/api";

const typeIcon = {
  booking: "📋", payment: "💳", queue: "🔢", system: "🔔", feedback: "★",
};

export default function ClientNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => { load(); }, [user]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      await load();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.read) await notificationsApi.markRead(notification.id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
    navigate(notificationLink(notification, "client"));
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await notificationsApi.markAllRead();
      await load();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-4xl mb-4">🔔</p>
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => openNotification(n)}
              className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer
                ${n.read
                  ? "bg-gray-50 border-gray-100 opacity-60"
                  : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"}`}>
              <div className="text-xl shrink-0 mt-0.5">{typeIcon[n.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.read ? "text-gray-500" : "text-gray-900"}`}>{n.title}</p>
                  {!n.read && <span className="shrink-0 w-2 h-2 rounded-full bg-gray-900 mt-1.5" />}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${n.read ? "text-gray-400" : "text-gray-600"}`}>{n.message}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(n.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
