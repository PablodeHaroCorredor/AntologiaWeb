'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { soundcloud } from '@/lib/api';
import type { SoundCloudTrack, SoundCloudPlaylist } from '@/lib/api';
import { SearchResults } from '@/components/search/SearchResults';

const DEBOUNCE_MS = 350;

function isSoundCloudUrl(text: string): boolean {
  const t = text.trim();
  return (t.startsWith('http://') || t.startsWith('https://')) && t.includes('soundcloud.com');
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SoundCloudTrack[]>([]);
  const [playlists, setPlaylists] = useState<SoundCloudPlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) {
      setTracks([]);
      setPlaylists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isSoundCloudUrl(term)) {
        const resolved = await soundcloud.resolve(term);
        const isPlaylist = 'track_count' in resolved || 'tracks' in resolved;
        if (isPlaylist) {
          setPlaylists([resolved as SoundCloudPlaylist]);
          setTracks([]);
        } else {
          setTracks([resolved as SoundCloudTrack]);
          setPlaylists([]);
        }
      } else {
        const data = await soundcloud.search(term, 'all', 20, 0);
        setTracks(data.tracks || []);
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      setTracks([]);
      setPlaylists([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setTracks([]);
      setPlaylists([]);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      doSearch(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Buscar en SoundCloud</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Escribe para buscar o pega una URL de SoundCloud
      </p>
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar canciones, playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin pointer-events-none" />
        )}
      </div>
      <SearchResults
        tracks={tracks}
        playlists={playlists}
        loading={loading}
        query={query}
      />
    </div>
  );
}
