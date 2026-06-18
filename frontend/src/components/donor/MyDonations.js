import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { donationAPI } from '../../services/api';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    donationAPI.getMy()
      .then(res => setDonations(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Donations</h1>
        <p>Total contributed: <strong>₹{total.toFixed(2)}</strong></p>
      </div>
      {donations.length === 0 ? (
        <div className="empty-state">
          <p>No donations yet.</p>
          <Link to="/requests" className="btn-primary">Find a cause</Link>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Receiver</th><th>Fund Request</th><th>Amount</th><th>TXN ID</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.receiverName}</strong></td>
                  <td>{d.fundRequestTitle}</td>
                  <td className="amount">₹{parseFloat(d.amount).toFixed(2)}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'12px' }}>{d.txnId || '—'}</td>
                  <td><span className={'status-chip ' + d.status.toLowerCase()}>{d.status}</span></td>
                  <td>{new Date(d.donatedAt).toLocaleDateString()}</td>
                  {/* FIX: link to receipt detail page */}
                  <td><Link to={`/donor/donations/${d.id}`} style={{ fontSize:'12px', color:'var(--color-text-info)' }}>Receipt</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyDonations;
