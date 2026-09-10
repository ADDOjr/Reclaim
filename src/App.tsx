import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AppLayout from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import ReportItemPage from '@/pages/ReportItemPage';
import BrowsePage from '@/pages/BrowsePage';
import MatchesPage from '@/pages/MatchesPage';
import TrackingPage from '@/pages/TrackingPage';
import ItemDetailPage from '@/pages/ItemDetailPage';
import ClaimPage from '@/pages/ClaimPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminClaimsPage from '@/pages/admin/AdminClaimsPage';
import AdminItemsPage from '@/pages/admin/AdminItemsPage';
import InstallPrompt from '@/components/InstallPrompt';
import type { ReactNode } from 'react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const isRecoveryFlow = typeof window !== 'undefined' && (
    window.location.hash.includes('type=recovery') ||
    window.location.hash.includes('access_token') ||
    window.location.hash.includes('refresh_token')
  );

  if (loading) return <LoadingScreen />;
  if (session && !isRecoveryFlow) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
      <Route path="/app" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/report" element={<ProtectedRoute><AppLayout><ReportItemPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/browse" element={<ProtectedRoute><AppLayout><BrowsePage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/matches" element={<ProtectedRoute><AppLayout><MatchesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/track" element={<ProtectedRoute><AppLayout><TrackingPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/item/:id" element={<ProtectedRoute><AppLayout><ItemDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/item/:id/claim" element={<ProtectedRoute><AppLayout><ClaimPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/admin" element={<AdminRoute><AppLayout><AdminDashboardPage /></AppLayout></AdminRoute>} />
      <Route path="/app/admin/claims" element={<AdminRoute><AppLayout><AdminClaimsPage /></AppLayout></AdminRoute>} />
      <Route path="/app/admin/items" element={<AdminRoute><AppLayout><AdminItemsPage /></AppLayout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppRoutes />
            <InstallPrompt />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
