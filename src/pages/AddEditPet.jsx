import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { samplePets } from '../data/sampleData';

const defaultForm = {
  name: '',
  species: 'Dog',
  breed: '',
  age: '',
  feedingInstructions: '',
  approvedFoods: '',
  forbiddenFoods: '',
  emergencyNotes: '',
};

const defaultMed = { name: '', dosage: '', route: 'Oral', scheduleTime: '', specialInstructions: '' };

export default function AddEditPet() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const existingPet = isEditing ? samplePets.find((p) => p.id === id) : null;

  const [form, setForm] = useState(
    isEditing && existingPet
      ? {
          name: existingPet.name,
          species: existingPet.species,
          breed: existingPet.breed,
          age: String(existingPet.age),
          feedingInstructions: existingPet.feedingInstructions,
          approvedFoods: existingPet.approvedFoods,
          forbiddenFoods: existingPet.forbiddenFoods,
          emergencyNotes: existingPet.emergencyNotes,
        }
      : defaultForm
  );

  const [medications, setMedications] = useState(
    isEditing && existingPet ? existingPet.medications : []
  );
  const [showMedForm, setShowMedForm] = useState(false);
  const [newMed, setNewMed] = useState(defaultMed);
  const [activeSection, setActiveSection] = useState('basic');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleMedChange = (e) => setNewMed({ ...newMed, [e.target.name]: e.target.value });

  const addMedication = () => {
    if (!newMed.name) return;
    setMedications([...medications, { ...newMed, id: String(Date.now()) }]);
    setNewMed(defaultMed);
    setShowMedForm(false);
  };

  const removeMedication = (medId) => {
    setMedications(medications.filter((m) => m.id !== medId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const sections = [
    { key: 'basic', label: '🐾 Basic Info' },
    { key: 'care', label: '🍽️ Care' },
    { key: 'medical', label: '💊 Medical' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <PageHeader
        title={isEditing ? `Edit ${existingPet?.name || 'Pet'}` : 'Add New Pet'}
        backTo="/dashboard"
      />

      {/* Section tabs */}
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

      <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto' }}>
        {/* Basic Info */}
        {activeSection === 'basic' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Photo placeholder */}
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
                cursor: 'pointer',
                gap: 8,
              }}
            >
              <span style={{ fontSize: '3rem' }}>📷</span>
              <span style={{ color: 'white', fontWeight: 600 }}>Add Photo</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>Tap to upload</span>
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

        {/* Care instructions */}
        {activeSection === 'care' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="feedingInstructions">
                Feeding Instructions *
              </label>
              <textarea
                id="feedingInstructions"
                name="feedingInstructions"
                className="form-textarea"
                placeholder="How much food, how often, specific brands, water requirements..."
                value={form.feedingInstructions}
                onChange={handleChange}
                style={{ minHeight: 100 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="approvedFoods">
                ✅ Approved Foods
              </label>
              <textarea
                id="approvedFoods"
                name="approvedFoods"
                className="form-textarea"
                placeholder="Safe treats and human foods (carrots, apples...)"
                value={form.approvedFoods}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="forbiddenFoods">
                🚫 Forbidden Foods
              </label>
              <textarea
                id="forbiddenFoods"
                name="forbiddenFoods"
                className="form-textarea"
                placeholder="Dangerous or toxic foods to avoid..."
                value={form.forbiddenFoods}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emergencyNotes">
                🚨 Emergency / Special Notes
              </label>
              <textarea
                id="emergencyNotes"
                name="emergencyNotes"
                className="form-textarea"
                placeholder="Allergies, behavioral notes, emergency contacts, vet info..."
                value={form.emergencyNotes}
                onChange={handleChange}
                style={{ minHeight: 100 }}
              />
            </div>
          </div>
        )}

        {/* Medical / Medications */}
        {activeSection === 'medical' && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="section-header">
                <span className="section-title">Medications</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowMedForm(!showMedForm)}
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
                      💊 {med.name}
                    </p>
                    <p style={{ fontSize: '0.8125rem', margin: '0 0 2px', color: 'var(--text-muted)' }}>
                      {med.dosage} · {med.route} · {med.scheduleTime}
                    </p>
                    {med.specialInstructions && (
                      <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-light)', fontStyle: 'italic' }}>
                        {med.specialInstructions}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => removeMedication(med.id)}
                    style={{ width: 32, height: 32, fontSize: '1rem', marginLeft: 8 }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {showMedForm && (
                <div className="card" style={{ marginTop: 8, padding: 16, background: 'var(--primary-light)', border: '1.5px solid var(--primary)' }}>
                  <h3 style={{ marginBottom: 14, color: 'var(--primary)' }}>New Medication</h3>
                  <div className="form-group">
                    <label className="form-label">Medication name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="e.g. Apoquel"
                      value={newMed.name}
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
                    <input type="text" name="scheduleTime" className="form-input" placeholder="Morning with food" value={newMed.scheduleTime} onChange={handleMedChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Special instructions</label>
                    <textarea name="specialInstructions" className="form-textarea" placeholder="Any important notes..." value={newMed.specialInstructions} onChange={handleMedChange} style={{ minHeight: 60 }} />
                  </div>
                  <button type="button" className="btn btn-primary btn-full" onClick={addMedication}>
                    Add Medication
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sticky footer CTA */}
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
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
            {isEditing ? 'Save Changes' : 'Add Pet'} 🐾
          </button>
        </div>
      </form>
    </div>
  );
}
