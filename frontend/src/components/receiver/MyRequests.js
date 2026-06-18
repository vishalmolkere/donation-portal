import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fundRequestAPI } from '../../services/api';

const statusColor = { PENDING:'pending', APPROVED:'approved', REJECTED:'rejected', FULFILLED:'completed' };

const MyRequests = () => {
  const { isVerified } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fundRequestAPI.getMy()
      .then(res => setRequests(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await fundRequestAPI.delete(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete request.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Fund Requests</h1>
        {/* FIX: guard New Request button on verification status */}
        {isVerified()
          ? <Link to="/receiver/new-request" className="btn-primary">+ New Request</Link>
          : <span style={{ fontSize:'13px', color:'#A32D2D', background:'#FCEBEB', padding:'7px 14px', borderRadius:'8px' }}>
              ⚠️ Account not verified — cannot submit requests
            </span>
        }
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No requests yet.</p>
          {isVerified() && <Link to="/receiver/new-request" className="btn-primary">Submit First Request</Link>}
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(r => (
            <div key={r.id} className="card request-row">
              <div className="request-row-header">
                <div>
                  <h3>{r.isEmergency && '🚨 '}{r.title}</h3>
                  <span className="category-tag">{r.category}</span>
                  {r.isEmergency && (
                    <span style={{ fontSize:'11px', background:'#FCEBEB', color:'#A32D2D', padding:'2px 8px', borderRadius:'4px', marginLeft:'6px' }}>
                      Emergency
                    </span>
                  )}
                </div>
                <span className={'status-chip ' + (statusColor[r.status] || 'pending')}>{r.status}</span>
              </div>
              <p className="request-desc">{r.description?.substring(0, 150)}...</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: Math.min(r.progressPercent, 100) + '%' }} />
              </div>
              <div className="request-row-footer">
                <span>₹{parseFloat(r.amountReceived).toFixed(0)} / ₹{parseFloat(r.amountNeeded).toFixed(0)} · {r.donationCount} donor{r.donationCount !== 1 ? 's' : ''}</span>
                {r.adminNote && <span className="admin-note-inline">Admin: "{r.adminNote}"</span>}
                {r.isFlagged  && <span style={{ fontSize:'11px', color:'#854F0B' }}>⚠️ Flagged for review</span>}
                {r.status === 'PENDING' && (
                  <button onClick={() => handleDelete(r.id)} className="btn-danger-sm">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
