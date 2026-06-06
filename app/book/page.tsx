import { Suspense } from 'react';
import BookPageInner from './BookPageInner';

export const metadata = {
  title: 'Book a Gaming Session',
  description:
    'Reserve your gaming station at GameZone Cafe. Choose your date, station, and time slot.',
};

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div
          className="page-wrapper"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading booking form...
          </div>
        </div>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}
