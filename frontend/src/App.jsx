import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Public pages
import HomePage from './pages/public/HomePage';
import SignUpPage from './pages/public/SignUp';
import LoginPage from './pages/public/Login';
import ForgotPasswordPage from './pages/public/ForgotPassword';
import ResetPasswordPage from './pages/public/ResetPassword';
import Marketplace from './pages/public/Marketplace';
import VehicleDetails from './pages/public/VehicleDetails';
import TripTemplates from './pages/public/TripTemplates';
import TripTemplateDetail from './pages/public/TripTemplateDetail';
import Community from './pages/public/Community';
import PostDetail from './pages/public/PostDetail';

// Tourist pages
import TouristDashboard from './pages/tourist/TouristDashboard';
import MyBookings from './pages/tourist/MyBookings';
import ChatPage from './pages/tourist/ChatPage';

// Vendor pages
import VendorPending from './pages/vendor/VendorPending';
import VendorDashboard from './pages/vendor/VendorDashboard';
import AddVehicle from './pages/vendor/AddVehicle';
import MyListings from './pages/vendor/MyListings';
import EditVehicle from './pages/vendor/EditVehicle';
import VendorBookings from './pages/vendor/MyBookings';

// Profile pages (all authenticated roles)
import UserProfile from './pages/profile/UserProfile';
import EditProfile from './pages/profile/EditProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVehicles from './pages/admin/AdminVehicles';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCommunity from './pages/admin/AdminCommunity';

import './App.css';

// Guard: only staff users may access /admin/* routes
const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user || !user.is_staff) return <Navigate to="/login" replace />;
    return children;
};

// Guard: logged-in users should not access login/signup again.
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return children;

  if (user.is_staff) return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'vendor') {
    return <Navigate to={user.is_vendor_approved ? '/vendor/dashboard' : '/vendor/pending'} replace />;
  }
  if (user.role === 'tourist') return <Navigate to="/tourist/dashboard" replace />;

  return <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/get-started" element={<GuestRoute><SignUpPage /></GuestRoute>} />
        <Route path="/trips" element={<TripTemplates />} />
        <Route path="/trips/:slug" element={<TripTemplateDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/vehicle/:id" element={<VehicleDetails />} />

        {/* Protected Routes - Any authenticated user */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Tourist Only */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tourist/dashboard"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <TouristDashboard />
            </ProtectedRoute>
          }
        />


        {/* Protected Routes - Vendor Only */}
        <Route
          path="/vendor/pending"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorPending />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/add-vehicle"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <AddVehicle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/edit-vehicle/:id"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <EditVehicle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/listings"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/bookings"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorBookings />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={<AdminRoute><AdminDashboard /></AdminRoute>}
        />
        <Route
          path="/admin/users"
          element={<AdminRoute><AdminUsers /></AdminRoute>}
        />
        <Route
          path="/admin/vehicles"
          element={<AdminRoute><AdminVehicles /></AdminRoute>}
        />
        <Route
          path="/admin/bookings"
          element={<AdminRoute><AdminBookings /></AdminRoute>}
        />
        <Route
          path="/admin/community"
          element={<AdminRoute><AdminCommunity /></AdminRoute>}
        />
        {/* Redirect /admin → /admin/dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router >
  );
}

export default App;