import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fundRequestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Medical', 'Education', 'Disaster Relief', 'Elderly Care', 'Child Welfare', 'Other'];

const BrowseRequestsPage = () => {
  const { isAuthenticated, isDonor } = useAuth();
  const [requests,  setRequests]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [filter,    setFilter]    = useState('All');   // All | Emergency | Regular
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fundRequestAPI.getAll()
      .then(r => setRequests(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    const matchSearch   = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || r.category === category;
    const matchFilter   = filter === 'All'
                          || (filter === 'Emergency' && r.isEmergency)
                          || (filter === 'Regular'   && !r.isEmergency);
    return matchSearch && matchCategory && matchFilter;
  });

  const emergencyCount = requests.filter(r => r.isEmergency).length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Browse Fund Requests</h1>
        <p>{requests.length} open requests · {emergencyCount} emergencies need urgent help</p>
      </div>

      {/* Emergency banner */}
      {emergencyCount > 0 && (
        <div
          onClick={() => setFilter('Emergency')}
          style={{
            background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.25)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '1.5rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <div style={{ fontWeight: '500', color: '#A32D2D', fontSize: '14px' }}>
              {emergencyCount} urgent request{emergencyCount > 1 ? 's' : ''} need immediate help
            </div>
            <div style={{ fontSize: '12px', color: '#854F0B', marginTop: '2px' }}>
              These cases cannot wait — click to view only emergency requests
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#A32D2D', fontWeight: '500' }}>
            View →
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search requests..."
          style={{ flex: '1', minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {['All', 'Emergency', 'Regular'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
              border: '1px solid var(--border)', cursor: 'pointer',
              background: filter === f ? 'var(--text-primary)' : 'var(--bg2)',
              color: filter === f ? 'var(--bg)' : 'var(--text-secondary)',
            }}>
            {f === 'Emergency' ? '🚨 Emergency' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No requests match your filters.</p></div>
      ) : (
        <div className="requests-grid">
          {filtered.map(r => (
            <div key={r.id} className="card request-card" style={{
              border: r.isEmergency ? '1px solid rgba(226,75,74,0.35)' : undefined,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Emergency ribbon */}
              {r.isEmergency && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  background: 'rgba(226,75,74,0.1)', borderBottom: '1px solid rgba(226,75,74,0.2)',
                  padding: '6px 14px', fontSize: '11px', fontWeight: '500', color: '#A32D2D',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  🚨 Emergency &nbsp;·&nbsp; {r.emergencyReason}
                </div>
              )}

              <div style={{ paddingTop: r.isEmergency ? '36px' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <Link to={`/requests/${r.id}`} style={{ fontSize: '15px', fontWeight: '500', margin: 0, color:'var(--color-text-primary)', textDecoration:'none' }}>{r.title}</Link>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '12px',
                    background: 'var(--bg2)', color: 'var(--text-muted)',
                  }}>{r.category}</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: '1.5',
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {r.description}
                </p>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>₹{parseFloat(r.amountReceived).toLocaleString()} raised</span>
                    <span style={{ fontWeight: '500' }}>{r.progressPercent.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      width: Math.min(r.progressPercent, 100) + '%', height: '100%', borderRadius: '3px',
                      background: r.isEmergency ? '#E24B4A' : '#1D9E75', transition: 'width .3s',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Goal: ₹{parseFloat(r.amountNeeded).toLocaleString()} · {r.donationCount} donor{r.donationCount !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {(isAuthenticated() && isDonor()) ? (
                    <Link to={`/donate/${r.id}`}
                      style={{
                        flex: 1, textAlign: 'center', padding: '8px',
                        borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                        background: r.isEmergency ? '#E24B4A' : '#1D9E75',
                        color: '#fff', textDecoration: 'none',
                      }}>
                      {r.isEmergency ? '🚨 Donate Now' : 'Donate'}
                    </Link>
                  ) : (
                    <Link to="/login" style={{
                      flex: 1, textAlign: 'center', padding: '8px',
                      borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', textDecoration: 'none',
                    }}>
                      Login to donate
                    </Link>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  By {r.receiverName} · {new Date(r.createdAt).toLocaleDateString()}
                  {r.isFlagged && (
                    <span style={{ marginLeft: '8px', color: '#854F0B' }}>⚠️ Under review</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseRequestsPage;
