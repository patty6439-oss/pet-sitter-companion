import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { user, signUp, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', role: 'owner' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await signUp(form.email, form.password);
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else if (data?.user && !data?.session) {
      setMessage('Check your email for a confirmation link, then sign in.');
    } else {
      navigate('/dashboard', { replace: true });
    }
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

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem', marginBottom: 16 }}>
            {message}
          </div>
        )}

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
              required
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
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
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
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ padding: '14px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
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
