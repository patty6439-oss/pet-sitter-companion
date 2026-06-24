import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { getPetEmoji } from '../utils/petHelpers';

const taskTypeConfig = {
  feeding:    { icon: '🍽️', label: 'Feeding',    color: '#F6AD55', bg: '#FFFBEB' },
  medication: { icon: '💊', label: 'Medication', color: '#FC6060', bg: '#FFF5F5' },
  exercise:   { icon: '🦮', label: 'Exercise',   color: '#56C176', bg: '#EDFBF2' },
  hygiene:    { icon: '🧹', label: 'Hygiene',    color: '#4A7FE5', bg: '#EEF3FF' },
  other:      { icon: '📋', label: 'Other',      color: '#94A3B8', bg: '#F1F5F9' },
};

const TIME_GROUPS = [
  { key: 'morning',   label: 'Morning',   icon: '🌅', range: [0, 11] },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', range: [12, 16] },
  { key: 'evening',   label: 'Evening',   icon: '🌙', range: [17, 23] },
];

function getTimeGroup(timeStr) {
  if (!timeStr) return 'morning';
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

const defaultNewTask = { task_name: '', task_type: 'other', scheduled_time: '', instructions: '' };

export default function DailyChecklist() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [careLogMap, setCareLogMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState(defaultNewTask);
  const [addingTask, setAddingTask] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  async function loadTasksAndLogs(petId) {
    const { data: taskData, error: taskError } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('pet_id', petId)
      .order('scheduled_time', { ascending: true });

    if (taskError) {
      setError('Failed to load tasks.');
      return;
    }

    const taskList = taskData || [];
    setTasks(taskList);

    if (taskList.length === 0) {
      setCompletedIds(new Set());
      setCareLogMap({});
      return;
    }

    const taskIds = taskList.map((t) => t.id);
    const { data: logData } = await supabase
      .from('care_logs')
      .select('id, daily_task_id, completed')
      .in('daily_task_id', taskIds)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lt('created_at', `${todayStr}T23:59:59`)
      .eq('completed', true);

    const logs = logData || [];
    const logLookup = {};
    logs.forEach((l) => { logLookup[l.daily_task_id] = l.id; });

    setCompletedIds(new Set(Object.keys(logLookup)));
    setCareLogMap(logLookup);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from('pets').select('id, name, species').eq('id', id).single(),
      supabase.from('pets').select('id, name, species').order('created_at', { ascending: true }),
    ]).then(async ([petRes, petsRes]) => {
      if (!active) return;
      if (petRes.error || !petRes.data) { setError('Pet not found.'); setLoading(false); return; }
      setPet(petRes.data);
      setAllPets(petsRes.data || []);
      await loadTasksAndLogs(id);
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleTask(taskId) {
    if (completedIds.has(taskId)) {
      const careLogId = careLogMap[taskId];
      if (!careLogId) return;
      const { error } = await supabase.from('care_logs').delete().eq('id', careLogId);
      if (error) { setError('Failed to update task.'); return; }

      setCompletedIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
      setCareLogMap((prev) => { const m = { ...prev }; delete m[taskId]; return m; });
    } else {
      const { data, error } = await supabase
        .from('care_logs')
        .insert({ daily_task_id: taskId, completed: true })
        .select()
        .single();

      if (error) { setError('Failed to update task.'); return; }

      setCompletedIds((prev) => new Set([...prev, taskId]));
      setCareLogMap((prev) => ({ ...prev, [taskId]: data.id }));
    }
  }

  async function deleteTask(taskId) {
    await supabase.from('care_logs').delete().eq('daily_task_id', taskId);
    const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
    if (error) { setError('Failed to delete task.'); return; }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.task_name.trim()) return;
    setAddingTask(true);

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert({
        pet_id: id,
        task_name: newTask.task_name.trim(),
        task_type: newTask.task_type,
        scheduled_time: newTask.scheduled_time.trim() || '',
        instructions: newTask.instructions.trim() || '',
      })
      .select()
      .single();

    setAddingTask(false);
    if (error) { setError('Failed to add task: ' + error.message); return; }

    setTasks((prev) => [...prev, data]);
    setNewTask(defaultNewTask);
    setShowAddTask(false);
  }

  const completedCount = completedIds.size;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="page">
        <PageHeader title="Checklist" backTo="/dashboard" />
        <div className="page-content">
          <div style={{ color: 'var(--danger)', padding: 16 }}>{error || 'Pet not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={`${pet.name}'s Checklist`}
        backTo="/dashboard"
        rightAction={
          allPets.length > 1 ? (
            <select
              className="form-select"
              value={id}
              onChange={(e) => navigate(`/pets/${e.target.value}/checklist`)}
              style={{ fontSize: '0.8125rem', padding: '6px 10px', width: 'auto', minWidth: 100 }}
            >
              {allPets.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPetEmoji(p.species)} {p.name}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      <div className="page-content">
        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Progress summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{today}</p>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>
                {tasks.length === 0
                  ? 'No tasks yet'
                  : completedCount === tasks.length
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
        {allPets.length > 1 && (
          <div className="scroll-x" style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
            {allPets.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/pets/${p.id}/checklist`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `2px solid ${p.id === id ? 'var(--primary)' : 'var(--border)'}`,
                  background: p.id === id ? 'var(--primary-light)' : 'white',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: p.id === id ? 600 : 400,
                  color: p.id === id ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                <span>{getPetEmoji(p.species)}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Add task button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddTask(!showAddTask)}
            style={{ borderRadius: 8 }}
          >
            {showAddTask ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {/* Add task form */}
        {showAddTask && (
          <form onSubmit={handleAddTask} className="card" style={{ padding: 16, background: 'var(--primary-light)', border: '1.5px solid var(--primary)' }}>
            <h3 style={{ margin: '0 0 14px', color: 'var(--primary)' }}>New Task</h3>
            <div className="form-group">
              <label className="form-label">Task name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Morning Walk"
                value={newTask.task_name}
                onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={newTask.task_type}
                  onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                >
                  {Object.entries(taskTypeConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="7:00 AM"
                  value={newTask.scheduled_time}
                  onChange={(e) => setNewTask({ ...newTask, scheduled_time: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Instructions</label>
              <input
                type="text"
                className="form-input"
                placeholder="Any notes..."
                value={newTask.instructions}
                onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={addingTask}>
              {addingTask ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        )}

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <p style={{ fontSize: '0.875rem' }}>No tasks yet — add one above</p>
          </div>
        ) : (
          TIME_GROUPS.map((group) => {
            const groupTasks = tasks.filter((t) => getTimeGroup(t.scheduled_time) === group.key);
            if (groupTasks.length === 0) return null;
            const groupDone = groupTasks.filter((t) => completedIds.has(t.id)).length;

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
                    const completed = completedIds.has(task.id);
                    const config = taskTypeConfig[task.task_type] || taskTypeConfig.other;

                    return (
                      <div
                        key={task.id}
                        className="card"
                        style={{
                          padding: 14,
                          opacity: completed ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          border: completed ? '1.5px solid var(--success)' : '1.5px solid transparent',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <button
                            onClick={() => toggleTask(task.id)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              border: completed ? 'none' : '2px solid var(--border)',
                              background: completed ? 'var(--success)' : 'white',
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
                            {completed ? '✓' : ''}
                          </button>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: 600,
                                  fontSize: '0.9375rem',
                                  color: completed ? 'var(--text-muted)' : 'var(--text)',
                                  textDecoration: completed ? 'line-through' : 'none',
                                }}
                              >
                                {task.task_name}
                              </p>
                            </div>
                            {task.instructions && (
                              <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {task.instructions}
                              </p>
                            )}
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
                              {task.scheduled_time && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                  ⏰ {task.scheduled_time}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {completed && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/pets/${id}/proof-of-life`)}
                                style={{ padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem' }}
                              >
                                📷
                              </button>
                            )}
                            <button
                              onClick={() => deleteTask(task.id)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: 'none',
                                background: 'var(--danger-light)',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete task"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

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
              onClick={() => navigate(`/pets/${id}/proof-of-life`)}
              style={{ borderRadius: 8 }}
            >
              Upload Photos
            </button>
          </div>
        )}
      </div>

      <BottomNav firstPetId={id} />
    </div>
  );
}
