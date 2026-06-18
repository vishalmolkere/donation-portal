import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';

const Navbar = () => {
  const { user, logout, isAdmin, isDonor, isReceiver, isAuthenticated, getRoleLabel } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(() => {
    if (!isAuthenticated()) return;
    notificationAPI.countUnread()
      .then(res => setUnreadCount(res.data.data || 0))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnread();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    navigate('/login');
  };

  const roleClass = isAdmin() ? 'admin' : isReceiver() ? 'receiver' : 'donor';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">💚 DonationPortal</Link>
      </div>
      <div className="nav-links">
        <Link to="/requests">Browse Requests</Link>
        {isAuthenticated() ? (
          <>
            {isDonor()    && <Link to="/donor/dashboard">My Dashboard</Link>}
            {isDonor()    && <Link to="/donor/donations">My Donations</Link>}
            {isReceiver() && <Link to="/receiver/dashboard">My Dashboard</Link>}
            {isReceiver() && <Link to="/receiver/requests">My Requests</Link>}
            {isReceiver() && <Link to="/receiver/donations">Donations Received</Link>}
            {isAdmin()    && <Link to="/admin">Admin Panel</Link>}

            {/* Notification bell with unread badge */}
            <Link to="/notifications" className="nav-bell" title="Notifications" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px',
                  background: '#E24B4A', color: '#fff', fontSize: '10px',
                  fontWeight: '600', borderRadius: '10px', padding: '1px 5px',
                  minWidth: '16px', textAlign: 'center', lineHeight: '16px'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="nav-user">
              <span className="nav-name">{user?.name}</span>
              <span className={'role-chip ' + roleClass}>{getRoleLabel()}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login"    className="btn-nav">Login</Link>
            <Link to="/register" className="btn-nav primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
