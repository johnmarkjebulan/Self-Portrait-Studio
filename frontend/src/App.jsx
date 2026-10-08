import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

import PublicLayout from "./components/layout/PublicLayout";
import ClientLayout from "./components/layout/ClientLayout";
import AdminLayout from "./components/layout/AdminLayout";
import StaffLayout from "./components/layout/StaffLayout";

import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import ClientDashboard from "./pages/client/Dashboard";
import Book from "./pages/client/Book";
import ClientAppointments from "./pages/client/Appointments";
import ClientBookings from "./pages/client/Bookings";
import ClientPayments from "./pages/client/Payments";
import ClientNotifications from "./pages/client/Notifications";
import ClientFeedback from "./pages/client/Feedback";
import ClientProfile from "./pages/client/Profile";
import ClientPosts from "./pages/client/Posts";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminAppointments from "./pages/admin/Appointments";
import AdminQueue from "./pages/admin/Queue";
import AdminClients from "./pages/admin/Clients";
import AdminPackages from "./pages/admin/Packages";
import AdminSchedules from "./pages/admin/Schedules";
import AdminPayments from "./pages/admin/Payments";
import AdminNotifications from "./pages/admin/Notifications";
import AdminFeedback from "./pages/admin/Feedback";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminReports from "./pages/admin/Reports";
import AdminActivityLogs from "./pages/admin/ActivityLogs";
import AdminSettings from "./pages/admin/Settings";
import AdminScanner from "./pages/admin/Scanner";
import AdminPosts from "./pages/admin/Posts";
import AdminStaff from "./pages/admin/Staff";

import StaffDashboard from "./pages/staff/Dashboard";
import StaffAppointments from "./pages/staff/Appointments";
import StaffClients from "./pages/staff/Clients";
import StaffPosts from "./pages/staff/Posts";
import StaffFeedback from "./pages/staff/Feedback";

export default function App() {
  return <BrowserRouter><ErrorBoundary><AuthProvider><ToastProvider><Routes>
    <Route element={<PublicLayout />}><Route path="/" element={<Landing />} /><Route path="/packages" element={<Landing />} /></Route>
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />

    <Route element={<ClientLayout />}>
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/client/posts" element={<ClientPosts />} />
      <Route path="/client/book" element={<Book />} />
      <Route path="/client/appointments" element={<ClientAppointments />} />
      <Route path="/client/bookings" element={<ClientBookings />} />
      <Route path="/client/payments" element={<ClientPayments />} />
      <Route path="/client/notifications" element={<ClientNotifications />} />
      <Route path="/client/feedback" element={<ClientFeedback />} />
      <Route path="/client/profile" element={<ClientProfile />} />
    </Route>

    <Route element={<AdminLayout />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/posts" element={<AdminPosts />} />
      <Route path="/admin/staff" element={<AdminStaff />} />
      <Route path="/admin/appointments" element={<AdminAppointments />} />
      <Route path="/admin/queue" element={<AdminQueue />} />
      <Route path="/admin/clients" element={<AdminClients />} />
      <Route path="/admin/packages" element={<AdminPackages />} />
      <Route path="/admin/schedules" element={<AdminSchedules />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />
      <Route path="/admin/feedback" element={<AdminFeedback />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
      <Route path="/admin/scanner" element={<AdminScanner />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Route>

    <Route element={<StaffLayout />}>
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/staff/appointments" element={<StaffAppointments />} />
      <Route path="/staff/clients" element={<StaffClients />} />
      <Route path="/staff/posts" element={<StaffPosts />} />
      <Route path="/staff/feedback" element={<StaffFeedback />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></ToastProvider></AuthProvider></ErrorBoundary></BrowserRouter>;
}
