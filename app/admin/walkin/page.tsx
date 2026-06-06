'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UserPlus, Plus, Trash2, AlertCircle, RefreshCw,
  Calendar, Clock, Monitor, X, CheckCircle, Phone, User, Search,
} from 'lucide-react';
import { formatDate, formatTime, formatCurrency, getTodayString, isSlotAvailable, getTimeSlotsForDate } from '@/lib/utils';

type Station = { id: string; name: string; hourlyRate: number };
type BookedSlot = { startTime: string; endTime: string; status: string };
type WalkinBooking = {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  stationId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  extraControllers: number;
  status: string;
  notes: string | null;
  station: { id: string; name: string };
};

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export default function WalkinBookingPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [bookings, setBookings] = useState<WalkinBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [controllerPrice, setControllerPrice] = useState(0);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStation, setFilterStation] = useState('');

  // Form
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    stationId: '',
    date: getTodayString(),
    startTime: '10:00',
    duration: 2,
    extraControllers: 0,
    notes: '',
  });

  useEffect(() => {
    fetch('/api/stations')
      .then((r) => r.json())
      .then((d) => setStations(d.stations ?? []));
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.controller_price) setControllerPrice(parseFloat(d.controller_price));
      });
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bookingType: 'OFFLINE', limit: '100' });
      if (filterDate) params.set('date', filterDate);
      if (filterStation) params.set('stationId', filterStation);
      const res = await fetch(`/api/admin/walkin?${params}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStation]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // Fetch booked slots whenever station or date changes
  useEffect(() => {
    if (!form.stationId || !form.date) { setBookedSlots([]); return; }
    fetch(`/api/slots?stationId=${form.stationId}&date=${form.date}`)
      .then((r) => r.json())
      .then((d) => setBookedSlots(d.bookings ?? []));
  }, [form.stationId, form.date]);

  const selectedStation = stations.find((s) => s.id === form.stationId);
  const controllerCharge = form.extraControllers * controllerPrice * form.duration;
  const estimatedTotal = selectedStation ? selectedStation.hourlyRate * form.duration + controllerCharge : 0;

  // Filter available time slots: within opening hours, not past, not conflicting
  const SHOP_CLOSE_HOUR = 24; // shop closes at 12AM (midnight)
  const availableSlots = getTimeSlotsForDate(form.date).filter((time) => {
    const [h] = time.split(':').map(Number);
    // Must fit within closing time
    if (h + form.duration > SHOP_CLOSE_HOUR) return false;
    // Block past times if today
    if (form.date === getTodayString()) {
      const now = new Date();
      if (h <= now.getHours()) return false;
    }
    return isSlotAvailable(time, form.duration, bookedSlots);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: Number(form.duration) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Booking failed.'); return; }
      setSuccess(`✅ Walk-in booking created for ${data.booking.customerName} — ${data.booking.station.name}`);
      setShowForm(false);
      setForm({ customerName: '', customerPhone: '', stationId: '', date: getTodayString(), startTime: '10:00', duration: 2, extraControllers: 0, notes: '' });
      loadBookings();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this walk-in booking?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      setSuccess('Walk-in booking cancelled.');
    } finally {
      setDeletingId(null);
    }
  };

  const today = getTodayString();

  // Filter by search (client-side for offline bookings)
  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.includes(q) ||
      b.station.name.toLowerCase().includes(q)
    );
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, WalkinBooking[]>>((acc, b) => {
    if (!acc[b.date]) acc[b.date] = [];
    acc[b.date].push(b);
    return acc;
  }, {});

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: '#10b981',
    PENDING:   '#f59e0b',
    CANCELLED: '#ef4444',
    COMPLETED: '#818cf8',
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserPlus size={26} style={{ display: 'inline', marginRight: 10, color: 'var(--color-accent-primary)' }} />
            Walk-in Bookings
          </h1>
          <p className="page-subtitle">Book slots for offline / walk-in customers</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadBookings} id="refresh-walkin-btn">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(''); setSuccess(''); }} id="new-walkin-btn">
            <Plus size={16} /> New Walk-in Booking
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-lg)' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Info */}
      <div className="alert alert-info" style={{ marginBottom: 'var(--space-xl)' }}>
        <UserPlus size={16} style={{ flexShrink: 0 }} />
        <span>
          Walk-in bookings are <strong>auto-confirmed</strong> and marked as <strong>pay at counter</strong>.
          They appear as unavailable to online customers. When payment integration is added, online users will
          need to pay first — but admin can always book for walk-in customers without payment.
        </span>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 260 }}>
          <Search size={15} className="search-icon" />
          <input
            id="walkin-search"
            className="form-input search-input"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          id="walkin-date-filter"
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          id="walkin-station-filter"
          className="form-input"
          style={{ width: 'auto' }}
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
        >
          <option value="">All Stations</option>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(filterDate || filterStation || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterDate(''); setFilterStation(''); setSearch(''); }}>
            Clear
          </button>
        )}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="loading-state"><div className="spinner" />Loading walk-in bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><UserPlus size={32} /></div>
            <div className="empty-state-title">No Walk-in Bookings</div>
            <p className="empty-state-text">No walk-in bookings yet. Use the button above to create one for a walk-in customer.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, slots]) => (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                  <Calendar size={15} style={{ color: 'var(--color-accent-primary)' }} />
                  <span style={{ fontWeight: 700 }}>{formatDate(date)}</span>
                  {date === today && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(108,99,255,0.12)', color: 'var(--color-accent-primary)', border: '1px solid rgba(108,99,255,0.3)' }}>TODAY</span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>· {slots.length} booking{slots.length !== 1 ? 's' : ''}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {slots.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((booking) => (
                    <div key={booking.id} className="card" style={{
                      padding: 'var(--space-lg)',
                      borderColor: booking.status === 'CANCELLED' ? 'rgba(239,68,68,0.15)' : 'rgba(108,99,255,0.15)',
                      opacity: booking.status === 'CANCELLED' ? 0.6 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        {/* Left */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                          {/* Customer info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '1rem' }}>
                              <User size={15} style={{ color: 'var(--color-accent-primary)' }} />
                              {booking.customerName}
                            </div>
                            {booking.customerPhone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                <Phone size={13} />
                                {booking.customerPhone}
                              </div>
                            )}
                            {/* Status badge */}
                            <span style={{
                              padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                              background: `${STATUS_COLORS[booking.status]}22`,
                              color: STATUS_COLORS[booking.status],
                              border: `1px solid ${STATUS_COLORS[booking.status]}44`,
                            }}>
                              {booking.status}
                            </span>
                            {/* Walk-in badge */}
                            <span style={{
                              padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                              background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                            }}>
                              🚶 Walk-in
                            </span>
                          </div>

                          {/* Station + time */}
                          <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Monitor size={14} style={{ color: 'var(--color-accent-primary)' }} />
                              {booking.station.name}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} style={{ color: 'var(--color-accent-primary)' }} />
                              {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
                              <span style={{ color: 'var(--color-text-muted)' }}>({booking.duration}h)</span>
                            </span>
                            {booking.extraControllers > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                🎮 +{booking.extraControllers} controller{booking.extraControllers > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {booking.notes && (
                            <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              {booking.notes}
                            </p>
                          )}

                          {/* Booking ID */}
                          <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            ID: #{booking.id.slice(-8).toUpperCase()} · Pay at counter
                          </div>
                        </div>

                        {/* Right: price + cancel */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-sm)' }}>
                          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                            {formatCurrency(booking.totalPrice)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Due at counter</div>
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                              onClick={() => handleCancel(booking.id)}
                              disabled={deletingId === booking.id}
                              id={`cancel-walkin-${booking.id}`}
                            >
                              <Trash2 size={13} />
                              {deletingId === booking.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Walk-in Booking Form Modal ── */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="card" style={{ width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                <UserPlus size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--color-accent-primary)' }} />
                New Walk-in Booking
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Customer section */}
              <div style={{ background: 'rgba(108,99,255,0.04)', border: '1px solid rgba(108,99,255,0.12)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-md)' }}>
                  Customer Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="walkin-name">
                      Customer Name *
                    </label>
                    <input
                      id="walkin-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rahul Sharma"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="walkin-phone">
                      Phone <span style={{ color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <input
                      id="walkin-phone"
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Booking section */}
              <div style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-md)' }}>
                  Slot Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="walkin-station">Station *</label>
                    <select
                      id="walkin-station"
                      className="form-input"
                      value={form.stationId}
                      onChange={(e) => setForm({ ...form, stationId: e.target.value })}
                      required
                    >
                      <option value="">Select a station...</option>
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.hourlyRate)}/hr</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="walkin-date">Date *</label>
                      <input
                        id="walkin-date"
                        type="date"
                        className="form-input"
                        value={form.date}
                        min={today}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="walkin-start">Start Time *</label>
                      <select
                        id="walkin-start"
                        className="form-input"
                        value={availableSlots.includes(form.startTime) ? form.startTime : ''}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        required
                        disabled={!form.stationId || !form.date}
                      >
                        <option value="">
                          {!form.stationId || !form.date
                            ? 'Select station & date first'
                            : availableSlots.length === 0
                            ? 'No slots available'
                            : 'Select start time...'}
                        </option>
                        {availableSlots.map((t) => (
                          <option key={t} value={t}>{formatTime(t)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration *</label>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                      {DURATION_OPTIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`btn btn-sm ${form.duration === d ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setForm({ ...form, duration: d })}
                        >
                          {d}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {controllerPrice > 0 && (
                    <div className="form-group">
                      <label className="form-label">
                        Extra Controllers
                        <span style={{ color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                          {' '}— {formatCurrency(controllerPrice)}/hr each
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {[0, 1, 2, 3].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`btn btn-sm ${form.extraControllers === n ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setForm({ ...form, extraControllers: n })}
                          >
                            {n === 0 ? 'None' : `+${n}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="walkin-notes">
                      Notes <span style={{ color: 'var(--color-text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <input
                      id="walkin-notes"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tournament, VIP, special setup..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Summary preview */}
              {form.stationId && form.date && form.customerName && (
                <div style={{
                  padding: 'var(--space-md)',
                  background: 'rgba(0,230,118,0.05)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-accent-success)' }}>✓ Booking Summary</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    <strong>{form.customerName}</strong> · {stations.find((s) => s.id === form.stationId)?.name}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDate(form.date)} · {formatTime(form.startTime)} for {form.duration}h
                    {form.extraControllers > 0 && ` · +${form.extraControllers} controller${form.extraControllers > 1 ? 's' : ''}`}
                  </div>
                  <div style={{ color: 'var(--color-accent-primary)', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
                    Total: {formatCurrency(estimatedTotal)} — Pay at counter
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submitting || !form.stationId || !form.customerName}
                  id="walkin-submit-btn"
                >
                  <UserPlus size={16} />
                  {submitting ? 'Creating...' : 'Confirm Walk-in Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
