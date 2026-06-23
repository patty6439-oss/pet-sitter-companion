import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, backTo, rightAction }) {
  const navigate = useNavigate();

  return (
    <header className="page-header">
      {/* Back button */}
      {backTo !== null && (
        <button
          className="back-btn"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          aria-label="Go back"
        >
          ←
        </button>
      )}

      <span className="page-header-title">{title}</span>

      {/* Right-side actions: caller's action + always-visible Home button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        {rightAction && <div>{rightAction}</div>}
        <button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="Go to Dashboard"
          title="Home"
          style={{ fontSize: '1.0625rem' }}
        >
          🏠
        </button>
      </div>
    </header>
  );
}
