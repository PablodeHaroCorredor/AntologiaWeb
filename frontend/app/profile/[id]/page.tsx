'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewCard } from '@/components/feed/ReviewCard';
import { RequestReviewModal } from '@/components/profile/RequestReviewModal';
import { users } from '@/lib/api';
import type { ApiReview, ApiUser, SoundCloudTrack, SoundCloudPlaylist } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { MessageCircle, LogOut, Music, List, Loader2, ChevronDown, ChevronRight, FileText, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData extends ApiUser {
  stats: { reviewCount: number; draftCount: number };
}

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviewsList, setReviewsList] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [soundcloudLibrary, setSoundcloudLibrary] = useState<{ playlists: SoundCloudPlaylist[]; tracks: SoundCloudTrack[] } | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState(false);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [playlistDetails, setPlaylistDetails] = useState<Record<string, SoundCloudPlaylist>>({});
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  type ProfileTab = 'reviews' | 'library';
  const [profileTab, setProfileTab] = useState<ProfileTab>('reviews');

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

  useEffect(() => {
    if (currentUser && profile && currentUser._id === profile._id) {
      setLibraryLoading(true);
      setLibraryError(false);
      users.soundcloudLibrary()
        .then((data) => {
          setSoundcloudLibrary(data);
          setLibraryError(false);
        })
        .catch(() => {
          setSoundcloudLibrary(null);
          setLibraryError(true);
        })
        .finally(() => setLibraryLoading(false));
    }
  }, [currentUser?._id, profile?._id]);

  const togglePlaylist = async (playlistId: string) => {
    if (expandedPlaylistId === playlistId) {
      setExpandedPlaylistId(null);
      return;
    }
    if (playlistDetails[playlistId]) {
      setExpandedPlaylistId(playlistId);
      return;
    }
    setLoadingPlaylistId(playlistId);
    try {
      const full = await users.playlistFromLibrary(playlistId);
      setPlaylistDetails((prev) => ({ ...prev, [playlistId]: full }));
      setExpandedPlaylistId(playlistId);
    } catch (_) {
      setExpandedPlaylistId(null);
    } finally {
      setLoadingPlaylistId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-32 rounded-xl bg-card mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-card" />
          <div className="h-64 rounded-xl bg-card" />
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

  const isOwnProfile = currentUser && currentUser._id === profile._id;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabecera del perfil */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar className="w-24 h-24 shrink-0">
          <AvatarImage src={profile.avatarUrl} />
          <AvatarFallback className="text-2xl">{profile.username?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm">
            <span><strong className="text-primary">{profile.stats.reviewCount}</strong> reviews</span>
            <span className="text-muted-foreground">{profile.stats.draftCount} borradores</span>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
            {currentUser && currentUser._id !== profile._id && (
              <Button variant="orange" size="sm" className="gap-2" onClick={() => setRequestModalOpen(true)}>
                <MessageCircle className="w-4 h-4" /> Pedir review
              </Button>
            )}
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
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

      {/* Pestañas solo en móvil: Reviews (por defecto) y Biblioteca */}
      <div className="flex gap-2 border-b border-border pb-2 lg:hidden">
        <button
          type="button"
          onClick={() => setProfileTab('reviews')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            profileTab === 'reviews' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="w-4 h-4" /> Reviews
        </button>
        <button
          type="button"
          onClick={() => setProfileTab('library')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            profileTab === 'library' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Library className="w-4 h-4" /> Biblioteca
        </button>
      </div>

      {/* Dos columnas en desktop; en móvil solo se muestra la pestaña activa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna 1: Tu biblioteca de SoundCloud (solo propio perfil) */}
        <section
          className={cn(
            'rounded-xl border border-border bg-card p-5',
            profileTab === 'library' ? 'block' : 'hidden lg:block'
          )}
        >
          <h2 className="text-lg font-semibold mb-1">Tu biblioteca de SoundCloud</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Tus playlists, canciones y álbumes para reseñar
          </p>
          {!isOwnProfile ? (
            <p className="text-muted-foreground text-sm py-4">Inicia sesión para ver tu biblioteca en tu perfil.</p>
          ) : libraryLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando biblioteca...
            </div>
          ) : libraryError ? (
            <p className="text-muted-foreground text-sm py-4">
              No se pudo cargar la biblioteca. Si tu sesión ha expirado, cierra sesión y vuelve a iniciar sesión.
            </p>
          ) : soundcloudLibrary && (soundcloudLibrary.playlists?.length > 0 || soundcloudLibrary.tracks?.length > 0) ? (
            <div className="space-y-5">
              {soundcloudLibrary.tracks && soundcloudLibrary.tracks.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4" /> Canciones
                  </h3>
                  <ul className="space-y-2">
                    {soundcloudLibrary.tracks.map((t, idx) => (
                      <SoundCloudItem
                        key={`track-${t.id}`}
                        type="track"
                        id={String(t.id)}
                        title={t.title}
                        artworkUrl={t.artwork_url}
                        subtitle={t.user?.username}
                        permalinkUrl={t.permalink_url}
                        priority={idx === 0}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {soundcloudLibrary.playlists && soundcloudLibrary.playlists.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <List className="w-4 h-4" /> Playlists y álbumes
                  </h3>
                  <ul className="space-y-2">
                    {soundcloudLibrary.playlists.map((p, idx) => (
                      <PlaylistItem
                        key={`playlist-${p.id}`}
                        playlist={p}
                        isExpanded={expandedPlaylistId === String(p.id)}
                        detail={playlistDetails[String(p.id)]}
                        loading={loadingPlaylistId === String(p.id)}
                        onToggle={() => togglePlaylist(String(p.id))}
                        priority={idx === 0}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : soundcloudLibrary && !libraryLoading ? (
            <p className="text-muted-foreground text-sm py-4">
              No tienes playlists ni canciones en tu cuenta de SoundCloud.
            </p>
          ) : null}
        </section>

        {/* Columna 2: Reviews publicadas */}
        <section
          className={cn(
            'rounded-xl border border-border bg-card p-5',
            profileTab === 'reviews' ? 'block' : 'hidden lg:block'
          )}
        >
          <h2 className="text-lg font-semibold mb-1">Reviews publicadas</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Críticas que {isOwnProfile ? 'has' : 'ha'} publicado
          </p>
          {reviewsList.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Aún no hay reviews publicadas.</p>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {reviewsList.map((r, index) => (
                <ReviewCard
                  key={r._id}
                  review={r}
                  priority={index === 0}
                  onDeleted={(id) => setReviewsList((prev) => prev.filter((x) => x._id !== id))}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SoundCloudItem({
  type,
  id,
  title,
  artworkUrl,
  subtitle,
  permalinkUrl,
  priority,
}: {
  type: 'track' | 'playlist';
  id: string;
  title: string;
  artworkUrl?: string;
  subtitle?: string;
  permalinkUrl?: string;
  trackCount?: number;
  priority?: boolean;
}) {
  const artwork = artworkUrl?.replace('-large', '-t500x500') || null;
  const reviewUrl = `/review/new?type=${type}&id=${id}&title=${encodeURIComponent(title)}&artwork=${encodeURIComponent(artworkUrl || '')}&artist=${encodeURIComponent(subtitle || '')}&permalink=${encodeURIComponent(permalinkUrl || '')}`;
  return (
    <li>
      <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background/50 hover:border-primary/40 transition-colors">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
          {artwork ? (
            <Image src={artwork} alt={title} width={48} height={48} className="w-full h-full object-cover" priority={priority} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {type === 'track' ? <Music className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <Link href={reviewUrl}>
          <Button variant="orange" size="sm" className="shrink-0">Escribir review</Button>
        </Link>
      </div>
    </li>
  );
}

function PlaylistItem({
  playlist,
  isExpanded,
  detail,
  loading,
  onToggle,
  priority,
}: {
  playlist: SoundCloudPlaylist;
  isExpanded: boolean;
  detail?: SoundCloudPlaylist;
  loading: boolean;
  onToggle: () => void;
  priority?: boolean;
}) {
  const id = String(playlist.id);
  const artwork = playlist.artwork_url?.replace('-large', '-t500x500') || null;
  const tracks = detail?.tracks ?? [];
  const reviewPlaylistUrl = `/review/new?type=playlist&id=${id}&title=${encodeURIComponent(playlist.title)}&artwork=${encodeURIComponent(playlist.artwork_url || '')}&artist=${encodeURIComponent(playlist.user?.username || '')}&permalink=${encodeURIComponent(playlist.permalink_url || '')}`;

  return (
    <li className="rounded-lg border border-border bg-background/50 overflow-hidden">
      <div className="flex items-center gap-3 p-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground"
          aria-expanded={isExpanded}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
          {artwork ? (
            <Image src={artwork} alt={playlist.title} width={48} height={48} className="w-full h-full object-cover" priority={priority} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <List className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{playlist.title}</p>
          <p className="text-xs text-muted-foreground">
            {playlist.track_count ?? tracks.length ?? 0} pistas
          </p>
        </div>
        <Link href={reviewPlaylistUrl}>
          <Button variant="orange" size="sm" className="shrink-0">Review playlist</Button>
        </Link>
      </div>
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Canciones dentro — reseña una en concreto</p>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Sin pistas o no disponibles.</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {tracks.map((item) => {
              const t = (item as { track?: SoundCloudTrack }).track ?? (item as SoundCloudTrack);
              const tid = t.id;
              if (tid == null) return null;
              return (
                <li key={tid} className="flex items-center gap-2 py-1.5 pl-2 rounded bg-background/60">
                  <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                    {t.artwork_url ? (
                      <Image
                        src={t.artwork_url.replace('-large', '-t300x300')}
                        alt=""
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Music className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 truncate text-sm">{t.title ?? `Track ${tid}`}</span>
                  <Link
                    href={`/review/new?type=track&id=${tid}&title=${encodeURIComponent(t.title ?? '')}&artwork=${encodeURIComponent(t.artwork_url || '')}&artist=${encodeURIComponent(t.user?.username || '')}&permalink=${encodeURIComponent(t.permalink_url || '')}`}
                  >
                    <Button variant="outline" size="sm" className="shrink-0 text-xs h-7">Review</Button>
                  </Link>
                </li>
              );
            })}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
