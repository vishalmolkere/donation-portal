import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fundRequestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FundRequestDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, isDonor } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fundRequestAPI.getById(id)
      .then(res => setRequest(res.data.data))
      .catch(() => setError('Request not found or not yet approved.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!request) return null;

  const pct = Math.min(request.progressPercent, 100).toFixed(1);

  return (
    <div className="page-container" style={{ maxWidth:'720px', margin:'0 auto' }}>

      {request.isEmergency && (
        <div style={{ background:'rgba(226,75,74,0.08)', border:'1px solid rgba(226,75,74,0.25)',
          borderRadius:'10px', padding:'12px 18px', marginBottom:'1.5rem', display:'flex', gap:'10px' }}>
          <span style={{ fontSize:'22px' }}>🚨</span>
          <div>
            <div style={{ fontWeight:'500', color:'#A32D2D', fontSize:'14px' }}>Emergency Request</div>
            <div style={{ fontSize:'13px', color:'#854F0B', marginTop:'2px' }}>{request.emergencyReason}</div>
          </div>
        </div>
      )}

      {request.isFlagged && (
        <div style={{ background:'#FAEEDA', border:'1px solid rgba(186,117,23,0.3)',
          borderRadius:'10px', padding:'10px 16px', marginBottom:'1rem', fontSize:'13px', color:'#854F0B' }}>
          ⚠️ This request is currently under admin review.
        </div>
      )}

      <div className="card" style={{ padding:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
          <div>
            <span style={{ fontSize:'12px', background:'var(--color-background-secondary)',
              color:'var(--color-text-secondary)', padding:'3px 10px', borderRadius:'12px' }}>
              {request.category}
            </span>
            <h1 style={{ fontSize:'22px', fontWeight:'500', margin:'8px 0 4px' }}>{request.title}</h1>
            <p style={{ fontSize:'13px', color:'var(--color-text-secondary)' }}>
              By <strong>{request.receiverName}</strong> · Submitted {new Date(request.createdAt).toLocaleDateString()}
              {request.approvedAt && ` · Approved ${new Date(request.approvedAt).toLocaleDateString()}`}
            </p>
          </div>
          <span className={'status-chip ' + request.status.toLowerCase()}>{request.status}</span>
        </div>

        <p style={{ fontSize:'15px', lineHeight:'1.8', color:'var(--color-text-primary)', margin:'0 0 24px' }}>
          {request.description}
        </p>

        <div style={{ background:'var(--color-background-secondary)', borderRadius:'10px', padding:'16px', marginBottom:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'8px' }}>
            <span style={{ color:'var(--color-text-secondary)' }}>Progress</span>
            <span style={{ fontWeight:'500' }}>{pct}%</span>
          </div>
          <div style={{ height:'8px', background:'var(--color-border-tertiary)', borderRadius:'4px', overflow:'hidden', marginBottom:'10px' }}>
            <div style={{ width: pct + '%', height:'100%', background: request.isEmergency ? '#E24B4A' : '#1D9E75', borderRadius:'4px' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', textAlign:'center' }}>
            <div>
              <div style={{ fontSize:'18px', fontWeight:'500', color:'#1D9E75' }}>₹{parseFloat(request.amountReceived).toLocaleString()}</div>
              <div style={{ fontSize:'11px', color:'var(--color-text-secondary)' }}>Raised</div>
            </div>
            <div>
              <div style={{ fontSize:'18px', fontWeight:'500' }}>₹{parseFloat(request.amountNeeded).toLocaleString()}</div>
              <div style={{ fontSize:'11px', color:'var(--color-text-secondary)' }}>Goal</div>
            </div>
            <div>
              <div style={{ fontSize:'18px', fontWeight:'500' }}>{request.donationCount}</div>
              <div style={{ fontSize:'11px', color:'var(--color-text-secondary)' }}>Donors</div>
            </div>
          </div>
        </div>

        {request.adminNote && (
          <div style={{ fontSize:'13px', color:'var(--color-text-secondary)', padding:'10px 14px',
            background:'var(--color-background-secondary)', borderRadius:'8px', marginBottom:'16px' }}>
            <strong>Admin note:</strong> {request.adminNote}
          </div>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          {request.status === 'FULFILLED' && (
            <div style={{ flex:1, textAlign:'center', padding:'12px', borderRadius:'10px',
              background:'#EAF3DE', color:'#3B6D11', fontWeight:'500', fontSize:'14px' }}>
              🎉 Fully funded! Goal reached — thank you to all donors.
            </div>
          )}
          {isAuthenticated() && isDonor() && request.status === 'APPROVED' && (
            <Link to={`/donate/${request.id}`}
              style={{ flex:1, textAlign:'center', padding:'12px',
                borderRadius:'10px', fontWeight:'500', fontSize:'14px',
                background: request.isEmergency ? '#E24B4A' : '#1D9E75',
                color:'#fff', textDecoration:'none' }}>
              {request.isEmergency ? '🚨 Donate Now' : '💚 Donate'}
            </Link>
          )}
          {!isAuthenticated() && (
            <Link to="/login" state={{ from: { pathname: `/requests/${id}` } }}
              style={{ flex:1, textAlign:'center', padding:'12px', borderRadius:'10px',
                border:'1px solid var(--color-border-tertiary)', fontSize:'14px',
                color:'var(--color-text-secondary)', textDecoration:'none' }}>
              Login to donate
            </Link>
          )}
          <button onClick={() => navigate(-1)}
            style={{ padding:'12px 20px', borderRadius:'10px', border:'1px solid var(--color-border-tertiary)',
              background:'transparent', color:'var(--color-text-secondary)', cursor:'pointer', fontSize:'13px' }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundRequestDetailPage;
