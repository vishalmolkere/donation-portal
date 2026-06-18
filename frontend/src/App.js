import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute, RoleRoute } from './components/common/PrivateRoute';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BrowseRequestsPage    from './pages/BrowseRequestsPage';
import FundRequestDetailPage from './pages/FundRequestDetailPage';
import DonatePage            from './pages/DonatePage';
import NotificationsPage     from './pages/NotificationsPage';
import DonationReceiptPage   from './pages/DonationReceiptPage';
import DonorDashboard        from './components/donor/DonorDashboard';
import MyDonations           from './components/donor/MyDonations';
import ReceiverDashboard     from './components/receiver/ReceiverDashboard';
import MyRequests            from './components/receiver/MyRequests';
import NewFundRequest        from './components/receiver/NewFundRequest';
import ReceiverDonationsPage from './pages/ReceiverDonationsPage';
import AdminDashboard        from './components/admin/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/"        element={<Navigate to="/requests" replace />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public */}
            <Route path="/requests"     element={<BrowseRequestsPage />} />
            <Route path="/requests/:id" element={<FundRequestDetailPage />} />

            {/* Authenticated */}
            <Route path="/donate/:requestId"    element={<RoleRoute roles={['ROLE_DONOR']}><DonatePage /></RoleRoute>} />
            <Route path="/notifications"        element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

            {/* Donor */}
            <Route path="/donor/dashboard"        element={<RoleRoute roles={['ROLE_DONOR']}><DonorDashboard /></RoleRoute>} />
            <Route path="/donor/donations"        element={<RoleRoute roles={['ROLE_DONOR']}><MyDonations /></RoleRoute>} />
            <Route path="/donor/donations/:id"   element={<RoleRoute roles={['ROLE_DONOR']}><DonationReceiptPage /></RoleRoute>} />

            {/* Receiver */}
            <Route path="/receiver/dashboard"    element={<RoleRoute roles={['ROLE_RECEIVER']}><ReceiverDashboard /></RoleRoute>} />
            <Route path="/receiver/requests"     element={<RoleRoute roles={['ROLE_RECEIVER']}><MyRequests /></RoleRoute>} />
            <Route path="/receiver/new-request"  element={<RoleRoute roles={['ROLE_RECEIVER']}><NewFundRequest /></RoleRoute>} />
            <Route path="/receiver/donations"    element={<RoleRoute roles={['ROLE_RECEIVER']}><ReceiverDonationsPage /></RoleRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
