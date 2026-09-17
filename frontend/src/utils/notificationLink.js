export function notificationLink(notification, role = "client") {
  if (!notification) return role === "admin" ? "/admin/notifications" : "/client/notifications";
  const admin = role === "admin";
  switch (notification.related_type) {
    case "payment": return admin ? "/admin/payments" : "/client/payments";
    case "feedback": return admin ? "/admin/feedback" : "/client/feedback";
    case "appointment": return admin ? "/admin/appointments" : "/client/bookings";
    default:
      if (notification.type === "queue") return admin ? "/admin/queue" : "/client/bookings";
      if (notification.type === "payment") return admin ? "/admin/payments" : "/client/payments";
      if (notification.type === "feedback") return admin ? "/admin/feedback" : "/client/feedback";
      return admin ? "/admin/notifications" : "/client/notifications";
  }
}
