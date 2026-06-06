'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Gamepad2, Mail, Lock, User, Phone, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Password strength
  const pwd = form.password;
  const strength =
    pwd.length === 0 ? 0 :
    pwd.length <  6  ? 1 :
    pwd.length < 10  ? 2 :
    /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) ? 4 : 3;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981', '#6c63ff'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side phone validation
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess('Account created! Signing you in...');

      const signInResult = await signIn('credentials', {
        email:    form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)' }} />
      </div>

      <div className="auth-card animate-fade-in-up">
        <div className="auth-logo">
          <Link href="/" className="navbar-logo" style={{ justifyContent: 'center', fontSize: '1.5rem' }}>
            <Gamepad2 size={28} />
            GameZone
          </Link>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join GameZone and start booking your gaming sessions</p>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              <User size={13} style={{ display: 'inline', marginRight: 4 }} />
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              <Mail size={13} style={{ display: 'inline', marginRight: 4 }} />
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          {/* Phone — now mandatory */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">
              <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
              Phone Number
            </label>
            <input
              id="reg-phone"
              type="tel"
              className="form-input"
              placeholder="+91-XXXXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              minLength={10}
            />
            <p className="form-helper">Required for booking confirmations</p>
          </div>

          {/* Password + strength bar */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              <Lock size={13} style={{ display: 'inline', marginRight: 4 }} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ paddingRight: 44 }}
              />
              {/* Show / hide toggle */}
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar — appears as user types */}
            {pwd.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      style={{
                        height: 4, flex: 1, borderRadius: 3,
                        background: strength >= lvl ? strengthColor[strength] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s ease',
                        boxShadow: strength >= lvl ? `0 0 6px ${strengthColor[strength]}60` : 'none',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: strengthColor[strength], fontWeight: 600 }}>
                    {strengthLabel[strength]}
                  </span>
                  {strength < 3 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      Add uppercase &amp; numbers for stronger password
                    </span>
                  )}
                  {strength >= 3 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle size={11} /> Good to go
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <div className="auth-divider" style={{ marginTop: 'var(--space-lg)' }}>
          <span>Already have an account?</span>
        </div>
        <Link href="/login" className="btn btn-ghost" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
