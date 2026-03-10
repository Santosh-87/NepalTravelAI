import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import SignUpPage from './pages/SignUp';
import LoginPage from './pages/Login';
import VendorPending from './pages/VendorPending';
import ProtectedRoute from './components/ProtectedRoute';
import VendorDashboard from './pages/vendor/VendorDashboard';
import './App.css';

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

        {/* Protected Routes - Tourist Only */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['tourist']}>
              <ChatPage />
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
      </Routes>
    </Router>
  );
}

export default App;