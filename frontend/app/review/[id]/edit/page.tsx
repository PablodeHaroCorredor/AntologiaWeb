'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { reviews } from '@/lib/api';
import type { ApiReview } from '@/lib/api';

export default function EditReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [review, setReview] = useState<ApiReview | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    reviews.get(id).then((r) => {
      setReview(r);
      setRating(r.rating);
      setBody(r.body || '');
    }).catch(() => setReview(null));
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleSubmit = async (publish: boolean) => {
    if (!review || review.author._id !== user?._id) return;
    setSubmitting(true);
    try {
      await reviews.update(id, { rating, body, isDraft: publish ? false : true });
      router.push(`/review/${id}`);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (authLoading || !user) return null;

  if (!review) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (review.author._id !== user._id) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">No puedes editar esta review.</p>
          <Link href="/"><Button variant="orange">Volver al inicio</Button></Link>
        </div>
      </div>
    );
  }

  const artwork = review.artworkUrl?.replace('-large', '-t500x500') || '';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <Link
        href={`/review/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la review
      </Link>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-1">Editar review</h1>
          <p className="text-muted-foreground text-sm mb-6">Modifica tu valoración y tu crítica</p>

          <div className="flex gap-6 mb-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
              {review.artworkUrl ? (
                <Image
                  src={artwork}
                  alt={review.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">♪</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{review.title}</p>
              {review.artistName && <p className="text-sm text-muted-foreground truncate">{review.artistName}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Valoración</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        n <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-amber-400/70'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tu crítica</label>
              <textarea
                className="w-full min-h-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y"
                placeholder="Escribe tu opinión..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar borrador
              </Button>
              <Button
                variant="orange"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
