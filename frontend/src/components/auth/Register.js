import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'DONOR', phone: '', address: '', description: ''
  });
  const [error,      setError]      = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setError(''); setFieldErrors({}); setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      navigate(user.role === 'ROLE_RECEIVER' ? '/receiver/dashboard' : '/donor/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      // Backend returns { success:false, message:"Validation failed", data: { field: "message" } }
      if (data?.data && typeof data.data === 'object') {
        setFieldErrors(data.data);
        setError('Please fix the errors below.');
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join our community and make a difference</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Role selector */}
        <div className="role-selector">
          <div className={'role-option' + (form.role === 'DONOR' ? ' selected' : '')}
            onClick={() => setForm({ ...form, role: 'DONOR' })}>
            <span className="role-icon">🤝</span>
            <strong>I want to Donate</strong>
            <p>Browse requests and help people in need</p>
          </div>
          <div className={'role-option' + (form.role === 'RECEIVER' ? ' selected' : '')}
            onClick={() => setForm({ ...form, role: 'RECEIVER' })}>
            <span className="role-icon">🙏</span>
            <strong>I need Help</strong>
            <p>Submit a fund request and receive donations</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="John Doe" required
                style={fieldErrors.name ? {borderColor:'#E24B4A'} : {}} />
              {fieldErrors.name && <span style={{fontSize:'11px',color:'#A32D2D'}}>{fieldErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required
                style={fieldErrors.email ? {borderColor:'#E24B4A'} : {}} />
              {fieldErrors.email && <span style={{fontSize:'11px',color:'#A32D2D'}}>{fieldErrors.email}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters" required minLength={6}
                style={fieldErrors.password ? {borderColor:'#E24B4A'} : {}} />
              {fieldErrors.password && <span style={{fontSize:'11px',color:'#A32D2D'}}>{fieldErrors.password}</span>}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>

          {form.role === 'RECEIVER' && (
            <div className="receiver-extra">
              <div className="section-label">📋 Additional info (builds donor trust)</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+91 99999 00000" />
                </div>
                <div className="form-group">
                  <label>City / Address</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    placeholder="Mumbai, Maharashtra" />
                </div>
              </div>
              <div className="form-group">
                <label>Brief Background</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Tell donors a little about yourself..." />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Creating account...' : `Register as ${form.role === 'RECEIVER' ? 'Receiver' : 'Donor'}`}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
