import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: {
    default: 'GameZone Cafe — Book Your Gaming Session',
    template: '%s | GameZone Cafe',
  },
  description:
    'Book your gaming station at GameZone Cafe. High-performance PCs, VR setups, racing simulators & more. Reserve your slot online in seconds.',
  keywords: ['gaming cafe', 'PC gaming', 'book gaming station', 'VR gaming'],
  openGraph: {
    title: 'GameZone Cafe — Book Your Gaming Session',
    description: 'Premium gaming cafe with 10+ high-end gaming stations. Book online!',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
