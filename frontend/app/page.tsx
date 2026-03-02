'use client';

import { useEffect, useState } from 'react';
import { ReviewCard } from '@/components/feed/ReviewCard';
import { feed } from '@/lib/api';
import type { ApiReview } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function HomePage() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feed.list(20, 0).then((data) => {
      setReviews(data.reviews);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onNew = (review: ApiReview) => setReviews((prev) => [review, ...prev]);
    socket.on('new_review', onNew);
    return () => {
      socket.off('new_review', onNew);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-card border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Fresh Critiques</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Últimas reviews de la comunidad
      </p>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Aún no hay críticas publicadas. ¡Sé el primero en escribir una!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review._id}
              review={review}
              priority={index === 0}
              onDeleted={(id) => setReviews((prev) => prev.filter((x) => x._id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
