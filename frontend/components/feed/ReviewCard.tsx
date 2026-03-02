'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Heart, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { formatDate, cn } from '@/lib/utils';
import type { ApiReview } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import { reviews as reviewsApi } from '@/lib/api';

interface ReviewCardProps {
  review: ApiReview;
  onLike?: () => void;
  onDeleted?: (reviewId: string) => void;
  /** Marcar si esta imagen es LCP (primera visible) para priorizar carga */
  priority?: boolean;
  /** Si se indica, la zona de contenido (título + cuerpo) enlaza a la review; evita anidar <a> cuando el padre también es un Link */
  reviewHref?: string;
}

export function ReviewCard({ review, onLike, onDeleted, priority, reviewHref }: ReviewCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(review.liked ?? false);
  const [likesCount, setLikesCount] = useState(review.likes?.length ?? 0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const isAuthor = user && review.author._id === user._id;

  const handleDeleteConfirm = async () => {
    if (!isAuthor) return;
    setDeleting(true);
    try {
      await reviewsApi.delete(review._id);
      onDeleted?.(review._id);
      router.refresh();
    } catch (_) {}
    setDeleting(false);
  };

  const handleLike = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await reviewsApi.like(review._id);
      setLiked(res.liked);
      setLikesCount(res.likes);
      onLike?.();
    } catch (_) {}
    setLoading(false);
  };

  const artwork = review.artworkUrl?.replace('-large', '-t500x500') || '/placeholder-artwork.png';
  const soundcloudUrl = review.soundcloudPermalink
    ? `https://soundcloud.com${review.soundcloudPermalink}`
    : `https://soundcloud.com`;

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <Link
            href={soundcloudUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-muted">
              {review.artworkUrl ? (
                <Image
                  src={artwork}
                  alt={review.title}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  priority={priority}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-3xl">♪</span>
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0 min-h-0">
            {reviewHref ? (
              <Link href={reviewHref} className="block">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="uppercase font-medium text-primary">{review.contentType}</span>
                  {review.artistName && <span>• {review.artistName}</span>}
                </div>
                <span className="font-semibold text-lg hover:text-primary line-clamp-1 block">{review.title}</span>
                <div className="flex items-center gap-1 mt-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn('w-4 h-4', n <= review.rating ? 'fill-current' : 'opacity-30')}
                    />
                  ))}
                </div>
                {review.body && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
                )}
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="uppercase font-medium text-primary">{review.contentType}</span>
                  {review.artistName && <span>• {review.artistName}</span>}
                </div>
                <Link
                  href={soundcloudUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-lg hover:text-primary line-clamp-1"
                >
                  {review.title}
                </Link>
                <div className="flex items-center gap-1 mt-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn('w-4 h-4', n <= review.rating ? 'fill-current' : 'opacity-30')}
                    />
                  ))}
                </div>
                {review.body && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border px-4 py-2 bg-secondary/30">
        <Link
          href={`/profile/${review.author._id}`}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={review.author.avatarUrl} />
            <AvatarFallback>{review.author.username?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {review.author.displayName || review.author.username}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {isAuthor && (
            <span onClick={(e) => e.stopPropagation()}>
              <Link href={`/review/${review._id}/edit`}>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Editar">
                  <Pencil className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                title="Eliminar"
                onClick={() => setDeleteModalOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </span>
          )}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={review.title}
        loading={deleting}
      />
          <Button
            variant="ghost"
            size="icon"
            className={liked ? 'text-primary' : ''}
            onClick={handleLike}
            disabled={!user || loading}
          >
            <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
          </Button>
          <span className="text-sm text-muted-foreground">{likesCount}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

