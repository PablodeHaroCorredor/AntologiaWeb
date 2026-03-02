'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = searchParams.get('error');

  const handleLogin = () => {
    setLoading(true);
    // Redirigir al backend para que las cookies OAuth se establezcan en first-party (funciona en producción)
    window.location.href = `${API_URL}/api/auth/soundcloud/authorize?go=1`;
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 ring-2 ring-primary/30">
        <Image
          src="/brand/logoAntologia.jpg"
          alt="AntologiaWeb"
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-2xl font-bold mb-2">AntologiaWeb</h1>
      <p className="text-muted-foreground text-center mb-8 max-w-sm">
        Inicia sesión con tu cuenta de SoundCloud para escribir y compartir reviews.
      </p>
      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 px-4 py-2 rounded-lg bg-destructive/10">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">
            {error === 'invalid_callback' && 'Sesión inválida. Intenta de nuevo.'}
            {error === 'oauth_failed' && 'Error al conectar con SoundCloud.'}
          </span>
        </div>
      )}
      <Button
        variant="orange"
        size="lg"
        onClick={handleLogin}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.175 12.225c-.015-.015-.015-.033 0-.063L11.942.675c.274-.274.721-.274.995 0 .274.274.274.721 0 .995L3.385 12.005l9.552 10.335c.274.274.274.721 0 .995-.137.137-.316.205.495.205-.179 0-.358-.068-.495-.205L1.175 12.225z" />
              <path d="M12.175 12.225c-.015-.015-.015-.033 0-.063L23.942.675c.274-.274.721-.274.995 0 .274.274.274.721 0 .995l-8.552 9.335 9.552 10.335c.274.274.274.721 0 .995-.137.137-.316.205-.495.205-.179 0-.358-.068-.495-.205L12.175 12.225z" />
            </svg>
            Conectar con SoundCloud
          </>
        )}
      </Button>
      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 ring-2 ring-primary/30 bg-muted animate-pulse" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mb-8" />
          <div className="h-12 w-56 bg-muted rounded animate-pulse" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
