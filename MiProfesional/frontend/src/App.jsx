import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import { requestLocationPermissions } from './utils/geolocation';
import { isNativeAndroid } from './utils/platform';

// Layout
import Layout from './components/Layout';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServiceDetail from './pages/ServiceDetail';
import Search from './pages/Search';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TermsPage from './pages/TermsPage';
import EmpresasPage from './pages/EmpresasPage';
import CompanyDashboard from './pages/CompanyDashboard';

// Protected pages
import ClientDashboard from './pages/ClientDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentResult from './pages/PaymentResult';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import CVPage from './pages/CVPage';
import CVSearchPage from './pages/CVSearchPage';
import CandidateSearch from './pages/CandidateSearch';
import SubscriptionGuard from './components/SubscriptionGuard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading, initialized } = useAuth();
  const loc = useLocation();
  const renderCount = React.useRef(0);
  renderCount.current++;
  console.log(`[GUARD] ProtectedRoute — render #${renderCount.current} | path="${loc.pathname}" | init=${initialized} | load=${loading} | auth=${isAuthenticated} | role=${user?.role || 'none'}`);

  if (!initialized || loading) {
    console.log(`[GUARD] Waiting for init — render #${renderCount.current}`);
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log(`[GUARD] NOT authenticated — redirecting to /login (render #${renderCount.current})`);
    return <Navigate to="/login" />;
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (requiredRole && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    console.log(`[GUARD] Role mismatch — user.role=${user?.role}, required=${requiredRole} — redirecting to /`);
    return <Navigate to="/" />;
  }

  return children;
};

// App Component
function AppRoutes() {
  const loc = useLocation();
  const renderCount = React.useRef(0);
  renderCount.current++;
  console.log(`[RENDER] AppRoutes — render #${renderCount.current} | pathname="${loc.pathname}" | search="${loc.search}"`);
  React.useEffect(() => {
    console.log(`[NAV] AppRoutes — location changed → "${loc.pathname}${loc.search}" (render #${renderCount.current})`);
  }, [loc.pathname, loc.search]);
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/search" element={<Layout><Search /></Layout>} />
      <Route path="/service/:id" element={<Layout><ServiceDetail /></Layout>} />
      <Route path="/categoria/:slug" element={<Layout><CategoryPage /></Layout>} />
      <Route path="/categorias" element={<Layout><CategoriesPage /></Layout>} />
      <Route path="/profesionales/:slug" element={<Layout><CategoryPage /></Layout>} />
      <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
      <Route path="/empresas" element={<Layout><EmpresasPage /></Layout>} />

      {/* Client Routes */}
      <Route
        path="/dashboard/client"
        element={
          <ProtectedRoute requiredRole="client">
            <Layout><ClientDashboard /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Professional Routes */}
      <Route
        path="/dashboard/professional"
        element={
          <ProtectedRoute requiredRole="professional">
            <Layout><ProfessionalDashboard /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Company Routes */}
      <Route
        path="/dashboard/company"
        element={
          <ProtectedRoute requiredRole={['company', 'employer', 'admin']}>
            <Layout><CompanyDashboard /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Shared Protected Routes */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout><Messages /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:userId"
        element={
          <ProtectedRoute>
            <Layout><Chat /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv"
        element={
          <ProtectedRoute>
            <Layout><CVPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidatos"
        element={
          <ProtectedRoute requiredRole={['company', 'employer', 'admin']}>
            <Layout>
              <SubscriptionGuard>
                <CandidateSearch />
              </SubscriptionGuard>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cv-search"
        element={
          <ProtectedRoute requiredRole={['company', 'employer', 'admin']}>
            <Layout>
              <SubscriptionGuard>
                <CVSearchPage />
              </SubscriptionGuard>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <Layout><SubscriptionPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout><Notifications /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Payment pages (public, no auth required - MP redirects here) */}
      <Route path="/payment/success" element={<Layout><PaymentResult status="success" /></Layout>} />
      <Route path="/payment/failure" element={<Layout><PaymentResult status="failure" /></Layout>} />
      <Route path="/payment/pending" element={<Layout><PaymentResult status="pending" /></Layout>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  React.useEffect(() => {
    if (!isNativeAndroid()) return;

    const storageKey = 'miprofesional_android_location_permission_requested';
    if (localStorage.getItem(storageKey) === 'true') return;

    localStorage.setItem(storageKey, 'true');
    requestLocationPermissions().catch(() => {
      localStorage.removeItem(storageKey);
    });
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
