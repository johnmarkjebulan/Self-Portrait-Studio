import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationLink } from "../../utils/notificationLink";
import { notificationsApi } from "../../services/api.js";
import { useToast } from "../../contexts/ToastContext";

const TYPE_ICONS = {
  booking: "📋",
  payment: "💳",
  queue: "🔢",
  system: "🔔",
  feedback: "★",
};

const TYPE_COLORS = {
  booking: "bg-blue-50 border-blue-200",
  payment: "bg-emerald-50 border-emerald-200",
  queue: "bg-purple-50 border-purple-200",
  system: "bg-amber-50 border-amber-200",
  feedback: "bg-pink-50 border-pink-200",
};

export default function Notifications() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (err) {
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(id) {
    setActionLoading(true);
    try {
      await notificationsApi.markRead(id);
      await load();
    } catch (err) {
      showToast("Failed to mark as read", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function openNotification(notification) {
    try {
      if (!notification.read) await notificationsApi.markRead(notification.id);
    } catch (err) {
      showToast(err.message || "Failed to update notification", "error");
    }
    navigate(notificationLink(notification, "admin"));
  }

  async function handleMarkAllRead() {
    setActionLoading(true);
    try {
      await notificationsApi.markAllRead();
      await load();
    } catch (err) {
      showToast("Failed to mark all as read", "error");
    } finally {
      setActionLoading(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No notifications
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const type = n.type || "system";
            const icon = TYPE_ICONS[type] || TYPE_ICONS.system;
            const colorClass =
              TYPE_COLORS[type] || TYPE_COLORS.system;
            return (
              <div
                key={n.id}
                onClick={() => openNotification(n)}
                className={`border rounded-xl p-4 flex gap-3 sm:gap-4 items-start cursor-pointer transition-opacity ${colorClass} ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <span className="text-2xl leading-none mt-0.5 flex-shrink-0">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">
                    {n.title || "Notification"}
                  </div>
                  <div className="text-gray-600 text-sm mt-0.5">
                    {n.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString()
                      : ""}
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                    disabled={actionLoading}
                    className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
