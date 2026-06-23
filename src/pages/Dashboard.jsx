import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { samplePets, sampleUser } from '../data/sampleData';

function PetCard({ pet }) {
  const navigate = useNavigate();
  const completedTasks = pet.dailyTasks.filter((t) => t.completed).length;
  const totalTasks = pet.dailyTasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          background: pet.gradient,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.75rem',
          position: 'relative',
        }}
      >
        {pet.emoji}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 20,
            padding: '2px 8px',
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: '#2D3748',
          }}
        >
          {pet.species}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{pet.name}</h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {pet.breed} · {pet.age} yr{pet.age !== 1 ? 's' : ''} old
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Today&apos;s tasks
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: progress === 100 ? 'var(--success)' : 'var(--text-muted)' }}>
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {pet.medications.length > 0 && (
          <div
            style={{
              background: 'var(--danger-light)',
              borderRadius: 8,
              padding: '6px 10px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>💊</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 500 }}>
              {pet.medications.length} medication{pet.medications.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={() => navigate(`/pets/${pet.id}`)}
          >
            View Profile
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={() => navigate(`/pets/${pet.id}/checklist`)}
          >
            Checklist ✅
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page">
      {/* Header */}
      <header style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {greeting} 👋
            </p>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{sampleUser.name.split(' ')[0]}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={() => navigate('/pets/new')}
              title="Add pet"
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', fontSize: '1.25rem' }}
            >
              +
            </button>
            {/* Avatar */}
            <div
              style={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, var(--primary), #7C5CBF)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9375rem',
              }}
            >
              {sampleUser.name.charAt(0)}
            </div>
            {/* Logout */}
            <button
              className="btn btn-sm"
              onClick={() => navigate('/')}
              title="Log out"
              style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              🚪 Log out
            </button>
          </div>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{today}</p>
      </header>

      <div className="page-content">
        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Pets', value: samplePets.length, icon: '🐾', color: 'var(--primary)', bg: 'var(--primary-light)' },
            {
              label: 'Tasks Done',
              value: samplePets.reduce((acc, p) => acc + p.dailyTasks.filter((t) => t.completed).length, 0),
              icon: '✅',
              color: 'var(--success)',
              bg: 'var(--success-light)',
            },
            {
              label: 'Pending',
              value: samplePets.reduce((acc, p) => acc + p.dailyTasks.filter((t) => !t.completed).length, 0),
              icon: '⏰',
              color: 'var(--warning)',
              bg: 'var(--warning-light)',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card"
              style={{ flex: 1, padding: '12px 10px', textAlign: 'center', background: stat.bg }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: 2 }}>{stat.icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color, lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pets section */}
        <div className="section-header">
          <span className="section-title">My Pets</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/pets/new')}
            style={{ borderRadius: 8, padding: '6px 12px' }}
          >
            + Add Pet
          </button>
        </div>

        {samplePets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}

        {/* Quick links */}
        <div className="section-header" style={{ marginTop: 4 }}>
          <span className="section-title">Quick Access</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '✅', label: "Today's Checklist", sub: 'View all tasks', route: '/pets/1/checklist', color: 'var(--success)', bg: 'var(--success-light)' },
            { icon: '📷', label: 'Proof of Life', sub: 'Upload photos', route: '/pets/1/proof-of-life', color: 'var(--primary)', bg: 'var(--primary-light)' },
          ].map((item) => (
            <button
              key={item.label}
              className="card"
              onClick={() => navigate(item.route)}
              style={{
                background: item.bg,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: item.color }}>
                {item.label}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
