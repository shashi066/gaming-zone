'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, Search, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Trash2, Globe, UserPlus, Phone, LogIn,
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

type Booking = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN';
  bookingType: 'ONLINE' | 'OFFLINE';
  customerName: string | null;
  customerPhone: string | null;
  paymentStatus: string;
  notes?: string;
  adminComment?: string | null;
  user: { id: string; name: string; email: string } | null;
  station: { id: string; name: string };
  createdAt: string;
};

const STATUS_CONFIG = {
  PENDING:    { cls: 'badge-pending',    label: 'Pending' },
  CONFIRMED:  { cls: 'badge-confirmed',  label: 'Confirmed' },
  CANCELLED:  { cls: 'badge-cancelled',  label: 'Cancelled' },
  COMPLETED:  { cls: 'badge-completed',  label: 'Completed' },
  CHECKED_IN: { cls: 'badge-checkedin',  label: 'Checked In' },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: [],
  CANCELLED:  [],
  COMPLETED:  [],  // legacy - no further transitions
};

export default function AdminBookingsPage() {
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter]     = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [error, setError]               = useState('');

  // Cancel-with-comment modal state
  const [cancelModal, setCancelModal]   = useState<{ id: string; name: string } | null>(null);
  const [cancelComment, setCancelComment] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search)       params.set('search',      search);
      if (statusFilter) params.set('status',      statusFilter);
      if (dateFilter)   params.set('date',        dateFilter);
      if (typeFilter)   params.set('bookingType', typeFilter);

      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 300);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const handleStatusChange = async (id: string, newStatus: string, adminComment?: string) => {
    setUpdatingId(id);
    setError('');
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (adminComment !== undefined) body.adminComment = adminComment;

      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: newStatus as Booking['status'], adminComment: adminComment ?? b.adminComment }
              : b
          )
        );
        return true;
      } else {
        setError(data.error ?? `Failed to update booking (${res.status})`);
        return false;
      }
    } catch (e) {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    const ok = await handleStatusChange(cancelModal.id, 'CANCELLED', cancelComment);
    if (ok) {
      setCancelModal(null);
      setCancelComment('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this booking? This cannot be undone.')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) setBookings((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setUpdatingId(null);
    }
  };

  const hasFilters = search || statusFilter || dateFilter || typeFilter;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Bookings</h1>
          <p className="page-subtitle">{total} total bookings found</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchBookings} id="refresh-bookings-btn">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 300 }}>
          <Search size={16} className="search-icon" />
          <input
            id="bookings-search"
            type="text"
            className="form-input search-input"
            placeholder="Search name, email, station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['', 'ONLINE', 'OFFLINE'] as const).map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTypeFilter(t)}
              id={`type-filter-${t || 'all'}`}
            >
              {t === ''        && 'All'}
              {t === 'ONLINE'  && <><Globe size={13} /> Online</>}
              {t === 'OFFLINE' && <><UserPlus size={13} /> Walk-in</>}
            </button>
          ))}
        </div>

        <select
          id="bookings-status-filter"
          className="form-input"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          id="bookings-date-filter"
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); setTypeFilter(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner" />Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={32} /></div>
            <div className="empty-state-title">No Bookings Found</div>
            <p className="empty-state-text">Try adjusting your filters.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Customer</th>
                <th>Station</th>
                <th>Date &amp; Time</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const cfg         = STATUS_CONFIG[b.status];
                const transitions = STATUS_TRANSITIONS[b.status] ?? [];
                const isBusy      = updatingId === b.id;
                const isOffline   = b.bookingType === 'OFFLINE';

                return (
                  <tr key={b.id} style={{ opacity: isBusy ? 0.5 : 1 }}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        #{b.id.slice(-8).toUpperCase()}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </div>
                      {b.adminComment && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-error)', marginTop: 4, fontStyle: 'italic' }}>
                          Note: {b.adminComment}
                        </div>
                      )}
                    </td>

                    <td>
                      {isOffline ? (
                        <>
                          <strong>{b.customerName ?? '—'}</strong>
                          {b.customerPhone && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Phone size={11} /> {b.customerPhone}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <strong>{b.user?.name ?? '—'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.user?.email}</div>
                        </>
                      )}
                    </td>

                    <td style={{ fontWeight: 600 }}>{b.station.name}</td>

                    <td>
                      <div>{formatDate(b.date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatTime(b.startTime)} – {formatTime(b.endTime)} ({b.duration}h)
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                        {formatCurrency(b.totalPrice)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {b.paymentStatus === 'PAID' ? '✓ Paid' : 'At counter'}
                      </div>
                    </td>

                    <td>
                      {isOffline ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: '999px',
                          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                        }}>
                          <UserPlus size={10} /> Walk-in
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: '999px',
                          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: 'rgba(108,99,255,0.12)', color: 'var(--color-accent-primary)', border: '1px solid rgba(108,99,255,0.3)',
                        }}>
                          <Globe size={10} /> Online
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {transitions.includes('CONFIRMED') && (
                          <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(b.id, 'CONFIRMED')} disabled={isBusy} id={`confirm-${b.id}`}>
                            <CheckCircle size={13} /> Confirm
                          </button>
                        )}
                        {transitions.includes('CHECKED_IN') && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}
                            onClick={() => handleStatusChange(b.id, 'CHECKED_IN')} disabled={isBusy} id={`checkin-${b.id}`}
                          >
                            <LogIn size={13} /> Check In
                          </button>
                        )}
                        {transitions.includes('CANCELLED') && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setCancelComment('');
                              setCancelModal({ id: b.id, name: b.user?.name ?? b.customerName ?? 'Customer' });
                            }}
                            disabled={isBusy} id={`cancel-${b.id}`}
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(b.id)} disabled={isBusy} id={`delete-${b.id}`}
                          style={{ color: 'var(--color-accent-danger)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel with comment modal */}
      {cancelModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setCancelModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 440, width: '100%', padding: 'var(--space-xl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
              <XCircle size={18} style={{ display: 'inline', marginRight: 6, color: 'var(--color-accent-error)' }} />
              Cancel Booking
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>
              Cancelling booking for <strong>{cancelModal.name}</strong>. Add an optional comment — this will be shown to the user.
            </p>
            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="form-label">Cancellation Reason (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. Station under maintenance, No-show after 15 mins..."
                value={cancelComment}
                onChange={(e) => setCancelComment(e.target.value)}
                style={{ resize: 'vertical' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setCancelModal(null); setError(''); }}>
                Keep Booking
              </button>
              <button className="btn btn-danger" onClick={handleCancelConfirm} disabled={!!updatingId} id="confirm-cancel-btn">
                <XCircle size={16} /> {updatingId ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
