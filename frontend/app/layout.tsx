import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LayoutShell } from '@/components/layout/LayoutShell';

export const metadata: Metadata = {
  title: 'AntologiaWeb - Music Reviews',
  description: 'Reviews de canciones, playlists y álbumes con SoundCloud',
  icons: {
    icon: '/brand/logoAntologia.jpg',
    apple: '/brand/logoAntologia.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="relative min-h-screen">
        <div className="fixed inset-0 z-0 bg-background" aria-hidden />
        <div
          className="fixed inset-0 z-0 opacity-[0.08]"
          style={{
            backgroundImage: 'url(/brand/fondoAntologia.jpg)',
            backgroundSize: '420px',
            backgroundRepeat: 'repeat',
          }}
          aria-hidden
        />
        <div className="relative z-10">
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
