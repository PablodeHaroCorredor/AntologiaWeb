'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { reviewRequests } from '@/lib/api';
import type { ApiReviewRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MessageCircle, Music, List, Loader2, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Tab = 'received' | 'sent';

export default function RequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<ApiReviewRequest[]>([]);
  const [sent, setSent] = useState<ApiReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([reviewRequests.received(), reviewRequests.sent()])
      .then(([rec, snt]) => {
        setReceived(rec.requests);
        setSent(snt.requests);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleDecline = async (id: string) => {
    try {
      await reviewRequests.update(id, { status: 'declined' });
      setReceived((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'declined' as const } : r)));
    } catch (_) {}
  };

  const handleDeleteSent = async (id: string) => {
    try {
      await reviewRequests.delete(id);
      setSent((prev) => prev.filter((r) => r._id !== id));
    } catch (_) {}
  };

  if (authLoading || !user) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {!user && !authLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Inicia sesión para ver tus solicitudes.</p>
            <Link href="/login"><Button variant="orange">Iniciar sesión</Button></Link>
          </div>
        )}
        {authLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  const pendingReceived = received.filter((r) => r.status === 'pending');
  const otherReceived = received.filter((r) => r.status !== 'pending');

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Reviews solicitadas</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Solicitudes que te han hecho y las que tú has enviado
      </p>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setTab('received')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'received' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Recibidas {pendingReceived.length > 0 && `(${pendingReceived.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'sent' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Enviadas
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === 'received' ? (
        <div className="space-y-4">
          {received.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No tienes solicitudes recibidas.</p>
          ) : (
            <>
              {pendingReceived.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  variant="received"
                  onDecline={() => handleDecline(req._id)}
                />
              ))}
              {otherReceived.map((req) => (
                <RequestCard key={req._id} request={req} variant="received" onDecline={() => {}} />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sent.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No has enviado ninguna solicitud.</p>
          ) : (
            sent.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                variant="sent"
                onCancel={() => handleDeleteSent(req._id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  variant,
  onDecline,
  onCancel,
}: {
  request: ApiReviewRequest;
  variant: 'received' | 'sent';
  onDecline?: () => void;
  onCancel?: () => void;
}) {
  const isPending = request.status === 'pending';
  const artwork = request.artworkUrl?.replace('-large', '-t500x500') || null;
  const user = variant === 'received' ? request.from : request.to;
  const reviewUrl = `/review/new?type=${request.contentType}&id=${request.soundcloudId}&title=${encodeURIComponent(request.title)}&artwork=${encodeURIComponent(request.artworkUrl || '')}&artist=${encodeURIComponent(request.artistName || '')}&permalink=${encodeURIComponent(request.soundcloudPermalink || '')}&requestId=${request._id}`;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
          {artwork ? (
            <Image src={artwork} alt={request.title} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {request.contentType === 'track' ? <Music className="w-6 h-6" /> : <List className="w-6 h-6" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase text-primary font-medium">{request.contentType}</p>
          <p className="font-semibold truncate">{request.title}</p>
          {request.artistName && <p className="text-sm text-muted-foreground truncate">{request.artistName}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {variant === 'received' ? (
              <>Pedido por <Link href={`/profile/${request.from._id}`} className="text-primary hover:underline">{request.from.displayName || request.from.username}</Link></>
            ) : (
              <>Para <Link href={`/profile/${request.to._id}`} className="text-primary hover:underline">{request.to.displayName || request.to.username}</Link></>
            )}
            {' · '}{formatDate(request.createdAt)}
          </p>
          {request.message && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">&quot;{request.message}&quot;</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {variant === 'received' && isPending && (
              <>
                <Link href={reviewUrl}>
                  <Button variant="orange" size="sm" className="gap-1">
                    <Send className="w-3 h-3" /> Escribir review
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={onDecline}>
                  Rechazar
                </Button>
              </>
            )}
            {variant === 'received' && request.status === 'completed' && request.reviewId && (
              <Link href={`/review/${request.reviewId}`}>
                <Button variant="outline" size="sm">Ver review</Button>
              </Link>
            )}
            {variant === 'sent' && isPending && onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
                Cancelar solicitud
              </Button>
            )}
            {variant === 'sent' && request.status === 'completed' && request.reviewId && (
              <Link href={`/review/${request.reviewId}`}>
                <Button variant="outline" size="sm">Ver review</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
