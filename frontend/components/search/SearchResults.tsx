'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { SoundCloudTrack, SoundCloudPlaylist } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Music, List } from 'lucide-react';

interface SearchResultsProps {
  tracks: SoundCloudTrack[];
  playlists: SoundCloudPlaylist[];
  loading: boolean;
  query?: string;
}

export function SearchResults({ tracks, playlists, loading, query = '' }: SearchResultsProps) {
  const hasQuery = query.trim().length > 0;
  const hasTracks = tracks.length > 0;
  const hasPlaylists = playlists.length > 0;

  if (loading && hasQuery) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Buscando...</span>
      </div>
    );
  }

  if (!hasTracks && !hasPlaylists) {
    if (hasQuery) {
      return (
        <p className="text-muted-foreground py-8 text-center">
          Sin resultados para &quot;{query.trim()}&quot;
        </p>
      );
    }
    return null;
  }

  return (
    <div className="space-y-8">
      {hasTracks && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Canciones
          </h2>
          <ul className="space-y-2">
            {tracks.map((t) => (
              <li key={t.id}>
                <SearchResultItem
                  id={String(t.id)}
                  type="track"
                  title={t.title}
                  artworkUrl={t.artwork_url}
                  subtitle={t.user?.username}
                  permalinkUrl={t.permalink_url}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {hasPlaylists && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            Playlists / Álbumes
          </h2>
          <ul className="space-y-2">
            {playlists.map((p) => (
              <li key={p.id}>
                <SearchResultItem
                  id={String(p.id)}
                  type="playlist"
                  title={p.title}
                  artworkUrl={p.artwork_url}
                  subtitle={p.user?.username}
                  permalinkUrl={p.permalink_url}
                  trackCount={p.track_count}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SearchResultItem({
  id,
  type,
  title,
  artworkUrl,
  subtitle,
  permalinkUrl,
  trackCount,
}: {
  id: string;
  type: 'track' | 'playlist';
  title: string;
  artworkUrl?: string;
  subtitle?: string;
  permalinkUrl?: string;
  trackCount?: number;
}) {
  const artwork = artworkUrl?.replace('-large', '-t500x500') || null;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
        {artwork ? (
          <Image
            src={artwork}
            alt={title}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {type === 'track' ? <Music className="w-6 h-6" /> : <List className="w-6 h-6" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
        {trackCount != null && (
          <p className="text-xs text-muted-foreground">{trackCount} pistas</p>
        )}
      </div>
      <Link href={`/review/new?type=${type}&id=${id}&title=${encodeURIComponent(title)}&artwork=${encodeURIComponent(artworkUrl || '')}&artist=${encodeURIComponent(subtitle || '')}&permalink=${encodeURIComponent(permalinkUrl || '')}`}>
        <Button variant="orange" size="sm">Escribir review</Button>
      </Link>
    </div>
  );
}
