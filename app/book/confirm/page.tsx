import { Suspense } from 'react';
import ConfirmationContent from './ConfirmationContent';

export const metadata = {
  title: 'Booking Confirmed',
  description: 'Your gaming session at GameZone Cafe has been confirmed.',
};

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading confirmation...
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
