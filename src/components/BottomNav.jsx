import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${path === '/dashboard' ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
        aria-label="Home"
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </button>

      <button
        className={`nav-item ${path.startsWith('/pets') && !path.includes('/checklist') && !path.includes('/proof') ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
        aria-label="My Pets"
      >
        <span className="nav-icon">🐾</span>
        <span className="nav-label">My Pets</span>
      </button>

      <button
        className={`nav-item ${path.includes('/checklist') ? 'active' : ''}`}
        onClick={() => navigate('/pets/1/checklist')}
        aria-label="Today's checklist"
      >
        <span className="nav-icon">✅</span>
        <span className="nav-label">Today</span>
      </button>

      <button
        className={`nav-item ${path.includes('/proof') ? 'active' : ''}`}
        onClick={() => navigate('/pets/1/proof-of-life')}
        aria-label="Photos"
      >
        <span className="nav-icon">📷</span>
        <span className="nav-label">Photos</span>
      </button>

      {/* Logout — always accessible from bottom nav */}
      <button
        className="nav-item"
        onClick={() => navigate('/')}
        aria-label="Log out"
        style={{ color: 'var(--danger)' }}
      >
        <span className="nav-icon" style={{ color: 'var(--danger)' }}>🚪</span>
        <span className="nav-label" style={{ color: 'var(--danger)' }}>Log out</span>
      </button>
    </nav>
  );
}
