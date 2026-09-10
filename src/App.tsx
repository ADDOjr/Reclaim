import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import AppLayout from '@/components/AppLayout';
import InstallPrompt from '@/components/InstallPrompt';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ReportItemPage = lazy(() => import('@/pages/ReportItemPage'));
const BrowsePage = lazy(() => import('@/pages/BrowsePage'));
const MatchesPage = lazy(() => import('@/pages/MatchesPage'));
const TrackingPage = lazy(() => import('@/pages/TrackingPage'));
const ItemDetailPage = lazy(() => import('@/pages/ItemDetailPage'));
const ClaimPage = lazy(() => import('@/pages/ClaimPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminClaimsPage = lazy(() => import('@/pages/admin/AdminClaimsPage'));
const AdminItemsPage = lazy(() => import('@/pages/admin/AdminItemsPage'));

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
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
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
