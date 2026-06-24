import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const defaultForm = {
  name: '',
  species: 'Dog',
  breed: '',
  age: '',
  feeding_instructions: '',
  approved_foods: '',
  forbidden_foods: '',
  emergency_notes: '',
};

const defaultMed = {
  medication_name: '',
  dosage: '',
  route: 'Oral',
  schedule_time: '',
  special_instructions: '',
};

export default function AddEditPet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [medications, setMedications] = useState([]);
  const [showMedForm, setShowMedForm] = useState(false);
  const [newMed, setNewMed] = useState(defaultMed);
  const [editingMedId, setEditingMedId] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [petName, setPetName] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    supabase
      .from('pets')
      .select('*, medications(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) { setError('Pet not found.'); setLoading(false); return; }
        setPetName(data.name);
        setForm({
          name: data.name || '',
          species: data.species || 'Dog',
          breed: data.breed || '',
          age: data.age != null ? String(data.age) : '',
          feeding_instructions: data.feeding_instructions || '',
          approved_foods: data.approved_foods || '',
          forbidden_foods: data.forbidden_foods || '',
          emergency_notes: data.emergency_notes || '',
        });
        setMedications(data.medications || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleMedChange = (e) => {
    const { name, value } = e.target;
    setNewMed(prev => ({ ...prev, [name]: value }));
  };

  function startEditMedication(med) {
    setEditingMedId(med.id);
    setNewMed({
      medication_name: med.medication_name || '',
      dosage: med.dosage || '',
      route: med.route || 'Oral',
      schedule_time: med.schedule_time || '',
      special_instructions: med.special_instructions || '',
    });
    setShowMedForm(true);
  }

  async function addMedication() {
    if (!newMed.medication_name.trim()) return;
    setError('');

    if (editingMedId) {
      if (isEditing && !String(editingMedId).startsWith('temp-')) {
        const { data, error } = await supabase
          .from('medications')
          .update(newMed)
          .eq('id', editingMedId)
          .select()
          .single();
        if (error) { setError('Failed to update medication: ' + error.message); return; }
        setMedications(medications.map((m) => (m.id === editingMedId ? data : m)));
      } else {
        setMedications(medications.map((m) => (m.id === editingMedId ? { ...m, ...newMed } : m)));
      }
      setEditingMedId(null);
    } else if (isEditing) {
      const { data, error } = await supabase
        .from('medications')
        .insert({ ...newMed, pet_id: id })
        .select()
        .single();

      if (error) {
        setError('Failed to add medication: ' + error.message);
        return;
      }
      setMedications([...medications, data]);
    } else {
      setMedications([...medications, { ...newMed, id: `temp-${Date.now()}` }]);
    }

    setNewMed(defaultMed);
    setShowMedForm(false);
  }

  async function removeMedication(medId) {
    if (isEditing && !String(medId).startsWith('temp-')) {
      const { error } = await supabase.from('medications').delete().eq('id', medId);
      if (error) {
        setError('Failed to remove medication: ' + error.message);
        return;
      }
    }
    setMedications(medications.filter((m) => m.id !== medId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Pet name is required.');
      return;
    }
    setError('');
    setSubmitting(true);

    const petData = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim() || null,
      age: form.age !== '' ? parseInt(form.age, 10) : null,
      feeding_instructions: form.feeding_instructions.trim() || null,
      approved_foods: form.approved_foods.trim() || null,
      forbidden_foods: form.forbidden_foods.trim() || null,
      emergency_notes: form.emergency_notes.trim() || null,
      photo_url: null,
    };

    if (isEditing) {
      const { error } = await supabase.from('pets').update(petData).eq('id', id);
      if (error) {
        setError('Failed to update pet: ' + error.message);
        setSubmitting(false);
        return;
      }
    } else {
      const { data: newPet, error } = await supabase
        .from('pets')
        .insert({ ...petData, user_id: user.id })
        .select()
        .single();

      if (error) {
        setError('Failed to create pet: ' + error.message);
        setSubmitting(false);
        return;
      }

      const tempMeds = medications.filter((m) => String(m.id).startsWith('temp-'));
      if (tempMeds.length > 0) {
        const medsToInsert = tempMeds.map((med) => ({
        medication_name: med.medication_name,
        dosage: med.dosage,
        route: med.route,
        schedule_time: med.schedule_time,
        special_instructions: med.special_instructions,
        pet_id: newPet.id,
      }));
        const { error: medError } = await supabase.from('medications').insert(medsToInsert);
        if (medError) {
          setError('Pet saved but could not save medications: ' + medError.message);
          setSubmitting(false);
          navigate('/dashboard');
          return;
        }
      }
    }

    setSubmitting(false);
    navigate('/dashboard');
  }

  const sections = [
    { key: 'basic', label: '🐾 Basic Info' },
    { key: 'care', label: '🍽️ Care' },
    { key: 'medical', label: '💊 Medical' },
  ];

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <PageHeader
        title={isEditing ? `Edit ${petName || 'Pet'}` : 'Add New Pet'}
        backTo="/dashboard"
      />

      <div
        style={{
          display: 'flex',
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
          gap: 0,
        }}
      >
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              flex: 1,
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.8125rem',
              fontWeight: activeSection === s.key ? 600 : 400,
              color: activeSection === s.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeSection === s.key ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ margin: '12px 16px 0', background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto' }}>
        {activeSection === 'basic' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '3/2',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                gap: 8,
              }}
            >
              <span style={{ fontSize: '3rem' }}>📷</span>
              <span style={{ color: 'white', fontWeight: 600 }}>Add Photo</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>Coming soon</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Pet name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Mochi"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="species">Species *</label>
                <select
                  id="species"
                  name="species"
                  className="form-select"
                  value={form.species}
                  onChange={handleChange}
                >
                  {['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="age">Age (years)</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 3"
                  value={form.age}
                  onChange={handleChange}
                  min="0"
                  max="30"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="breed">Breed</label>
              <input
                id="breed"
                name="breed"
                type="text"
                className="form-input"
                placeholder="e.g. Golden Retriever"
                value={form.breed}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {activeSection === 'care' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="feeding_instructions">Feeding Instructions</label>
              <textarea
                id="feeding_instructions"
                name="feeding_instructions"
                className="form-textarea"
                placeholder="How much food, how often, specific brands, water requirements..."
                value={form.feeding_instructions}
                onChange={handleChange}
                style={{ minHeight: 100 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="approved_foods">✅ Approved Foods</label>
              <textarea
                id="approved_foods"
                name="approved_foods"
                className="form-textarea"
                placeholder="Safe treats and human foods (carrots, apples...)"
                value={form.approved_foods}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="forbidden_foods">🚫 Forbidden Foods</label>
              <textarea
                id="forbidden_foods"
                name="forbidden_foods"
                className="form-textarea"
                placeholder="Dangerous or toxic foods to avoid..."
                value={form.forbidden_foods}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emergency_notes">🚨 Emergency / Special Notes</label>
              <textarea
                id="emergency_notes"
                name="emergency_notes"
                className="form-textarea"
                placeholder="Allergies, behavioral notes, emergency contacts, vet info..."
                value={form.emergency_notes}
                onChange={handleChange}
                style={{ minHeight: 100 }}
              />
            </div>
          </div>
        )}

        {activeSection === 'medical' && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="section-header">
                <span className="section-title">Medications</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowMedForm(!showMedForm); setEditingMedId(null); setNewMed(defaultMed); }}
                  style={{ borderRadius: 8 }}
                >
                  {showMedForm ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {medications.length === 0 && !showMedForm && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>💊</div>
                  <p style={{ fontSize: '0.875rem' }}>No medications added yet</p>
                </div>
              )}

              {medications.map((med) => (
                <div
                  key={med.id}
                  className="card"
                  style={{ marginBottom: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>
                      💊 {med.medication_name}
                    </p>
                    <p style={{ fontSize: '0.8125rem', margin: '0 0 2px', color: 'var(--text-muted)' }}>
                      {[med.dosage, med.route, med.schedule_time].filter(Boolean).join(' · ')}
                    </p>
                    {med.special_instructions && (
                      <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-light)', fontStyle: 'italic' }}>
                        {med.special_instructions}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-icon"
                      onClick={() => startEditMedication(med)}
                      style={{ width: 32, height: 32, fontSize: '0.875rem' }}
                      title="Edit medication"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => removeMedication(med.id)}
                      style={{ width: 32, height: 32, fontSize: '1rem' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {showMedForm && (
                <div className="card" style={{ marginTop: 8, padding: 16, background: 'var(--primary-light)', border: '1.5px solid var(--primary)' }}>
                  <h3 style={{ marginBottom: 14, color: 'var(--primary)' }}>{editingMedId ? 'Edit Medication' : 'New Medication'}</h3>
                  <div className="form-group">
                    <label className="form-label">Medication name *</label>
                    <input
                      type="text"
                      name="medication_name"
                      className="form-input"
                      placeholder="e.g. Apoquel"
                      value={newMed.medication_name}
                      onChange={handleMedChange}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Dosage</label>
                      <input type="text" name="dosage" className="form-input" placeholder="16mg" value={newMed.dosage} onChange={handleMedChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Route</label>
                      <select name="route" className="form-select" value={newMed.route} onChange={handleMedChange}>
                        {['Oral', 'Topical', 'Injection', 'Eye drops', 'Ear drops', 'Other'].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Schedule / Time</label>
                    <input type="text" name="schedule_time" className="form-input" placeholder="Morning with food" value={newMed.schedule_time} onChange={handleMedChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Special instructions</label>
                    <textarea name="special_instructions" className="form-textarea" placeholder="Any important notes..." value={newMed.special_instructions} onChange={handleMedChange} style={{ minHeight: 60 }} />
                  </div>
                  <button type="button" className="btn btn-primary btn-full" onClick={addMedication}>
                    {editingMedId ? 'Save Changes' : 'Add Medication'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            padding: 16,
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
            {submitting ? 'Saving...' : isEditing ? 'Save Changes 🐾' : 'Add Pet 🐾'}
          </button>
        </div>
      </form>
    </div>
  );
}
