import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, donationAPI } from '../../services/api';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const Chip = ({ status }) => (
  <span className={'status-chip ' + (status || '').toLowerCase()}>{status}</span>
);
const RoleChip = ({ role }) => {
  const label = (role || '').replace('ROLE_', '');
  return <span className={'role-chip ' + label.toLowerCase()}>{label}</span>;
};

// ── sub-components ────────────────────────────────────────────────────────────
const EmergencyCard = ({ r, onRevoke, onFlag, onLock }) => {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom: '12px', padding: '16px', borderLeft: '3px solid #E24B4A' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: '500', fontSize: '14px' }}>🚨 {r.title}</div>
          <div style={{ fontSize: '12px', color: '#A32D2D', marginTop: '2px' }}>Reason: {r.emergencyReason}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            By {r.receiverName} · ₹{parseFloat(r.amountNeeded).toLocaleString()} · {new Date(r.createdAt).toLocaleString()}
          </div>
        </div>
        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: '#FCEBEB', color: '#A32D2D', fontWeight: '500', flexShrink: 0 }}>LIVE</span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '10px 0' }}>{r.description}</p>
      {!open
        ? <button onClick={() => setOpen(true)} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Take action</button>
        : <div>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note (required for revoke, optional for flag)"
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '✓ Legitimate', color: '#EAF3DE', text: '#3B6D11', fn: () => setOpen(false) },
                { label: '⚠️ Flag', color: '#FAEEDA', text: '#854F0B', fn: () => { onFlag(note || 'Flagged'); setOpen(false); } },
                { label: '🚫 Revoke', color: '#FCEBEB', text: '#A32D2D', fn: () => { if (!note) return alert('Add reason'); onRevoke(note); setOpen(false); } },
                { label: '🔒 Lock receiver', color: '#FCEBEB', text: '#A32D2D', fn: () => { onLock(note || 'Emergency abuse'); setOpen(false); } },
              ].map(b => (
                <button key={b.label} onClick={b.fn}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: b.color, color: b.text, fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
      }
    </div>
  );
};

