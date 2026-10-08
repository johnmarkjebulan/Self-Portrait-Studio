export function notificationLink(notification, role = "client") {
  const prefix = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/client";
  if (!notification) return `${prefix}/dashboard`;

  if (role === "staff") {
    if (notification.related_type === "feedback" || notification.type === "feedback") return "/staff/feedback";
    if (notification.related_type === "appointment" || ["booking", "queue"].includes(notification.type)) return "/staff/appointments";
    return "/staff/dashboard";
  }

  const admin = role === "admin";
  switch (notification.related_type) {
    case "payment": return admin ? "/admin/payments" : "/client/payments";
    case "feedback": return admin ? "/admin/feedback" : "/client/feedback";
    case "appointment": return admin ? "/admin/appointments" : "/client/bookings";
    default:
      if (notification.type === "queue") return admin ? "/admin/queue" : "/client/bookings";
      if (notification.type === "payment") return admin ? "/admin/payments" : "/client/payments";
      if (notification.type === "feedback") return admin ? "/admin/feedback" : "/client/feedback";
      return admin ? "/admin/dashboard" : "/client/dashboard";
  }
}
