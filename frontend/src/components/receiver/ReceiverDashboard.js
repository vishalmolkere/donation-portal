import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fundRequestAPI, donationAPI, userAPI } from '../../services/api';

const ReceiverDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [requests,  setRequests]  = useState([]);
  const [donations, setDonations] = useState([]);
  const [verified,  setVerified]  = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([fundRequestAPI.getMy(), donationAPI.getReceived(), userAPI.getMe()])
      .then(([reqRes, donRes, meRes]) => {
        setRequests(reqRes.data.data || []);
        setDonations((donRes.data.data || []).slice(0, 5));
        const me = meRes.data.data;
        setVerified(!!me.isVerified);
        // FIX: sync fresh server state into AuthContext so guards update without re-login
        refreshUser({ isVerified: me.isVerified, emergencyLocked: me.emergencyLocked });
      }).catch(console.error).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalReceived = requests.reduce((s, r) => s + parseFloat(r.amountReceived || 0), 0);
  const approved = requests.filter(r => r.status === 'APPROVED').length;
  const pending  = requests.filter(r => r.status === 'PENDING').length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Receiver Dashboard</h1>
        <p>Hello {user?.name}, here's a summary of your requests.</p>
      </div>

      {/* FIX: show verification warning based on fresh server data, not stale localStorage */}
      {!verified && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong>Account not yet verified</strong>
            <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
              An admin must verify your account before you can submit fund requests.
              Please wait 24–48 hours or contact support.
            </p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card green"><div className="stat-value">₹{totalReceived.toFixed(0)}</div><div className="stat-label">Total Received</div></div>
        <div className="stat-card"><div className="stat-value">{approved}</div><div className="stat-label">Approved Requests</div></div>
        <div className="stat-card amber"><div className="stat-value">{pending}</div><div className="stat-label">Pending Approval</div></div>
      </div>

      <div className="info-banner">
        <span>💡</span>
        <span>New requests need admin approval before donors can see them. Usually 24–48 hours.</span>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>My Fund Requests</h3>
            <Link to="/receiver/requests">View all</Link>
          </div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No requests yet.</p>
              {verified
                ? <Link to="/receiver/new-request" className="btn-primary">Submit a Request</Link>
                : <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verification required before submitting.</p>
              }
            </div>
          ) : (
            requests.slice(0, 4).map(r => (
              <div key={r.id} className="request-item">
                <div className="request-meta">
                  <strong>{r.isEmergency ? '🚨 ' : ''}{r.title}</strong>
                  <span className={'status-chip ' + r.status.toLowerCase()}>{r.status}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: Math.min(r.progressPercent, 100) + '%' }} />
                </div>
                <div className="request-footer">
                  <span>₹{parseFloat(r.amountReceived).toFixed(0)} / ₹{parseFloat(r.amountNeeded).toFixed(0)}</span>
                  <span className="progress-label">{r.progressPercent.toFixed(1)}%</span>
                </div>
                {r.adminNote && <div className="admin-note">Admin: {r.adminNote}</div>}
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Donations Received</h3></div>
          {donations.length === 0 ? (
            <div className="empty-state"><p>No donations received yet.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Donor</th><th>Request</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>{donations.map(d => (
                <tr key={d.id}>
                  <td>{d.donorName}</td>
                  <td>{d.fundRequestTitle}</td>
                  <td className="amount">₹{parseFloat(d.amount).toFixed(2)}</td>
                  <td>{new Date(d.donatedAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>

      {verified && (
        <div className="action-row">
          <Link to="/receiver/new-request" className="btn-primary">+ Submit New Fund Request</Link>
        </div>
      )}
    </div>
  );
};

export default ReceiverDashboard;
