'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { reviews } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ApiReview } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const [review, setReview] = useState<ApiReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    reviews.get(id).then(setReview).catch(() => setReview(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (review) {
      setLiked(review.liked ?? false);
      setLikesCount(review.likes?.length ?? 0);
    }
  }, [review]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await reviews.like(id);
      setLiked(res.liked);
      setLikesCount(res.likes);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-card rounded mb-6" />
        <div className="h-64 bg-card rounded" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground mb-4">Review no encontrada.</p>
        <Link href="/"><Button variant="orange">Volver al inicio</Button></Link>
      </div>
    );
  }

  const soundcloudUrl = review.soundcloudPermalink
    ? `https://soundcloud.com${review.soundcloudPermalink}`
    : 'https://soundcloud.com';
  const artwork = review.artworkUrl?.replace('-large', '-t500x500') || '';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="flex gap-6">
        <a
          href={soundcloudUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <div className="w-40 h-40 rounded-xl overflow-hidden bg-muted">
            {artwork ? (
              <Image src={artwork} alt={review.title} width={160} height={160} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">♪</div>
            )}
          </div>
        </a>
        <div className="flex-1 min-w-0">
          <span className="text-xs uppercase text-primary font-medium">{review.contentType}</span>
          <h1 className="text-2xl font-bold mt-1">{review.title}</h1>
          {review.artistName && (
            <p className="text-muted-foreground mt-1">{review.artistName}</p>
          )}
          <div className="flex items-center gap-1 mt-3 text-amber-400">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`w-5 h-5 ${n <= review.rating ? 'fill-current' : 'opacity-30'}`} />
            ))}
          </div>
        </div>
      </div>

      {review.body && (
        <div className="mt-8 prose prose-invert max-w-none">
          <p className="text-muted-foreground whitespace-pre-wrap">{review.body}</p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <Link href={`/profile/${review.author._id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.author.avatarUrl} />
            <AvatarFallback>{review.author.username?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{review.author.displayName || review.author.username}</p>
            <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className={liked ? 'text-primary' : ''} onClick={handleLike} disabled={!user}>
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </Button>
          <span className="text-sm text-muted-foreground">{likesCount} likes</span>
        </div>
      </div>

      {user && review.author._id === user._id && (
        <div className="mt-6">
          <Link href={`/review/${review._id}/edit`}>
            <Button variant="outline">Editar review</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
