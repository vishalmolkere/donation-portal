import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { donationAPI, fundRequestAPI } from '../../services/api';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([donationAPI.getMy(), fundRequestAPI.getAll()])
      .then(([donRes, reqRes]) => {
        setDonations(donRes.data.data || []);
        setRequests((reqRes.data.data || []).slice(0, 4));
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalDonated = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Donor Dashboard</h1>
        <p>Welcome back, {user?.name}! Keep making a difference.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card green"><div className="stat-value">₹{totalDonated.toFixed(0)}</div><div className="stat-label">Total Donated</div></div>
        <div className="stat-card"><div className="stat-value">{donations.length}</div><div className="stat-label">Donations Made</div></div>
        <div className="stat-card"><div className="stat-value">{requests.length}</div><div className="stat-label">Open Requests</div></div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>My Recent Donations</h3><Link to="/donor/donations">View all</Link></div>
          {donations.length === 0 ? (
            <div className="empty-state"><p>You haven't donated yet.</p><Link to="/requests" className="btn-primary">Find a Cause</Link></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Receiver</th><th>Request</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>{donations.slice(0,5).map(d => (
                <tr key={d.id}>
                  <td>{d.receiverName}</td>
                  <td>{d.fundRequestTitle}</td>
                  <td className="amount">₹{parseFloat(d.amount).toFixed(2)}</td>
                  <td>{new Date(d.donatedAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="card-header"><h3>People Who Need Help</h3><Link to="/requests">View all</Link></div>
          {requests.map(r => (
            <div key={r.id} className="request-item" style={{ border: r.isEmergency ? '1px solid rgba(226,75,74,0.3)' : undefined, borderRadius: '8px', padding: r.isEmergency ? '8px' : '0' }}>
              <div className="request-meta">
                <strong>{r.isEmergency ? '🚨 ' : ''}{r.title}</strong>
                <span className="category-tag">{r.category}</span>
              </div>
              {r.isEmergency && (
                <div style={{ fontSize: '11px', color: '#A32D2D', margin: '2px 0 4px' }}>{r.emergencyReason}</div>
              )}
              <div className="request-receiver">by {r.receiverName}</div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: Math.min(r.progressPercent,100)+'%', background: r.isEmergency ? '#E24B4A' : undefined }}></div></div>
              <div className="request-footer">
                <span>₹{parseFloat(r.amountReceived).toFixed(0)} of ₹{parseFloat(r.amountNeeded).toFixed(0)}</span>
                <Link to={"/donate/" + r.id} className="btn-donate" style={{ background: r.isEmergency ? '#E24B4A' : undefined }}>
                  {r.isEmergency ? '🚨 Urgent' : 'Donate'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DonorDashboard;
