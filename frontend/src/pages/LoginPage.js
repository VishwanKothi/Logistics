import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate('/dashboard'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/users/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const quickLogin = (demoEmail) => { setEmail(demoEmail); setPassword('password123'); };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@example.com' },
    { label: 'Customer', email: 'customer@example.com' },
    { label: 'Manager — Mumbai', email: 'manager-mumbai@example.com' },
    { label: 'Staff — Mumbai', email: 'staff-mumbai@example.com' },
    { label: 'Driver — Mumbai', email: 'driver1-mumbai@example.com' },
    { label: 'Manager — Delhi', email: 'manager-delhi@example.com' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon"><span>L</span></div>
          <h1>Logistics Hub</h1>
          <p>Sign in to manage operations</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-label">Email Address</label>
            <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-demo">
          <div className="login-demo-divider"><span>Demo Accounts</span></div>
          <div className="login-demo-grid">
            {demoAccounts.map((acc, i) => (
              <button key={i} className="login-demo-btn" onClick={() => quickLogin(acc.email)} type="button">
                {acc.label}
              </button>
            ))}
          </div>
          <p className="login-demo-note">Password: <code>password123</code></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
