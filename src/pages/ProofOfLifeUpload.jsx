import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import { getPetEmoji, getPetGradient } from '../utils/petHelpers';

export default function ProofOfLifeUpload() {
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const [pet, setPet] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCareLogId, setSelectedCareLogId] = useState('');
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: petData, error: petErr } = await supabase
        .from('pets')
        .select('id, name, species')
        .eq('id', id)
        .single();

      if (petErr || !petData) {
        setError('Pet not found.');
        setLoading(false);
        return;
      }
      setPet(petData);

      const { data: tasks } = await supabase
        .from('daily_tasks')
        .select('id, task_name, scheduled_time')
        .eq('pet_id', id);

      if (tasks && tasks.length > 0) {
        const taskIds = tasks.map((t) => t.id);

        const { data: logs } = await supabase
          .from('care_logs')
          .select('id, daily_task_id')
          .in('daily_task_id', taskIds)
          .gte('created_at', `${todayStr}T00:00:00`)
          .lte('created_at', `${todayStr}T23:59:59`)
          .eq('completed', true);

        const logMap = {};
        (logs || []).forEach((l) => { logMap[l.daily_task_id] = l.id; });

        const done = tasks
          .filter((t) => logMap[t.id])
          .map((t) => ({ task: t, careLogId: logMap[t.id] }));
        setCompletedTasks(done);

        if (done.length > 0) {
          const careLogIds = done.map((d) => d.careLogId);
          const { data: photoData } = await supabase
            .from('proof_of_life_photos')
            .select('*')
            .in('care_log_id', careLogIds)
            .order('uploaded_at', { ascending: false });

          const logToTask = {};
          done.forEach((d) => { logToTask[d.careLogId] = d.task.task_name; });
          setPhotos(
            (photoData || []).map((p) => ({ ...p, taskName: logToTask[p.care_log_id] }))
          );
        }
      }

      setLoading(false);
    }
    load();
  }, [id, todayStr]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileDataUrl(ev.target.result);
      setPreviewUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!selectedCareLogId) { setError('Please select a completed task.'); return; }
    if (!fileDataUrl && !caption.trim()) { setError('Add a photo or a caption.'); return; }
    setError('');
    setUploading(true);

    const photoUrl = fileDataUrl || 'caption-only';

    const { data: newPhoto, error: insertErr } = await supabase
      .from('proof_of_life_photos')
      .insert({
        care_log_id: selectedCareLogId,
        photo_url: photoUrl,
        caption: caption.trim() || null,
      })
      .select()
      .single();

    setUploading(false);

    if (insertErr) {
      setError('Failed to save: ' + insertErr.message);
      return;
    }

    const taskEntry = completedTasks.find((d) => d.careLogId === selectedCareLogId);
    setPhotos((prev) => [{ ...newPhoto, taskName: taskEntry?.task.task_name }, ...prev]);
    setCaption('');
    setFileDataUrl(null);
    setPreviewUrl(null);
    setSelectedCareLogId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  }

  async function handleDelete(photoId) {
    await supabase.from('proof_of_life_photos').delete().eq('id', photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

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
        <PageHeader title="Proof of Life" backTo="/dashboard" />
        <div className="page-content">
          <div style={{ color: 'var(--danger)', padding: 16 }}>{error || 'Pet not found'}</div>
        </div>
      </div>
    );
  }

  const canUpload = selectedCareLogId && (fileDataUrl || caption.trim());

  return (
    <div className="page">
      <PageHeader title="Proof of Life" backTo={`/pets/${id}/checklist`} />

      <div className="page-content">
        {/* Pet banner */}
        <div
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: getPetGradient(pet.species), padding: 14 }}
        >
          <span style={{ fontSize: '2.5rem' }}>{getPetEmoji(pet.species)}</span>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'white', fontSize: '1.0625rem' }}>
              {pet.name}
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem' }}>
              {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed today
            </p>
          </div>
        </div>

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
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>✅</span>
            Photo uploaded successfully!
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Upload form */}
        <div className="card">
          <h3 style={{ margin: '0 0 14px', fontSize: '0.9375rem' }}>Upload Proof of Life</h3>

          {completedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.875rem' }}>
                Complete a task on the checklist first — then you can upload a photo here.
              </p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Link to completed task *</label>
                <select
                  className="form-select"
                  value={selectedCareLogId}
                  onChange={(e) => setSelectedCareLogId(e.target.value)}
                >
                  <option value="">— Select a task —</option>
                  {completedTasks.map((d) => (
                    <option key={d.careLogId} value={d.careLogId}>
                      ✅ {d.task.task_name}{d.task.scheduled_time ? ` (${d.task.scheduled_time})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* File picker */}
              <div className="form-group">
                <label className="form-label">Photo</label>
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center',
                    background: previewUrl ? 'transparent' : 'var(--bg)',
                    cursor: 'pointer',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }}
                    />
                  ) : (
                    <>
                      <span style={{ fontSize: '2rem' }}>📸</span>
                      <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Tap to choose a photo
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {previewUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8, borderRadius: 8 }}
                    onClick={() => { setPreviewUrl(null); setFileDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  >
                    Remove photo
                  </button>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="caption">Caption</label>
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
            </>
          )}
        </div>

        {completedTasks.length > 0 && (
          <button
            className="btn btn-primary btn-full"
            onClick={handleUpload}
            disabled={!canUpload || uploading}
            style={{ padding: 14, opacity: canUpload && !uploading ? 1 : 0.5 }}
          >
            {uploading ? 'Saving...' : '📤 Upload Proof of Life'}
          </button>
        )}

        {/* Gallery */}
        <div className="section-header" style={{ marginTop: 4 }}>
          <span className="section-title">Today&apos;s Photos</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{photos.length} uploaded</span>
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
                style={{ padding: 0, overflow: 'hidden' }}
              >
                {photo.photo_url && photo.photo_url !== 'caption-only' && (
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || 'Proof of life'}
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                  />
                )}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    {photo.caption && (
                      <p style={{ margin: '0 0 4px', fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {photo.caption}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ✅ {photo.taskName || 'Task'} · {pet.name}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ fontSize: '1rem', color: 'var(--text-light)', flexShrink: 0 }}
                    onClick={() => handleDelete(photo.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav firstPetId={id} />
    </div>
  );
}
