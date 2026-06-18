import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { donationAPI, fundRequestAPI } from '../services/api';

const DonatePage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState({ amount: '', message: '', paymentMethod: 'CARD', fundRequestId: requestId });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (requestId) fundRequestAPI.getById(requestId).then(res => setRequest(res.data.data)).catch(() => setError('Request not found'));
  }, [requestId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await donationAPI.donate({ ...form, amount: parseFloat(form.amount), fundRequestId: parseInt(requestId) });
      setSuccess('Donation of ₹' + form.amount + ' to ' + request?.receiverName + ' was successful! TXN: ' + res.data.data.txnId);
      setTimeout(() => navigate('/donor/donations'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Donation failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <div className="page-header"><h1>Make a Donation</h1></div>
        {request && (
          <div className="card request-preview">
            <div className="request-preview-header">
              <span className="category-tag">{request.category}</span>
              <strong>{request.title}</strong>
            </div>
            <p className="request-by">Submitted by: <strong>{request.receiverName}</strong></p>
            <p className="request-desc">{request.description}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: Math.min(request.progressPercent,100)+'%'}}></div>
            </div>
            <p className="progress-label">₹{parseFloat(request.amountReceived).toFixed(0)} raised of ₹{parseFloat(request.amountNeeded).toFixed(0)}</p>
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {!success && (
          <div className="card">
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Donation Amount (₹)</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} min="1" step="1" placeholder="e.g. 500" required />
                <div className="quick-amounts">
                  {[100,500,1000,2000,5000].map(a => <button key={a} type="button" className="quick-btn" onClick={() => setForm({...form, amount: a})}>₹{a}</button>)}
                </div>
              </div>
              <div className="form-group">
                <label>Message to {request?.receiverName} (optional)</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Write an encouraging message..." rows={3} />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NETBANKING">Net Banking</option>
                  <option value="WALLET">Wallet</option>
                </select>
              </div>
              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Processing...' : `Donate ₹${form.amount || '—'}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default DonatePage;
