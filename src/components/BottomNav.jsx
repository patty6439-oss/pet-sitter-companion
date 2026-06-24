import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ firstPetId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const path = location.pathname;

  async function handleLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  const checklistRoute = firstPetId ? `/pets/${firstPetId}/checklist` : '/dashboard';
  const photosRoute = firstPetId ? `/pets/${firstPetId}/proof-of-life` : '/dashboard';

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
        onClick={() => navigate(checklistRoute)}
        aria-label="Today's checklist"
      >
        <span className="nav-icon">✅</span>
        <span className="nav-label">Today</span>
      </button>

      <button
        className={`nav-item ${path.includes('/proof') ? 'active' : ''}`}
        onClick={() => navigate(photosRoute)}
        aria-label="Photos"
      >
        <span className="nav-icon">📷</span>
        <span className="nav-label">Photos</span>
      </button>

      <button
        className="nav-item"
        onClick={handleLogout}
        aria-label="Log out"
        style={{ color: 'var(--danger)' }}
      >
        <span className="nav-icon" style={{ color: 'var(--danger)' }}>🚪</span>
        <span className="nav-label" style={{ color: 'var(--danger)' }}>Log out</span>
      </button>
    </nav>
  );
}
