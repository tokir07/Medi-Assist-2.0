import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleRoute } from './routes/RoleRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { AccessDenied } from './pages/AccessDenied';
import { PatientDashboard } from './pages/PatientDashboard';
import { AppLayout } from './components/layout/AppLayout';

// Lazy Loaded Pages for Code Splitting & Reduced Initial Bundle Size
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const VoiceAssistantPage = lazy(() => import('./pages/VoiceAssistantPage').then(m => ({ default: m.VoiceAssistantPage })));
const MyRecordsPage = lazy(() => import('./pages/MyRecordsPage').then(m => ({ default: m.MyRecordsPage })));
const PrescriptionsPage = lazy(() => import('./pages/PrescriptionsPage').then(m => ({ default: m.PrescriptionsPage })));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const HealthTipsPage = lazy(() => import('./pages/HealthTipsPage').then(m => ({ default: m.HealthTipsPage })));
const RemindersPage = lazy(() => import('./pages/RemindersPage').then(m => ({ default: m.RemindersPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PatientOnboardingPage = lazy(() => import('./pages/PatientOnboardingPage').then(m => ({ default: m.PatientOnboardingPage })));
const DashboardPlaceholder = lazy(() => import('./pages/DashboardPlaceholder').then(m => ({ default: m.DashboardPlaceholder })));

// Admin Portal Components
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminDoctorsPage = lazy(() => import('./pages/admin/AdminDoctorsPage').then(m => ({ default: m.AdminDoctorsPage })));
const AdminPatientsPage = lazy(() => import('./pages/admin/AdminPatientsPage').then(m => ({ default: m.AdminPatientsPage })));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })));
const AdminAppointmentsPage = lazy(() => import('./pages/admin/AdminAppointmentsPage').then(m => ({ default: m.AdminAppointmentsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

// Doctor Portal Components
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const DoctorAppointmentsPage = lazy(() => import('./pages/doctor/DoctorAppointmentsPage').then(m => ({ default: m.DoctorAppointmentsPage })));
const DoctorPatientsPage = lazy(() => import('./pages/doctor/DoctorPatientsPage').then(m => ({ default: m.DoctorPatientsPage })));
const DoctorPatientProfilePage = lazy(() => import('./pages/doctor/DoctorPatientProfilePage').then(m => ({ default: m.DoctorPatientProfilePage })));
const DoctorConsultationPage = lazy(() => import('./pages/doctor/DoctorConsultationPage').then(m => ({ default: m.DoctorConsultationPage })));
const DoctorPrescriptionsPage = lazy(() => import('./pages/doctor/DoctorPrescriptionsPage').then(m => ({ default: m.DoctorPrescriptionsPage })));
const DoctorMessagesPage = lazy(() => import('./pages/doctor/DoctorMessagesPage').then(m => ({ default: m.DoctorMessagesPage })));
const DoctorNotificationsPage = lazy(() => import('./pages/doctor/DoctorNotificationsPage').then(m => ({ default: m.DoctorNotificationsPage })));
const DoctorProfilePage = lazy(() => import('./pages/doctor/DoctorProfilePage').then(m => ({ default: m.DoctorProfilePage })));
const DoctorSettingsPage = lazy(() => import('./pages/doctor/DoctorSettingsPage').then(m => ({ default: m.DoctorSettingsPage })));

// Root redirect handler based on active authentication state
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'PATIENT') return <Navigate to="/patient" replace />;
  if (role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
};

export const AppContent: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-xs font-semibold text-slate-500">Loading MediAssist...</span>
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Root & Dashboard Redirect */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/dashboard" element={<RootRedirect />} />

      {/* Patient AI Assistant Route */}
      <Route
        path="/patient/consultation"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <AIAssistantPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/patient/ai"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <AIAssistantPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Voice Assistant Route */}
      <Route
        path="/patient/voice"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <VoiceAssistantPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient My Records Route */}
      <Route
        path="/patient/records"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <MyRecordsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/patient/records/:id"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <MyRecordsPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Prescriptions Route */}
      <Route
        path="/patient/prescriptions"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <PrescriptionsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/patient/prescriptions/:id"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <PrescriptionsPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Appointments Route */}
      <Route
        path="/patient/appointments"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <AppointmentsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/patient/appointments/:id"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <AppointmentsPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Health Tips Route */}
      <Route
        path="/patient/tips"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <HealthTipsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/patient/health-tips"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <HealthTipsPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Reminders Route */}
      <Route
        path="/patient/reminders"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <RemindersPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Profile Route */}
      <Route
        path="/patient/profile"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Settings Route */}
      <Route
        path="/patient/settings"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Patient Onboarding Route */}
      <Route
        path="/patient/onboarding"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <PatientOnboardingPage />
          </RoleRoute>
        }
      />

      {/* Patient Default / Fallback Routes */}
      <Route
        path="/patient"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <PatientDashboard />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/patient/*"
        element={
          <RoleRoute allowedRoles={['PATIENT']}>
            <AppLayout>
              <PatientDashboard />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Doctor Protected Routes */}
      <Route
        path="/doctor"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorDashboard />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorAppointmentsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/patients"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorPatientsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/patients/:patientId"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorPatientProfilePage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/records"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorPatientsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/consultation/:appointmentId"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorConsultationPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/prescriptions"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorPrescriptionsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/messages"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorMessagesPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/notifications"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorNotificationsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorProfilePage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/settings"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorSettingsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/*"
        element={
          <RoleRoute allowedRoles={['DOCTOR']}>
            <AppLayout>
              <DoctorDashboard />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* ============================================================ */}
      {/* Admin Portal Role-Protected Routes (ADMIN role required)     */}
      {/* ============================================================ */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminDashboardPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminDoctorsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminPatientsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminNotificationsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminAppointmentsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminAuditLogsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminAuditLogsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminSettingsPage />
            </AppLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <AdminDashboardPage />
            </AppLayout>
          </RoleRoute>
        }
      />

      {/* Catch-all 404/Fallback redirect */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
    </Suspense>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
