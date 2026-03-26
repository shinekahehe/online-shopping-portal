// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { login }          = useAuth();
  const navigate           = useNavigate();
  const [form, setForm]    = useState({ email: '', password: '' });
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoad(true); setError('');
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoad(false); }
  };

  return (
    <div style={styles.wrap}>
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>Sign In</h1>
        {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#64748b', fontSize: '.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap:  { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '2rem' },
  card:  { width: '100%', maxWidth: '420px', padding: '2.5rem' },
  title: { fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', color: '#1e293b' },
};