'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, Search as SearchIcon, Music, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { soundcloud, reviewRequests } from '@/lib/api';
import type { SoundCloudTrack, SoundCloudPlaylist } from '@/lib/api';
import type { ApiUser } from '@/lib/api';

interface RequestReviewModalProps {
  targetUser: ApiUser;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

type SearchItem = { type: 'track' | 'playlist'; id: string; title: string; artworkUrl?: string; artist?: string; permalinkUrl?: string };

export function RequestReviewModal({ targetUser, open, onClose, onSent }: RequestReviewModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchItem | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setMessage('');
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      soundcloud.search(query.trim(), 'all', 15, 0)
        .then((data) => {
          const items: SearchItem[] = [];
          (data.tracks || []).forEach((t: SoundCloudTrack) => {
            items.push({
              type: 'track',
              id: String(t.id),
              title: t.title,
              artworkUrl: t.artwork_url,
              artist: t.user?.username,
              permalinkUrl: t.permalink_url,
            });
          });
          (data.playlists || []).forEach((p: SoundCloudPlaylist) => {
            items.push({
              type: 'playlist',
              id: String(p.id),
              title: p.title,
              artworkUrl: p.artwork_url,
              artist: p.user?.username,
              permalinkUrl: p.permalink_url,
            });
          });
          setResults(items);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await reviewRequests.create({
        toUserId: targetUser._id,
        contentType: selected.type,
        soundcloudId: selected.id,
        soundcloudPermalink: (() => {
          try {
            return selected.permalinkUrl ? new URL(selected.permalinkUrl).pathname : '';
          } catch {
            return '';
          }
        })(),
        title: selected.title,
        artworkUrl: selected.artworkUrl || '',
        artistName: selected.artist || '',
        message: message.trim() || undefined,
      });
      onSent();
      onClose();
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Pedir review a {targetUser.displayName || targetUser.username}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar canción o playlist</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Escribe para buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {searching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
            </div>
          )}
          {results.length > 0 && !selected && (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {results.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-left"
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted shrink-0">
                      {item.artworkUrl ? (
                        <Image
                          src={item.artworkUrl.replace('-large', '-t300x300')}
                          alt=""
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {item.type === 'track' ? <Music className="w-5 h-5" /> : <List className="w-5 h-5" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.title}</p>
                      {item.artist && <p className="text-xs text-muted-foreground truncate">{item.artist}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                {selected.artworkUrl ? (
                  <Image
                    src={selected.artworkUrl.replace('-large', '-t300x300')}
                    alt=""
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {selected.type === 'track' ? <Music className="w-6 h-6" /> : <List className="w-6 h-6" />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selected.title}</p>
                {selected.artist && <p className="text-sm text-muted-foreground truncate">{selected.artist}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Cambiar</Button>
            </div>
          )}
          {selected && (
            <div>
              <label className="block text-sm font-medium mb-2">Mensaje (opcional)</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="¿Por qué te gustaría que reseñe esto?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="orange" onClick={handleSend} disabled={!selected || sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enviar solicitud
          </Button>
        </div>
      </div>
    </div>
  );
}
