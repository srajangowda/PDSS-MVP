import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChildrenListPage } from './pages/ChildrenListPage';
import { ChildDetailPage } from './pages/ChildDetailPage';
import { ScreeningPage } from './pages/ScreeningPage';
import { ScreeningResultPage } from './pages/ScreeningResultPage';
import { SpecialistDirectoryPage } from './pages/SpecialistDirectoryPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { SpecialistDashboardPage } from './pages/SpecialistDashboardPage';
import { FollowupsPage } from './pages/FollowupsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-teal-100 selection:text-teal-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <ChildrenListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/children/:id"
            element={
              <ProtectedRoute>
                <ChildDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/screening/:childId"
            element={
              <ProtectedRoute>
                <ScreeningPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/screening/:id/result"
            element={
              <ProtectedRoute>
                <ScreeningResultPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/specialists"
            element={
              <ProtectedRoute>
                <SpecialistDirectoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/followups"
            element={
              <ProtectedRoute>
                <FollowupsPage />
              </ProtectedRoute>
            }
          />

          {/* Specialist Hub */}
          <Route
            path="/specialist/dashboard"
            element={
              <ProtectedRoute allowedRoles={['specialist', 'admin']}>
                <SpecialistDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

