'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/AuthProvider';
import { reviews, reviewRequests } from '@/lib/api';

export default function NewReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const type = (searchParams.get('type') || 'track') as 'track' | 'playlist' | 'album';
  const id = searchParams.get('id') || '';
  const title = searchParams.get('title') || '';
  const artwork = searchParams.get('artwork') || '';
  const artist = searchParams.get('artist') || '';
  const permalink = searchParams.get('permalink') || '';
  const requestId = searchParams.get('requestId') || '';

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const soundcloudPath = permalink
    ? (() => {
        try {
          return new URL(permalink).pathname;
        } catch {
          return permalink.startsWith('/') ? permalink : '';
        }
      })()
    : '';

  const handleSubmit = async (asDraft: boolean) => {
    if (!user || !id || !title) return;
    setSubmitting(true);
    try {
      const review = await reviews.create({
        contentType: type === 'album' ? 'playlist' : type,
        soundcloudId: id,
        soundcloudPermalink: soundcloudPath,
        title,
        artworkUrl: artwork,
        artistName: artist,
        rating: rating || 1,
        body,
        isDraft: asDraft,
      });
      if (!asDraft && requestId) {
        try {
          await reviewRequests.update(requestId, { status: 'completed', reviewId: review._id });
        } catch (_) {}
      }
      router.push(asDraft ? `/review/${review._id}/edit` : `/review/${review._id}`);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (authLoading || !user) return null;
  if (!id || !title) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <p className="text-muted-foreground mb-4">Faltan datos. Busca un tema o playlist y pulsa &quot;Escribir review&quot;.</p>
        <Link href="/search"><Button variant="orange">Ir a buscar</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Nueva review</h1>
      <p className="text-muted-foreground text-sm mb-6 truncate">{title} {artist && `· ${artist}`}</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Valoración (estrellas)</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    n <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tu crítica (opcional)</label>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Escribe tu opinión..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar borrador
          </Button>
          <Button
            variant="orange"
            onClick={() => handleSubmit(false)}
            disabled={submitting || !rating}
            className="gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
