import React, { useState, useEffect } from 'react';
import { donationAPI } from '../services/api';

const ReceiverDonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    donationAPI.getReceived()
      .then(res => setDonations(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by fund request
  const grouped = donations.reduce((acc, d) => {
    const key = d.fundRequestId;
    if (!acc[key]) acc[key] = { title: d.fundRequestTitle, items: [], total: 0 };
    acc[key].items.push(d);
    acc[key].total += parseFloat(d.amount || 0);
    return acc;
  }, {});

  const totalReceived = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Donations Received</h1>
        <p>Total received: <strong>₹{totalReceived.toFixed(2)}</strong> across {donations.length} donation{donations.length !== 1 ? 's' : ''}</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state"><p>No donations received yet.</p></div>
      ) : (
        Object.entries(grouped).map(([requestId, group]) => (
          <div key={requestId} className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>{group.title}</h3>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1D9E75' }}>
                ₹{group.total.toFixed(2)} from {group.items.length} donor{group.items.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Donor</th><th>Amount</th><th>Message</th><th>TXN ID</th><th>Date</th></tr>
              </thead>
              <tbody>
                {group.items.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: '500' }}>{d.donorName}</td>
                    <td className="amount">₹{parseFloat(d.amount).toFixed(2)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '200px' }}>{d.message || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{d.txnId || '—'}</td>
                    <td style={{ fontSize: '12px' }}>{new Date(d.donatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default ReceiverDonationsPage;
