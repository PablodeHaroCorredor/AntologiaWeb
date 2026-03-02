'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { ReviewCard } from '@/components/feed/ReviewCard';
import { reviews } from '@/lib/api';
import type { ApiReview } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Library, FileEdit } from 'lucide-react';

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviewsList, setReviewsList] = useState<ApiReview[]>([]);
  const [drafts, setDrafts] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      reviews.list({ userId: user._id, draft: false }),
      reviews.list({ userId: user._id, draft: true }),
    ]).then(([pub, dr]) => {
      setReviewsList(pub.reviews);
      setDrafts(dr.reviews);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {!user && !authLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Inicia sesión para ver tu biblioteca.</p>
            <Link href="/login">
              <Button variant="orange">Iniciar sesión</Button>
            </Link>
          </div>
        )}
        {authLoading && (
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-48 bg-card rounded" />
            <div className="h-40 rounded-lg bg-card border" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Mi biblioteca</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Tus reviews publicadas y borradores
      </p>

      {drafts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-amber-500" />
            Borradores
          </h2>
          <div className="space-y-4">
            {drafts.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                reviewHref={`/review/${r._id}/edit`}
                onDeleted={(id) => {
                  setDrafts((prev) => prev.filter((x) => x._id !== id));
                  setReviewsList((prev) => prev.filter((x) => x._id !== id));
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          Publicadas
        </h2>
        {reviewsList.length === 0 && drafts.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Aún no tienes reviews. <Link href="/search" className="text-primary hover:underline">Busca algo</Link> y escribe tu primera crítica.
          </p>
        ) : reviewsList.length === 0 ? (
          <p className="text-muted-foreground py-4">No tienes reviews publicadas todavía.</p>
        ) : (
          <div className="space-y-4">
            {reviewsList.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                reviewHref={`/review/${r._id}`}
                onDeleted={(id) => {
                  setReviewsList((prev) => prev.filter((x) => x._id !== id));
                  setDrafts((prev) => prev.filter((x) => x._id !== id));
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
