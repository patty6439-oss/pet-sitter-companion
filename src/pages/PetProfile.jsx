import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { getPetEmoji, getPetGradient } from '../utils/petHelpers';

function InfoSection({ title, children, emoji }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {emoji && <span style={{ fontSize: '1.125rem' }}>{emoji}</span>}
        <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function PetProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from('pets')
      .select('*, medications(*), daily_tasks(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('Pet not found.');
        else setPet(data);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete ${pet.name}? This cannot be undone.`)) return;
    setDeleting(true);

    const taskIds = (pet.daily_tasks || []).map((t) => t.id);
    if (taskIds.length > 0) {
      await supabase.from('care_logs').delete().in('daily_task_id', taskIds);
      await supabase.from('daily_tasks').delete().eq('pet_id', id);
    }
    await supabase.from('medications').delete().eq('pet_id', id);
    const { error } = await supabase.from('pets').delete().eq('id', id);

    if (error) {
      setError('Failed to delete pet: ' + error.message);
      setDeleting(false);
    } else {
      navigate('/dashboard');
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="page">
        <PageHeader title="Pet Profile" backTo="/dashboard" />
        <div className="page-content">
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--danger)' }}>{error || 'Pet not found'}</div>
        </div>
      </div>
    );
  }

  const medications = pet.medications || [];
  const dailyTasks = pet.daily_tasks || [];

  return (
    <div className="page">
      <PageHeader
        title={pet.name}
        backTo="/dashboard"
        rightAction={
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/pets/${pet.id}/edit`)}
            style={{ borderRadius: 8 }}
          >
            Edit
          </button>
        }
      />

      <div className="page-content">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              background: getPetGradient(pet.species),
              height: pet.photo_url ? 220 : 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5rem',
              overflow: 'hidden',
            }}
          >
            {pet.photo_url
              ? <img src={pet.photo_url} alt={pet.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              : getPetEmoji(pet.species)}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>{pet.name}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                  {pet.breed || 'Unknown breed'}
                </p>
              </div>
              <span className="badge badge-blue">{pet.species}</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Age', value: pet.age != null ? `${pet.age} yr${pet.age !== 1 ? 's' : ''}` : 'Unknown' },
                { label: 'Medications', value: medications.length > 0 ? `${medications.length} active` : 'None' },
                { label: 'Daily Tasks', value: `${dailyTasks.length} tasks` },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                    {stat.value}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/pets/${pet.id}/checklist`)}
            style={{ borderRadius: 12, padding: 14 }}
          >
            ✅ Checklist
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/pets/${pet.id}/proof-of-life`)}
            style={{ borderRadius: 12, padding: 14 }}
          >
            📷 Photos
          </button>
        </div>

        {pet.feeding_instructions && (
          <InfoSection title="Feeding Instructions" emoji="🍽️">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {pet.feeding_instructions}
            </p>
          </InfoSection>
        )}

        {pet.approved_foods && (
          <InfoSection title="Approved Foods" emoji="✅">
            <p style={{ fontSize: '0.875rem', color: '#2D7A4F', lineHeight: 1.6, margin: 0, background: 'var(--success-light)', padding: '10px 12px', borderRadius: 8 }}>
              {pet.approved_foods}
            </p>
          </InfoSection>
        )}

        {pet.forbidden_foods && (
          <InfoSection title="Forbidden Foods" emoji="🚫">
            <p style={{ fontSize: '0.875rem', color: 'var(--danger)', lineHeight: 1.6, margin: 0, background: 'var(--danger-light)', padding: '10px 12px', borderRadius: 8 }}>
              {pet.forbidden_foods}
            </p>
          </InfoSection>
        )}

        {pet.emergency_notes && (
          <InfoSection title="Emergency Notes" emoji="🚨">
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: '0.875rem', color: '#92400E', lineHeight: 1.6, margin: 0 }}>
                {pet.emergency_notes}
              </p>
            </div>
          </InfoSection>
        )}

        <InfoSection title="Medications" emoji="💊">
          {medications.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No medications</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {medications.map((med) => (
                <div
                  key={med.id}
                  style={{ background: 'var(--danger-light)', borderRadius: 10, padding: 12, borderLeft: '3px solid var(--danger)' }}
                >
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                    {med.medication_name}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: med.special_instructions ? 4 : 0 }}>
                    {med.dosage && <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>{med.dosage}</span>}
                    {med.route && <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>{med.route}</span>}
                    {med.schedule_time && <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>{med.schedule_time}</span>}
                  </div>
                  {med.special_instructions && (
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {med.special_instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </InfoSection>

        <InfoSection title="Daily Tasks" emoji="📋">
          {dailyTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>No tasks yet</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/pets/${pet.id}/checklist`)}
                style={{ borderRadius: 8 }}
              >
                Open Checklist to Add Tasks
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dailyTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <span style={{ fontSize: '1rem' }}>
                      {task.task_type === 'feeding' ? '🍽️' : task.task_type === 'medication' ? '💊' : task.task_type === 'exercise' ? '🦮' : '🧹'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{task.task_name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.scheduled_time}</p>
                    </div>
                  </div>
                ))}
                {dailyTasks.length > 4 && (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    +{dailyTasks.length - 4} more tasks
                  </p>
                )}
              </div>
              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: 12, borderRadius: 10 }}
                onClick={() => navigate(`/pets/${pet.id}/checklist`)}
              >
                View Full Checklist
              </button>
            </>
          )}
        </InfoSection>

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: '100%',
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 12,
              padding: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9375rem',
            }}
          >
            {deleting ? 'Deleting...' : `🗑️ Delete ${pet.name}`}
          </button>
        </div>
      </div>

      <BottomNav firstPetId={id} />
    </div>
  );
}
