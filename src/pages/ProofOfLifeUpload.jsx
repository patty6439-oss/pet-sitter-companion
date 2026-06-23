import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { samplePets } from '../data/sampleData';

const SAMPLE_PHOTOS = [
  { id: 'p1', emoji: '🐕', caption: 'Morning walk done!', time: '8:12 AM', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'p2', emoji: '😴', caption: 'Post-walk nap time', time: '9:30 AM', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'p3', emoji: '🍽️', caption: 'Ate all breakfast!', time: '7:05 AM', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
];

export default function ProofOfLifeUpload() {
  const navigate = useNavigate();
  const { id } = useParams();
  const pet = samplePets.find((p) => p.id === id) || samplePets[0];

  const [dragActive, setDragActive] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [photos, setPhotos] = useState(SAMPLE_PHOTOS);
  const [uploaded, setUploaded] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); };

  const handleUpload = () => {
    if (!caption.trim()) return;
    const newPhoto = {
      id: String(Date.now()),
      emoji: pet.emoji,
      caption: caption,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      gradient: pet.gradient,
    };
    setPhotos([newPhoto, ...photos]);
    setCaption('');
    setSelectedTask('');
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  };

  const completedTasks = pet.dailyTasks.filter((t) => t.completed);

  return (
    <div className="page">
      <PageHeader title="Proof of Life" backTo={`/pets/${pet.id}/checklist`} />

      <div className="page-content">
        {/* Pet context */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: pet.gradient,
            padding: 14,
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>{pet.emoji}</span>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'white', fontSize: '1.0625rem' }}>
              {pet.name}
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem' }}>
              {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed today
            </p>
          </div>
        </div>

        {/* Success toast */}
        {uploaded && (
          <div
            style={{
              background: 'var(--success)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>✅</span>
            Photo uploaded successfully!
          </div>
        )}

        {/* Upload area */}
        <div
          className={`upload-area ${dragActive ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {}}
        >
          <span className="upload-icon">📸</span>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Drag &amp; drop a photo here
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            or tap to open camera / gallery
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}>
              📷 Camera
            </button>
            <button className="btn btn-secondary btn-sm" style={{ borderRadius: 8 }}>
              🖼️ Gallery
            </button>
          </div>
        </div>

        {/* Caption + task link */}
        <div className="card">
          <h3 style={{ margin: '0 0 14px', fontSize: '0.9375rem' }}>Photo Details</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="task">Link to completed task (optional)</label>
            <select
              id="task"
              className="form-select"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
            >
              <option value="">— Select a task —</option>
              {pet.dailyTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.completed ? '✅' : '⬜'} {task.name} ({task.time})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="caption">Caption *</label>
            <textarea
              id="caption"
              className="form-textarea"
              placeholder={`Tell the owner how ${pet.name} is doing...`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ minHeight: 72 }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>
              {caption.length}/200 characters
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleUpload}
          disabled={!caption.trim()}
          style={{
            padding: 14,
            opacity: caption.trim() ? 1 : 0.5,
          }}
        >
          📤 Upload Photo
        </button>

        {/* Previously uploaded */}
        <div className="section-header" style={{ marginTop: 4 }}>
          <span className="section-title">Today&apos;s Photos</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {photos.length} uploaded
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p className="empty-state-title">No photos yet</p>
            <p className="empty-state-desc">Upload the first photo to share with the owner!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 80,
                    background: photo.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    flexShrink: 0,
                  }}
                >
                  {photo.emoji}
                </div>
                {/* Details */}
                <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.4 }}>
                    {photo.caption}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ⏰ {photo.time} · {pet.name}
                  </p>
                </div>
                {/* Delete */}
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ margin: 8, fontSize: '1rem', color: 'var(--text-light)', flexShrink: 0 }}
                  onClick={() => setPhotos(photos.filter((p) => p.id !== photo.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Owner share CTA */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #2D3748, #4A5568)',
            border: 'none',
            textAlign: 'center',
            padding: 20,
          }}
        >
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'white', fontSize: '0.9375rem' }}>
            📱 Share with owner
          </p>
          <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>
            Photos are automatically shared when the owner views their app
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              className="btn btn-sm"
              style={{ background: '#25D366', color: 'white', borderRadius: 8 }}
            >
              WhatsApp
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 8 }}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
