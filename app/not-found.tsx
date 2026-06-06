import Link from 'next/link';
import { Home, Calendar } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div>
        <div className="not-found-code">404</div>
        <h1
          className="font-orbitron"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, margin: '24px 0 12px' }}
        >
          Page Not Found
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary btn-lg">
            <Home size={18} />
            Back to Home
          </Link>
          <Link href="/book" className="btn btn-ghost btn-lg">
            <Calendar size={18} />
            Book a Slot
          </Link>
        </div>
      </div>
    </div>
  );
}
