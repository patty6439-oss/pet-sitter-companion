import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { samplePets, taskTypeConfig } from '../data/sampleData';

const TIME_GROUPS = [
  { key: 'morning', label: 'Morning', icon: '🌅', range: [0, 11] },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', range: [12, 16] },
  { key: 'evening', label: 'Evening', icon: '🌙', range: [17, 23] },
];

function getTimeGroup(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 'morning';
  let h = parseInt(match[1]);
  const pm = match[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function DailyChecklist() {
  const navigate = useNavigate();
  const { id } = useParams();
  const pet = samplePets.find((p) => p.id === id) || samplePets[0];

  const [tasks, setTasks] = useState(pet.dailyTasks);
  const [selectedPetId, setSelectedPetId] = useState(pet.id);

  const toggleTask = (taskId) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="page">
      <PageHeader
        title={`${pet.name}'s Checklist`}
        backTo="/dashboard"
        rightAction={
          <select
            className="form-select"
            value={selectedPetId}
            onChange={(e) => {
              setSelectedPetId(e.target.value);
              navigate(`/pets/${e.target.value}/checklist`);
            }}
            style={{ fontSize: '0.8125rem', padding: '6px 10px', width: 'auto', minWidth: 100 }}
          >
            {samplePets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="page-content">
        {/* Progress summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{today}</p>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>
                {completedCount === tasks.length && tasks.length > 0
                  ? '🎉 All done!'
                  : `${completedCount} of ${tasks.length} completed`}
              </h2>
            </div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `conic-gradient(var(--success) ${progress * 3.6}deg, var(--border) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: 'var(--success)',
                }}
              >
                {Math.round(progress)}%
              </div>
            </div>
          </div>
          <div className="progress-bar-wrap" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Pet selector strip */}
        <div className="scroll-x" style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
          {samplePets.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/pets/${p.id}/checklist`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 20,
                border: `2px solid ${p.id === pet.id ? 'var(--primary)' : 'var(--border)'}`,
                background: p.id === pet.id ? 'var(--primary-light)' : 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: p.id === pet.id ? 600 : 400,
                color: p.id === pet.id ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Tasks by time group */}
        {TIME_GROUPS.map((group) => {
          const groupTasks = tasks.filter((t) => getTimeGroup(t.time) === group.key);
          if (groupTasks.length === 0) return null;
          const groupDone = groupTasks.filter((t) => t.completed).length;

          return (
            <div key={group.key}>
              <div className="section-header">
                <span className="section-title">
                  {group.icon} {group.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {groupDone}/{groupTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groupTasks.map((task) => {
                  const config = taskTypeConfig[task.type] || taskTypeConfig.other;
                  return (
                    <div
                      key={task.id}
                      className="card"
                      style={{
                        padding: 14,
                        opacity: task.completed ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        border: task.completed ? '1.5px solid var(--success)' : '1.5px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            border: task.completed ? 'none' : '2px solid var(--border)',
                            background: task.completed ? 'var(--success)' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginTop: 1,
                            fontSize: '0.875rem',
                            color: 'white',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {task.completed ? '✓' : ''}
                        </button>

                        {/* Task info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 600,
                                fontSize: '0.9375rem',
                                color: task.completed ? 'var(--text-muted)' : 'var(--text)',
                                textDecoration: task.completed ? 'line-through' : 'none',
                              }}
                            >
                              {task.name}
                            </p>
                          </div>
                          <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {task.instructions}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 20,
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                background: config.bg,
                                color: config.color,
                              }}
                            >
                              {config.icon} {config.label}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              ⏰ {task.time}
                            </span>
                          </div>
                        </div>

                        {/* Photo proof button */}
                        {task.completed && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/pets/${pet.id}/proof-of-life`)}
                            style={{ padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem', flexShrink: 0 }}
                          >
                            📷
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add proof of life CTA */}
        {completedCount > 0 && (
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--primary-light), #f0e8ff)',
              border: '1px solid rgba(74,127,229,0.3)',
              padding: 16,
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--primary)' }}>
              📷 Share proof of life!
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Pet owners love photo updates
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/pets/${pet.id}/proof-of-life`)}
              style={{ borderRadius: 8 }}
            >
              Upload Photos
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
