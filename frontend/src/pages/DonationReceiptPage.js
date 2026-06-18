import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donationAPI } from '../services/api';

const DonationReceiptPage = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    donationAPI.getById(id)
      .then(res => setDonation(res.data.data))
      .catch(() => setError('Donation not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading receipt...</div>;
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!donation) return null;

  return (
    <div className="page-container" style={{ maxWidth:'520px', margin:'0 auto' }}>
      <div className="card" style={{ padding:'32px', textAlign:'center' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>🧾</div>
        <h1 style={{ fontSize:'20px', fontWeight:'500', marginBottom:'4px' }}>Donation Receipt</h1>
        <p style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginBottom:'24px' }}>
          Thank you for your generosity!
        </p>

        <div style={{ background:'var(--color-background-secondary)', borderRadius:'10px', padding:'20px',
          textAlign:'left', marginBottom:'20px' }}>
          {[
            ['Amount', `₹${parseFloat(donation.amount).toFixed(2)}`],
            ['To', donation.receiverName],
            ['Request', donation.fundRequestTitle],
            ['TXN ID', donation.txnId || '—'],
            ['Status', donation.status],
            ['Date', new Date(donation.donatedAt).toLocaleString()],
            ['Message', donation.message || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:'13px' }}>
              <span style={{ color:'var(--color-text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: label === 'Amount' ? '500' : '400',
                color: label === 'Amount' ? '#1D9E75' : 'var(--color-text-primary)',
                fontFamily: label === 'TXN ID' ? 'var(--font-mono)' : 'inherit',
                fontSize: label === 'TXN ID' ? '12px' : '13px' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
          <Link to="/donor/donations" style={{ padding:'10px 20px', borderRadius:'8px',
            border:'1px solid var(--color-border-tertiary)', fontSize:'13px',
            color:'var(--color-text-secondary)', textDecoration:'none' }}>
            ← My Donations
          </Link>
          <Link to="/requests" style={{ padding:'10px 20px', borderRadius:'8px',
            background:'#1D9E75', color:'#fff', fontSize:'13px', textDecoration:'none', fontWeight:'500' }}>
            Donate again
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonationReceiptPage;
