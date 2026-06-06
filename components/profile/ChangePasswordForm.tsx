'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState('');
  const [error, setError]                     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/profile/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Strength indicator
  const strength =
    newPassword.length === 0 ? 0 :
    newPassword.length <  6  ? 1 :
    newPassword.length < 10  ? 2 :
    /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981', '#6c63ff'];

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-lg)',
      }}
      onClick={(e) => e.target === e.currentTarget && !success && onClose()}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 440, position: 'relative', animation: 'fadeInUp 0.25s ease' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(108,99,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-accent-primary)',
            }}>
              <KeyRound size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Change Password</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Update your account password
              </p>
            </div>
          </div>
          {!success && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Success state */}
        {success ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
            <CheckCircle size={52} style={{ color: 'var(--color-accent-success)', marginBottom: 'var(--space-md)' }} />
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Password Changed!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
              Your password has been updated successfully.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {/* Current password */}
            <div className="form-group">
              <label className="form-label" htmlFor="cp-current">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="cp-current"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="form-group">
              <label className="form-label" htmlFor="cp-new">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="cp-new"
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} style={{
                        height: 3, flex: 1, borderRadius: 2,
                        background: strength >= lvl ? strengthColor[strength] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strengthColor[strength] }}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm new password */}
            <div className="form-group">
              <label className="form-label" htmlFor="cp-confirm">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="cp-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    paddingRight: 44,
                    borderColor:
                      confirmPassword && newPassword !== confirmPassword ? 'var(--color-accent-danger)' :
                      confirmPassword && newPassword === confirmPassword  ? 'var(--color-accent-success)' : undefined,
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="form-error" style={{ marginTop: 4 }}><AlertCircle size={12} /> Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p style={{ fontSize: '0.72rem', color: 'var(--color-accent-success)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> Passwords match
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                id="change-password-btn"
              >
                <KeyRound size={15} />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Exported trigger button ───────────────────────────────────────────────────
export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <ChangePasswordModal onClose={() => setOpen(false)} />}

      <button
        className="btn btn-ghost"
        onClick={() => setOpen(true)}
        id="open-change-password-btn"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(108,99,255,0.25)',
          color: 'var(--color-accent-primary)',
          padding: '10px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
          fontWeight: 600,
          transition: 'all var(--transition-base)',
        }}
      >
        <KeyRound size={16} />
        Change Password
      </button>
    </>
  );
}
