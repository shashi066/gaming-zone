'use client';

import { useEffect, useState } from 'react';
import { Monitor, Plus, CheckCircle, XCircle, Edit2, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type Station = {
  id: string;
  name: string;
  description: string;
  specs: string;
  hourlyRate: number;
  position: number;
  isActive: boolean;
};

const STATION_ICONS: Record<number, string> = {
  1:'🖥️', 2:'💻', 3:'🎮', 4:'🕹️', 5:'⚡',
  6:'🥽', 7:'📡', 8:'🎯', 9:'🏎️', 10:'✈️',
};

type FormData = { name: string; description: string; specs: string; hourlyRate: string; position: string };
const EMPTY_FORM: FormData = { name: '', description: '', specs: '', hourlyRate: '', position: '' };

export default function AdminStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stations');
      const data = await res.json();
      setStations(data.stations ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  const openAdd = () => {
    setEditStation(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (station: Station) => {
    setEditStation(station);
    setForm({
      name: station.name,
      description: station.description,
      specs: station.specs,
      hourlyRate: String(station.hourlyRate),
      position: String(station.position),
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editStation) {
        const res = await fetch(`/api/stations/${editStation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, hourlyRate: parseFloat(form.hourlyRate) }),
        });
        if (!res.ok) { setError('Failed to update station.'); return; }
      } else {
        const res = await fetch('/api/stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, hourlyRate: parseFloat(form.hourlyRate), position: parseInt(form.position) || 0 }),
        });
        if (!res.ok) { setError('Failed to create station.'); return; }
      }
      setShowModal(false);
      fetchStations();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (station: Station) => {
    await fetch(`/api/stations/${station.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !station.isActive }),
    });
    fetchStations();
  };

  const activeCount = stations.filter((s) => s.isActive).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stations</h1>
          <p className="page-subtitle">{activeCount} active · {stations.length - activeCount} inactive</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-station-btn">
          <Plus size={18} />
          Add Station
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-muted)' }}>
          Loading stations...
        </div>
      ) : (
        <div className="stations-grid">
          {stations.map((station) => (
            <div
              key={station.id}
              className="station-card"
              style={{ opacity: station.isActive ? 1 : 0.55 }}
            >
              <div className="station-image" style={{ position: 'relative' }}>
                {STATION_ICONS[station.position] || '🖥️'}
                {!station.isActive && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-accent-danger)', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    INACTIVE
                  </div>
                )}
              </div>
              <div className="station-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div className="station-name" style={{ margin: 0 }}>{station.name}</div>
                  <span
                    style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px',
                      borderRadius: '999px',
                      background: station.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: station.isActive ? '#10b981' : '#ef4444',
                      border: `1px solid ${station.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {station.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="station-description">{station.description}</div>
                <div className="station-specs">{station.specs}</div>
                <div className="station-footer">
                  <div>
                    <div className="station-price">{formatCurrency(station.hourlyRate)}</div>
                    <div className="station-price-label">per hour</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEdit(station)}
                      id={`edit-station-${station.id}`}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className={`btn btn-sm ${station.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleActive(station)}
                      id={`toggle-station-${station.id}`}
                      title={station.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {station.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      {station.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-xl)',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                <Monitor size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--color-accent-primary)' }} />
                {editStation ? 'Edit Station' : 'Add New Station'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="station-name">Station Name</label>
                <input id="station-name" type="text" className="form-input" placeholder="e.g. Gaming Pod Alpha"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="station-desc">Description</label>
                <textarea id="station-desc" className="form-input" placeholder="Brief description of this station..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={2} style={{ resize: 'vertical' }} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="station-specs">Specs</label>
                <input id="station-specs" type="text" className="form-input" placeholder="e.g. RTX 4080 | i9-13900K | 32GB | 4K 144Hz"
                  value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="station-rate">Hourly Rate (₹)</label>
                  <input id="station-rate" type="number" className="form-input" placeholder="100"
                    value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} required min={1} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="station-pos">Position</label>
                  <input id="station-pos" type="number" className="form-input" placeholder="1"
                    value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} min={1} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting} id="station-submit-btn">
                  {submitting ? 'Saving...' : editStation ? 'Update Station' : 'Add Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
