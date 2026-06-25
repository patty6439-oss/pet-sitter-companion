import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { getPetEmoji, getPetGradient } from '../utils/petHelpers';

function PetCard({ pet, completedCount }) {
  const navigate = useNavigate();
  const medCount = pet.medications?.length || 0;
  const taskCount = pet.daily_tasks?.length || 0;
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          background: getPetGradient(pet.species),
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.75rem',
          position: 'relative',
        }}
      >
        {getPetEmoji(pet.species)}
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
            {pet.breed || 'Unknown breed'}
            {pet.age != null ? ` · ${pet.age} yr${pet.age !== 1 ? 's' : ''} old` : ''}
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Daily tasks
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {completedCount}/{taskCount} done
            </span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {medCount > 0 && (
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
              {medCount} medication{medCount > 1 ? 's' : ''}
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
  const { user, signOut } = useAuth();
  const [pets, setPets] = useState([]);
  const [completionMap, setCompletionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];

    supabase
      .from('pets')
      .select('*, medications(*), daily_tasks(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(async ({ data, error }) => {
        if (error) { setError('Failed to load pets.'); setLoading(false); return; }
        const petList = data || [];
        setPets(petList);

        const allTaskIds = petList.flatMap((p) => (p.daily_tasks || []).map((t) => t.id));
        if (allTaskIds.length > 0) {
          const { data: logs } = await supabase
            .from('care_logs')
            .select('daily_task_id')
            .in('daily_task_id', allTaskIds)
            .gte('created_at', `${todayStr}T00:00:00`)
            .lte('created_at', `${todayStr}T23:59:59`)
            .eq('completed', true);

          const taskToCount = {};
          (logs || []).forEach((l) => { taskToCount[l.daily_task_id] = true; });

          const map = {};
          petList.forEach((p) => {
            map[p.id] = (p.daily_tasks || []).filter((t) => taskToCount[t.id]).length;
          });
          setCompletionMap(map);
        }

        setLoading(false);
      });
  }, [user]);

  async function handleLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  const totalMeds = pets.reduce((acc, p) => acc + (p.medications?.length || 0), 0);
  const totalTasks = pets.reduce((acc, p) => acc + (p.daily_tasks?.length || 0), 0);

  return (
    <div className="page">
      <header style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {greeting} 👋
            </p>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{displayName}</h1>
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
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              className="btn btn-sm"
              onClick={handleLogout}
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
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Pets', value: pets.length, icon: '🐾', color: 'var(--primary)', bg: 'var(--primary-light)' },
            { label: 'Medications', value: totalMeds, icon: '💊', color: 'var(--danger)', bg: 'var(--danger-light)' },
            { label: 'Daily Tasks', value: totalTasks, icon: '📋', color: 'var(--warning)', bg: 'var(--warning-light)' },
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

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <p>Loading your pets...</p>
          </div>
        ) : pets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🐾</div>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>No pets yet</p>
            <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>Add your first pet to get started</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/pets/new')}
              style={{ borderRadius: 10 }}
            >
              + Add Your First Pet
            </button>
          </div>
        ) : (
          pets.map((pet) => <PetCard key={pet.id} pet={pet} completedCount={completionMap[pet.id] || 0} />)
        )}

        {pets.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: 4 }}>
              <span className="section-title">Quick Access</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '✅', label: "Today's Checklist", sub: 'View all tasks', route: `/pets/${pets[0].id}/checklist`, color: 'var(--success)', bg: 'var(--success-light)' },
                { icon: '📷', label: 'Proof of Life', sub: 'Upload photos', route: `/pets/${pets[0].id}/proof-of-life`, color: 'var(--primary)', bg: 'var(--primary-light)' },
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
          </>
        )}
      </div>

      <BottomNav firstPetId={pets[0]?.id} />
    </div>
  );
}
