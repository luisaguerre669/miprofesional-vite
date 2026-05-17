import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

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

// Protected pages
import ClientDashboard from './pages/ClientDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import SubscriptionPage from './pages/SubscriptionPage';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

// App Component
function AppRoutes() {
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

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
