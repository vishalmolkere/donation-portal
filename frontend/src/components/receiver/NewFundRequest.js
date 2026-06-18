import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fundRequestAPI } from '../../services/api';

const CATEGORIES = ['Medical', 'Education', 'Disaster Relief', 'Elderly Care', 'Child Welfare', 'Other'];

const NewFundRequest = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', amountNeeded: '',
    emergency: false, emergencyReason: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.emergency && !form.emergencyReason.trim()) {
      setError('Please explain why this is an emergency.');
      return;
    }

    setLoading(true);
    try {
      await fundRequestAPI.create({
        ...form,
        amountNeeded: parseFloat(form.amountNeeded),
      });
      navigate('/receiver/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Submit Fund Request</h1>
        <p>Fill in the details. Emergency requests go live immediately — use only when genuinely urgent.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div className="form-group">
          <label>Title <span style={{ color: '#E24B4A' }}>*</span></label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Brief title for your request" required maxLength={120} />
        </div>

        <div className="form-group">
          <label>Category <span style={{ color: '#E24B4A' }}>*</span></label>
          <select value={form.category} onChange={e => set('category', e.target.value)} required>
            <option value="">Select a category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Amount Needed (₹) <span style={{ color: '#E24B4A' }}>*</span></label>
          <input type="number" value={form.amountNeeded} onChange={e => set('amountNeeded', e.target.value)}
            placeholder="Minimum ₹100" min="100" required />
        </div>

        <div className="form-group">
          <label>Description <span style={{ color: '#E24B4A' }}>*</span></label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe your situation and how the funds will be used (min 20 characters)"
            rows={5} required minLength={20} />
        </div>

        {/* ── Emergency toggle ──────────────────────────────────────────────── */}
        <div style={{
          padding: '16px', borderRadius: '10px',
          background: form.emergency ? 'rgba(226,75,74,0.06)' : 'var(--bg2)',
          border: form.emergency ? '1px solid rgba(226,75,74,0.3)' : '1px solid var(--border)',
          transition: 'all .2s',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.emergency}
              onChange={e => set('emergency', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#E24B4A' }}
            />
            <span style={{ fontWeight: '500', fontSize: '14px' }}>
              🚨 Mark as Emergency
            </span>
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 28px' }}>
            Emergency requests go live <strong>immediately</strong> without waiting for admin approval.
            Admin is notified and will review after. Misuse will restrict your access.
          </p>

          {form.emergency && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '13px' }}>
                Why is this an emergency? <span style={{ color: '#E24B4A' }}>*</span>
              </label>
              <textarea
                value={form.emergencyReason}
                onChange={e => set('emergencyReason', e.target.value)}
                placeholder="e.g. Patient requires surgery within 48 hours, unable to wait for approval process..."
                rows={3} maxLength={500}
                style={{ border: '1px solid rgba(226,75,74,0.4)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {form.emergencyReason.length}/500
              </span>
            </div>
          )}
        </div>

        {/* Abuse warning */}
        {form.emergency && (
          <div style={{
            fontSize: '12px', color: '#854F0B', background: '#FAEEDA',
            padding: '10px 14px', borderRadius: '8px', lineHeight: '1.6',
          }}>
            <strong>Fair use policy:</strong> You may have at most 2 active emergency requests at a time.
            Submitting 3+ emergency requests in 30 days will automatically restrict your emergency access.
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className={form.emergency ? 'btn-danger' : 'btn-primary'} disabled={loading}>
            {loading
              ? 'Submitting...'
              : form.emergency
              ? '🚨 Submit Emergency Request'
              : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewFundRequest;
