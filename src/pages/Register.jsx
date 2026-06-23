import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'owner' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-hero" style={{ padding: '36px 32px 32px' }}>
        <div className="auth-logo">🐾</div>
        <h1 className="auth-hero-title">Create Account</h1>
        <p className="auth-hero-sub">Join thousands of pet lovers</p>
      </div>

      <div className="auth-body">
        <h2 className="auth-title">Get started</h2>
        <p className="auth-subtitle">It&apos;s free and takes less than a minute</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

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
            <label className="form-label">I am a...</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'owner', label: '🏠 Pet Owner', desc: 'I own pets' },
                { value: 'sitter', label: '🐕 Pet Sitter', desc: 'I care for pets' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    flex: 1,
                    border: `2px solid ${form.role === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: form.role === opt.value ? 'var(--primary-light)' : 'white',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={form.role === opt.value}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: form.role === opt.value ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '14px' }}>
            Create Account
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/')}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}