const PendingCard = ({ r, onDecide }) => {
  const [note, setNote] = useState('');
  return (
    <div className="card" style={{ marginBottom: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: '500', fontSize: '14px' }}>{r.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            By {r.receiverName} · {r.category} · ₹{parseFloat(r.amountNeeded).toLocaleString()}
          </div>
        </div>
        <Chip status={r.status} />
      </div>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '8px 0' }}>{r.description}</p>
      <input value={note} onChange={e => setNote(e.target.value)}
        placeholder="Admin note (required for rejection)"
        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-primary" onClick={() => onDecide(r.id, 'APPROVED', note)}>Approve</button>
        <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
          onClick={() => { if (!note) return alert('Add a rejection reason'); onDecide(r.id, 'REJECTED', note); }}>
          Reject
        </button>
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────
const ROLE_FILTERS = ['All', 'DONOR', 'RECEIVER', 'ADMIN'];

const AdminDashboard = () => {
  const [dashboard,   setDashboard]   = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [pending,     setPending]     = useState([]);
  const [flagged,     setFlagged]     = useState([]);
  const [allDonations,setAllDonations]= useState([]);
  const [users,       setUsers]       = useState([]);
  const [roleFilter,  setRoleFilter]  = useState('All');
  const [activeTab,   setActiveTab]   = useState('overview');
  const [loading,     setLoading]     = useState(true);
  // inline user editing
  const [editingRole, setEditingRole] = useState(null); // userId
  const [newRole,     setNewRole]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getFundRequests('EMERGENCY'),
      adminAPI.getFundRequests('PENDING'),
      adminAPI.getFundRequests('FLAGGED'),
      donationAPI.getAll(),
      adminAPI.getAllUsers(),
    ]).then(([db, em, pn, fl, dn, us]) => {
      setDashboard(db.data.data);
      setEmergencies(em.data.data || []);
      setPending(pn.data.data || []);
      setFlagged(fl.data.data || []);
      setAllDonations(dn.data.data || []);
      setUsers(us.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // ── actions ──────────────────────────────────────────────────────────────
  const reviewRequest = async (id, decision, note) => {
    await adminAPI.reviewRequest(id, { decision, adminNote: note });
    load();
  };
  const flagRequest     = async (id, reason)  => { await adminAPI.flagRequest(id, { reason }); load(); };
  const verifyUser      = async (id)           => { await adminAPI.verifyUser(id); load(); };
  const deleteUser      = async (id, name)     => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await adminAPI.deleteUser(id); load();
  };
  const saveRole        = async (id)           => { await adminAPI.updateRole(id, newRole); setEditingRole(null); load(); };
  const lockEmergency   = async (id, reason)   => { await adminAPI.lockEmergency(id, { reason }); load(); };
  const unlockEmergency = async (id)           => { await adminAPI.unlockEmergency(id); load(); };
  const deleteDonation  = async (id)           => {
    if (!window.confirm('Delete this donation record?')) return;
    await donationAPI.delete(id); load();
  };

  // ── filtered users ────────────────────────────────────────────────────────
  const displayUsers = roleFilter === 'All' ? users
    : users.filter(u => u.role === `ROLE_${roleFilter}`);

  if (loading) return <div className="loading">Loading admin panel...</div>;

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'emergency', label: `🚨 Emergency (${emergencies.length})`, alert: emergencies.length > 0 },
    { id: 'pending',   label: `Pending (${pending.length})` },
    { id: 'flagged',   label: `Flagged (${flagged.length})` },
    { id: 'donations', label: `Donations (${allDonations.length})` },
    { id: 'users',     label: `Users (${users.length})` },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Admin Panel</h1>
          <p>Manage users, requests, and donations.</p>
        </div>
        {emergencies.length > 0 && (
          <div onClick={() => setActiveTab('emergency')} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: '#A32D2D', fontWeight: '500', cursor: 'pointer' }}>
            🚨 {emergencies.length} emergency request{emergencies.length > 1 ? 's' : ''} need review
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-tertiary)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            border: 'none', borderBottom: activeTab === t.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
            background: 'transparent', marginBottom: '-1px',
            color: t.alert ? '#A32D2D' : activeTab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ───────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && dashboard && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card"><div className="stat-value">{dashboard.totalUsers}</div><div className="stat-label">Total Users</div></div>
            <div className="stat-card"><div className="stat-value">{dashboard.totalDonors}</div><div className="stat-label">Donors</div></div>
            <div className="stat-card"><div className="stat-value">{dashboard.totalReceivers}</div><div className="stat-label">Receivers</div></div>
            <div className="stat-card" style={{ borderLeft: emergencies.length > 0 ? '3px solid #E24B4A' : undefined }}>
              <div className="stat-value" style={{ color: emergencies.length > 0 ? '#E24B4A' : undefined }}>{emergencies.length}</div>
              <div className="stat-label">Live Emergencies</div>
            </div>
          </div>
          <div className="stats-grid" style={{ marginTop: '10px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card green"><div className="stat-value">₹{parseFloat(dashboard.totalAmountRaised || 0).toLocaleString()}</div><div className="stat-label">Total Raised</div></div>
            <div className="stat-card"><div className="stat-value">{dashboard.totalDonations}</div><div className="stat-label">Donations</div></div>
            <div className="stat-card amber"><div className="stat-value">{dashboard.pendingRequests}</div><div className="stat-label">Pending Review</div></div>
            <div className="stat-card"><div className="stat-value">{dashboard.fulfilledRequests}</div><div className="stat-label">Fulfilled</div></div>
          </div>
          {dashboard.recentDonations?.length > 0 && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-header"><h3>Recent Donations</h3></div>
              <table className="data-table">
                <thead><tr><th>Donor</th><th>Request</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>{dashboard.recentDonations.slice(0, 8).map(d => (
                  <tr key={d.id}>
                    <td>{d.donorName}</td>
                    <td>{d.fundRequestTitle}</td>
                    <td className="amount">₹{parseFloat(d.amount).toFixed(2)}</td>
                    <td>{new Date(d.donatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── EMERGENCY ──────────────────────────────────────────────────────── */}
      {activeTab === 'emergency' && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            These went live immediately. Review when convenient — revoke if illegitimate.
          </p>
          {emergencies.length === 0
            ? <div className="empty-state"><p>No active emergency requests. ✅</p></div>
            : emergencies.map(r => (
              <EmergencyCard key={r.id} r={r}
                onRevoke={note => reviewRequest(r.id, 'REJECTED', note)}
                onFlag={reason => flagRequest(r.id, reason)}
                onLock={reason => lockEmergency(r.receiverId, reason)}
              />
            ))
          }
        </div>
      )}

      {/* ── PENDING ────────────────────────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div>
          {pending.length === 0
            ? <div className="empty-state"><p>No pending requests. ✅</p></div>
            : pending.map(r => <PendingCard key={r.id} r={r} onDecide={reviewRequest} />)
          }
        </div>
      )}

      {/* ── FLAGGED ────────────────────────────────────────────────────────── */}
      {activeTab === 'flagged' && (
        <div>
          {flagged.length === 0
            ? <div className="empty-state"><p>No flagged requests.</p></div>
            : flagged.map(r => (
              <div key={r.id} className="card" style={{ marginBottom: '12px', padding: '16px', borderLeft: '3px solid #EF9F27' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{r.title}</strong>
                  <span style={{ fontSize: '12px', color: '#854F0B' }}>⚠️ {r.flagReason}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '6px 0' }}>{r.description}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" onClick={() => reviewRequest(r.id, 'APPROVED', 'Reviewed — legitimate')}>Keep live</button>
                  <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
                    onClick={() => reviewRequest(r.id, 'REJECTED', 'Rejected after flag review')}>Revoke</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── DONATIONS ──────────────────────────────────────────────────────── */}
      {activeTab === 'donations' && (
        <div className="card">
          {allDonations.length === 0
            ? <div className="empty-state"><p>No donations yet.</p></div>
            : <table className="data-table">
                <thead>
                  <tr><th>Donor</th><th>Receiver</th><th>Request</th><th>Amount</th><th>TXN</th><th>Status</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {allDonations.map(d => (
                    <tr key={d.id}>
                      <td>{d.donorName}</td>
                      <td>{d.receiverName}</td>
                      <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fundRequestTitle}</td>
                      <td className="amount">₹{parseFloat(d.amount).toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.txnId || '—'}</td>
                      <td><Chip status={d.status} /></td>
                      <td>{new Date(d.donatedAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => deleteDonation(d.id)}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {/* ── USERS ──────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div>
          {/* Gap 3 fixed: role filter tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {ROLE_FILTERS.map(f => (
              <button key={f} onClick={() => setRoleFilter(f)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                border: '1px solid var(--color-border-tertiary)', cursor: 'pointer',
                background: roleFilter === f ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
                color:      roleFilter === f ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
              }}>
                {f === 'All' ? `All (${users.length})` : `${f} (${users.filter(u => u.role === `ROLE_${f}`).length})`}
              </button>
            ))}
          </div>

          <div className="card">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Emergency</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {displayUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '500' }}>{u.name}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{u.email}</td>

                    {/* Gap 2 fixed: inline role editor */}
                    <td>
                      {editingRole === u.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <select value={newRole} onChange={e => setNewRole(e.target.value)}
                            style={{ padding: '3px 6px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                            <option value="ROLE_DONOR">DONOR</option>
                            <option value="ROLE_RECEIVER">RECEIVER</option>
                            <option value="ROLE_ADMIN">ADMIN</option>
                          </select>
                          <button onClick={() => saveRole(u.id)} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
                          <button onClick={() => setEditingRole(null)} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: 'var(--color-background-tertiary)', border: 'none', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <RoleChip role={u.role} />
                          <button onClick={() => { setEditingRole(u.id); setNewRole(u.role); }}
                            style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                            edit
                          </button>
                        </div>
                      )}
                    </td>

                    <td>
                      {u.isVerified
                        ? <span style={{ color: '#1D9E75', fontSize: '12px' }}>✅ Verified</span>
                        : <button onClick={() => verifyUser(u.id)}
                            style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                            Verify
                          </button>
                      }
                    </td>

                    <td>
                      {u.role === 'ROLE_RECEIVER' ? (
                        u.emergencyLocked
                          ? <button onClick={() => unlockEmergency(u.id)}
                              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer' }}>
                              🔓 Unlock
                            </button>
                          : <button onClick={() => lockEmergency(u.id, 'Locked by admin')}
                              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#FAEEDA', color: '#854F0B', border: 'none', cursor: 'pointer' }}>
                              🔒 Lock
                            </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>N/A</span>
                      )}
                    </td>

                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>

                    {/* Gap 2 fixed: delete user button */}
                    <td>
                      <button onClick={() => deleteUser(u.id, u.name)}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
