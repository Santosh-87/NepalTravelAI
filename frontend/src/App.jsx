import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';
import VendorPending from './pages/VendorPending';
import VendorDashboard from './pages/vendor/VendorDashboard';
import AddVehicle from './pages/vendor/AddVehicle';
import MyListings from './pages/vendor/MyListings';
import EditVehicle from './pages/vendor/EditVehicle';
import VendorBookings from './pages/vendor/MyBookings';
import Marketplace from './pages/Marketplace';
import VehicleDetails from './pages/VehicleDetails';
import MyBookings from './pages/MyBookings';
import TouristDashboard from './pages/TouristDashboard';
import TripTemplates from './pages/TripTemplates';
import TripTemplateDetail from './pages/TripTemplateDetail';
import Community from './pages/Community';
import PostDetail from './pages/PostDetail';

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

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get-started" element={<SignUpPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/add-vehicle" element={<AddVehicle />} />
        <Route path="/vendor/edit-vehicle/:id" element={<EditVehicle />} />
        <Route path="/vendor/listings" element={<MyListings />} />
        <Route path="/vendor/bookings" element={<VendorBookings />} />
        <Route path="/trips" element={<TripTemplates />} />
        <Route path="/trips/:slug" element={<TripTemplateDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/vehicle/:id" element={<VehicleDetails />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/tourist/dashboard" element={<TouristDashboard />} />
        {/* Protected Routes - Tourist Only */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <ChatPage />
              <MyBookings />
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
              <VendorBookings />
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