import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';

const typeIcon = {
  WELCOME:                   '👋',
  FUND_REQUEST_SUBMITTED:    '📋',
  FUND_REQUEST_APPROVED:     '✅',
  FUND_REQUEST_REJECTED:     '❌',
  FUND_REQUEST_REJECTED_EMERGENCY: '🚫',
  DONATION_RECEIVED:         '💰',
  GOAL_FULFILLED:            '🎉',
  GOAL_COMPLETED_BY_DONOR:   '🏆',
  ACCOUNT_VERIFIED:          '🛡️',
  ROLE_CHANGED:              '🔄',
  // Emergency events
  EMERGENCY_AUTO_APPROVED:   '🚨',
  EMERGENCY_ADMIN_ALERT:     '🔔',
  EMERGENCY_ACCESS_LOCKED:   '🔒',
  EMERGENCY_ACCESS_UNLOCKED: '🔓',
  DONATION_REMOVED:           '🗑️',
  REQUEST_FLAGGED:           '⚠️',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    notificationAPI.getAll()
      .then(res => setNotifications(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  const unread = notifications.filter(n => !n.read);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Notifications</h1>
          <p>{unread.length > 0 ? `${unread.length} unread` : 'All caught up!'}</p>
        </div>
        {unread.length > 0 && (
          <button className="btn-primary" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state"><p>No notifications yet.</p></div>
      ) : (
        <div className="card">
          {notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '14px 16px', borderBottom: '1px solid var(--color-border-tertiary)',
              background: n.read ? 'transparent' : 'rgba(55,138,221,0.05)',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
                {typeIcon[n.type] || '🔔'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: n.read ? '400' : '500' }}>
                  {n.message}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#378ADD', flexShrink: 0, marginTop: '7px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
