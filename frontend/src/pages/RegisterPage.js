// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const { login }          = useAuth();
  const navigate           = useNavigate();
  const [form, setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoad(true); setError('');
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoad(false); }
  };

  return (
    <div style={styles.wrap}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password <span style={{ color: '#64748b', fontWeight: 400 }}>(min 6 chars)</span></label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} minLength={6} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input className="form-control" type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#64748b', fontSize: '.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap:  { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '2rem' },
  card:  { width: '100%', maxWidth: '440px', padding: '2.5rem' },
  title: { fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', color: '#1e293b' },
};