'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Calendar, Clock, Monitor, IndianRupee,
  XCircle, AlertCircle, CheckCircle, Plus,
} from 'lucide-react';
import { formatTime, formatDate, formatCurrency } from '@/lib/utils';

type Booking = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN';
  notes?: string;
  adminComment?: string | null;
  station: { id: string; name: string };
};

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    cls: 'badge-pending',    icon: Clock },
  CONFIRMED:  { label: 'Confirmed',  cls: 'badge-confirmed',  icon: CheckCircle },
  CANCELLED:  { label: 'Cancelled',  cls: 'badge-cancelled',  icon: XCircle },
  COMPLETED:  { label: 'Completed',  cls: 'badge-completed',  icon: CheckCircle },
  CHECKED_IN: { label: 'Checked In', cls: 'badge-checkedin',  icon: CheckCircle },
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings?limit=50');
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b))
        );
      }
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(
    (b) => b.date >= today && b.status !== 'CANCELLED' && b.status !== 'CHECKED_IN'
  );
  const past = bookings.filter(
    (b) => b.date < today || b.status === 'CANCELLED' || b.status === 'CHECKED_IN'
  );

  const canCancel = (b: Booking) => b.status === 'PENDING';

  const displayList = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <BookOpen
                size={28}
                style={{ display: 'inline', marginRight: 10, color: 'var(--color-accent-primary)' }}
              />
              My <span className="text-gradient">Bookings</span>
            </h1>
            <p className="page-subtitle">Manage your gaming session reservations</p>
          </div>
          <Link href="/book" className="btn btn-primary" id="new-booking-btn">
            <Plus size={18} />
            New Booking
          </Link>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          <button
            id="tab-upcoming"
            className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
            <span
              style={{
                background: activeTab === 'upcoming' ? 'rgba(255,255,255,0.2)' : 'rgba(108,99,255,0.15)',
                color: activeTab === 'upcoming' ? 'white' : 'var(--color-accent-primary)',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {upcoming.length}
            </span>
          </button>
          <button
            id="tab-past"
            className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('past')}
          >
            Past & Cancelled
            <span
              style={{
                background: activeTab === 'past' ? 'rgba(255,255,255,0.2)' : 'rgba(108,99,255,0.15)',
                color: activeTab === 'past' ? 'white' : 'var(--color-accent-primary)',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {past.length}
            </span>
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--color-text-muted)' }}>
            Loading your bookings...
          </div>
        ) : displayList.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={32} />
              </div>
              <div className="empty-state-title">
                {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}
              </div>
              <p className="empty-state-text">
                {activeTab === 'upcoming'
                  ? "You don't have any upcoming sessions. Book a gaming station now!"
                  : "You haven't completed any gaming sessions yet."}
              </p>
              {activeTab === 'upcoming' && (
                <Link href="/book" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                  <Calendar size={16} />
                  Book a Session
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {displayList.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status];
              const Icon = cfg.icon;

              return (
                <div
                  key={booking.id}
                  className="card card-hover"
                  style={{ padding: 'var(--space-lg)' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--space-md)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Left: info */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)',
                          marginBottom: 'var(--space-sm)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                          {booking.station.name}
                        </span>
                        <span className={`badge ${cfg.cls}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 'var(--space-lg)',
                          flexWrap: 'wrap',
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} style={{ color: 'var(--color-accent-primary)' }} />
                          {formatDate(booking.date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} style={{ color: 'var(--color-accent-primary)' }} />
                          {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Monitor size={14} style={{ color: 'var(--color-accent-primary)' }} />
                          {booking.duration} hr{booking.duration > 1 ? 's' : ''}
                        </span>
                      </div>

                      {booking.notes && (
                        <p
                          style={{
                            marginTop: 'var(--space-sm)',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          Note: {booking.notes}
                        </p>
                      )}

                      {booking.status === 'CANCELLED' && booking.adminComment && (
                        <div
                          style={{
                            marginTop: 'var(--space-sm)',
                            padding: '8px 12px',
                            background: 'rgba(255,59,48,0.08)',
                            border: '1px solid rgba(255,59,48,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            color: 'var(--color-accent-error)',
                          }}
                        >
                          <strong>Admin note:</strong> {booking.adminComment}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 8,
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        ID: #{booking.id.slice(-8).toUpperCase()}
                      </div>
                    </div>

                    {/* Right: price + actions */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 'var(--space-sm)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'Orbitron, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: 700,
                          color: 'var(--color-accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <IndianRupee size={16} />
                        {booking.totalPrice.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Pay at counter
                      </div>

                      {canCancel(booking) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          id={`cancel-booking-${booking.id}`}
                        >
                          <XCircle size={14} />
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
