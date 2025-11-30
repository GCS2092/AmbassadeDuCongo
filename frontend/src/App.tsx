import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Onboarding from './components/Onboarding'
import Chatbot from './components/Chatbot'
import ErrorBoundary from './components/ErrorBoundary'
import { getDefaultRoute, UserRole } from './lib/permissions'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import DashboardPage from './pages/DashboardPage'
import DocumentRemindersPage from './pages/DocumentRemindersPage'
import AppointmentsPage from './pages/AppointmentsPage'
import AppointmentBookingPage from './pages/AppointmentBookingPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ApplicationCreatePage from './pages/ApplicationCreatePage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ProfilePage from './pages/ProfilePage'
import DigitalIdentityPage from './pages/DigitalIdentityPage'
import DocumentsGalleryPage from './pages/DocumentsGalleryPage'
import PaymentPage from './pages/PaymentPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import FAQPage from './pages/FAQPage'
import NotFoundPage from './pages/NotFoundPage'
import SecurityQRScannerPage from './pages/SecurityQRScannerPage'
import VigileTodayPage from './pages/VigileTodayPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminAccessLogPage from './pages/AdminAccessLogPage'
import AdminApplicationsPage from './pages/AdminApplicationsPage'
import AdminApplicationDetailPage from './pages/AdminApplicationDetailPage'
import AdminSiteSettingsPage from './pages/AdminSiteSettingsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage'
import VigileDashboardPage from './pages/VigileDashboardPage'
import MyQRCodePage from './pages/MyQRCodePage'
import NotificationsPage from './pages/NotificationsPage'
import InactiveAccountPage from './pages/InactiveAccountPage'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '400px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0'
              }
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca'
              }
            },
            loading: {
              style: {
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0'
              }
            }
          }}
        />
        
        {/* Onboarding pour nouveaux utilisateurs */}
        {isAuthenticated && <Onboarding />}
        
        {/* Chatbot disponible partout */}
        <Chatbot />
        
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={isAuthenticated && user?.role && !['CITIZEN'].includes(user.role) ? (
            <Navigate to={getDefaultRoute(user?.role as UserRole)} replace />
          ) : <HomePage />} />
          <Route path="login" element={isAuthenticated ? (
            <Navigate to={getDefaultRoute(user?.role as UserRole)} replace />
          ) : <LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<EmailVerificationPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          
                 {/* Protected routes */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="inactive-account" element={<InactiveAccountPage />} />
                          <Route path="dashboard" element={<DashboardPage />} />
                          <Route path="reminders" element={<DocumentRemindersPage />} />
                          <Route path="appointments" element={<AppointmentsPage />} />
                          <Route path="appointments/book" element={<AppointmentBookingPage />} />
                          <Route path="applications" element={<ApplicationsPage />} />
                          <Route path="applications/new" element={<ApplicationCreatePage />} />
                          <Route path="applications/:id" element={<ApplicationDetailPage />} />
                          <Route path="payments/create/:applicationId" element={<PaymentPage />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="identity" element={<DigitalIdentityPage />} />
                          <Route path="digital-identity" element={<DigitalIdentityPage />} />
                          <Route path="documents" element={<DocumentsGalleryPage />} />
                          <Route path="my-qr-code" element={<MyQRCodePage />} />
                          <Route path="notifications" element={<NotificationsPage />} />
                          
                          {/* Routes Admin et Sécurité */}
                          <Route path="admin" element={<AdminDashboardPage />} />
                          <Route path="admin/users" element={<AdminUsersPage />} />
                          <Route path="admin/applications" element={<AdminApplicationsPage />} />
                          <Route path="admin/applications/:id" element={<AdminApplicationDetailPage />} />
                          <Route path="admin/access-logs" element={<AdminAccessLogPage />} />
                          <Route path="admin/site-settings" element={<AdminSiteSettingsPage />} />
                          <Route path="admin/announcements" element={<AdminAnnouncementsPage />} />
                          <Route path="security/scanner" element={<SecurityQRScannerPage />} />
                          <Route path="security/today" element={<VigileTodayPage />} />
                          <Route path="vigile" element={<VigileDashboardPage />} />
                        </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
    </ErrorBoundary>
  )
}

export default App
