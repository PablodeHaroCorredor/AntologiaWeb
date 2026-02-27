'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewCard } from '@/components/feed/ReviewCard';
import { RequestReviewModal } from '@/components/profile/RequestReviewModal';
import { users } from '@/lib/api';
import type { ApiReview, ApiUser } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ProfileData extends ApiUser {
  stats: { reviewCount: number; draftCount: number };
}

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviewsList, setReviewsList] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([users.get(id), users.reviews(id, { drafts: false })])
      .then(([userData, revData]) => {
        setProfile(userData);
        setReviewsList(revData.reviews);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse">
        <div className="flex gap-4 items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-card" />
          <div className="h-6 w-32 bg-card rounded" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-card rounded" />
          <div className="h-32 bg-card rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Usuario no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profile.avatarUrl} />
          <AvatarFallback className="text-2xl">{profile.username?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex gap-6 text-sm">
              <span><strong className="text-primary">{profile.stats.reviewCount}</strong> reviews</span>
              <span className="text-muted-foreground">{profile.stats.draftCount} borradores</span>
            </div>
            {currentUser && currentUser._id !== profile._id && (
              <Button variant="orange" size="sm" className="gap-2" onClick={() => setRequestModalOpen(true)}>
                <MessageCircle className="w-4 h-4" /> Pedir review
              </Button>
            )}
          </div>
        </div>
      </div>
      <RequestReviewModal
        targetUser={profile}
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSent={() => {}}
      />

      <h2 className="text-lg font-semibold mb-4">Reviews publicadas</h2>
      {reviewsList.length === 0 ? (
        <p className="text-muted-foreground py-8">Aún no hay reviews publicadas.</p>
      ) : (
        <div className="space-y-4">
          {reviewsList.map((r) => (
            <ReviewCard key={r._id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
