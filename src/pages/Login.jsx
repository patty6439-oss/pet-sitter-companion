import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo">🐾</div>
        <h1 className="auth-hero-title">PetSitter Companion</h1>
        <p className="auth-hero-sub">Professional pet care, simplified</p>
      </div>

      <div className="auth-body">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to manage your pets</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <span className="auth-link" style={{ fontSize: '0.875rem' }}>
              Forgot password?
            </span>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '14px' }}>
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/register')}>
            Create one
          </span>
        </div>

        <div style={{ marginTop: 32, padding: 16, background: '#F8FAFF', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
            Demo — tap to auto-fill
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setForm({ email: 'sarah@example.com', password: 'password123' });
            }}
          >
            Use demo account
          </button>
        </div>
      </div>
    </div>
  );
}
