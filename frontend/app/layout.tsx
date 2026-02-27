import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LayoutShell } from '@/components/layout/LayoutShell';

export const metadata: Metadata = {
  title: 'AntologiaWeb - Music Reviews',
  description: 'Reviews de canciones, playlists y álbumes con SoundCloud',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
