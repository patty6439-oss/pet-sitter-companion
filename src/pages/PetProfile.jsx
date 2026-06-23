import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { samplePets } from '../data/sampleData';

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
  const pet = samplePets.find((p) => p.id === id) || samplePets[0];

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
        {/* Hero card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              background: pet.gradient,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5rem',
            }}
          >
            {pet.emoji}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>{pet.name}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                  {pet.breed}
                </p>
              </div>
              <span className="badge badge-blue">{pet.species}</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Age', value: `${pet.age} yr${pet.age !== 1 ? 's' : ''}` },
                { label: 'Medications', value: pet.medications.length > 0 ? `${pet.medications.length} active` : 'None' },
                { label: 'Daily Tasks', value: `${pet.dailyTasks.length} tasks` },
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

        {/* Action buttons */}
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

        {/* Feeding instructions */}
        <InfoSection title="Feeding Instructions" emoji="🍽️">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            {pet.feedingInstructions}
          </p>
        </InfoSection>

        {/* Approved foods */}
        <InfoSection title="Approved Foods" emoji="✅">
          <p style={{ fontSize: '0.875rem', color: '#2D7A4F', lineHeight: 1.6, margin: 0, background: 'var(--success-light)', padding: '10px 12px', borderRadius: 8 }}>
            {pet.approvedFoods}
          </p>
        </InfoSection>

        {/* Forbidden foods */}
        <InfoSection title="Forbidden Foods" emoji="🚫">
          <p style={{ fontSize: '0.875rem', color: 'var(--danger)', lineHeight: 1.6, margin: 0, background: 'var(--danger-light)', padding: '10px 12px', borderRadius: 8 }}>
            {pet.forbiddenFoods}
          </p>
        </InfoSection>

        {/* Emergency notes */}
        {pet.emergencyNotes && (
          <InfoSection title="Emergency Notes" emoji="🚨">
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: '#92400E', lineHeight: 1.6, margin: 0 }}>
                {pet.emergencyNotes}
              </p>
            </div>
          </InfoSection>
        )}

        {/* Medications */}
        <InfoSection title="Medications" emoji="💊">
          {pet.medications.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>No medications</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pet.medications.map((med, i) => (
                <div
                  key={med.id}
                  style={{
                    background: 'var(--danger-light)',
                    borderRadius: 10,
                    padding: 12,
                    borderLeft: '3px solid var(--danger)',
                  }}
                >
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                    {med.name}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>{med.dosage}</span>
                    <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>{med.route}</span>
                    <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>{med.scheduleTime}</span>
                  </div>
                  {med.specialInstructions && (
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {med.specialInstructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </InfoSection>

        {/* Daily tasks preview */}
        <InfoSection title="Daily Tasks" emoji="📋">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pet.dailyTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '1rem' }}>
                  {task.type === 'feeding' ? '🍽️' : task.type === 'medication' ? '💊' : task.type === 'exercise' ? '🦮' : '🧹'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{task.name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.time}</p>
                </div>
              </div>
            ))}
            {pet.dailyTasks.length > 4 && (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                +{pet.dailyTasks.length - 4} more tasks
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
        </InfoSection>
      </div>

      <BottomNav />
    </div>
  );
}
