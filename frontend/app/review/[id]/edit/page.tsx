'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Loader2 } from 'lucide-react';
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
  const [isDraft, setIsDraft] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    reviews.get(id).then((r) => {
      setReview(r);
      setRating(r.rating);
      setBody(r.body || '');
      setIsDraft(r.isDraft);
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
      <div className="p-6 max-w-xl mx-auto text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }
  if (review.author._id !== user._id) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <p className="text-muted-foreground">No puedes editar esta review.</p>
        <Link href="/"><Button className="mt-4">Volver</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Editar review</h1>
      <p className="text-muted-foreground text-sm mb-6">{review.title}</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Valoración</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Star className={`w-8 h-8 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tu crítica</label>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar borrador
          </Button>
          <Button variant="orange" onClick={() => handleSubmit(true)} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
