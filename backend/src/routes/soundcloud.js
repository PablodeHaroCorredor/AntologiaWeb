import { Router } from 'express';
import {
  searchTracks,
  searchPlaylists,
  getTrack,
  getPlaylist,
  resolveUrl,
} from '../services/soundcloud.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20, offset = 0 } = req.query;
    const limitNum = Math.min(Number(limit) || 20, 50);
    const offsetNum = Number(offset) || 0;
    if (type === 'tracks' || type === 'all') {
      const [tracks, playlists] = await Promise.all([
        searchTracks(q, limitNum, offsetNum),
        type === 'all' ? searchPlaylists(q, Math.min(10, limitNum), 0) : Promise.resolve({ collection: [] }),
      ]);
      const trackList = Array.isArray(tracks) ? tracks : tracks?.collection || [];
      const playlistList = Array.isArray(playlists) ? playlists : playlists?.collection || [];
      return res.json({
        tracks: trackList,
        playlists: playlistList,
        next_href: tracks?.next_href || playlists?.next_href,
      });
    }
    if (type === 'playlists') {
      const playlists = await searchPlaylists(q, limitNum, offsetNum);
      const list = Array.isArray(playlists) ? playlists : playlists?.collection || [];
      return res.json({ playlists: list, next_href: playlists?.next_href });
    }
    return res.status(400).json({ error: 'type must be tracks, playlists, or all' });
  } catch (err) {
    console.error('SoundCloud search error:', err);
    res.status(502).json({ error: err.message || 'Error searching SoundCloud' });
  }
});

router.get('/tracks/:id', async (req, res) => {
  try {
    const track = await getTrack(req.params.id);
    res.json(track);
  } catch (err) {
    res.status(err.message?.includes('not found') ? 404 : 502).json({ error: err.message });
  }
});

router.get('/playlists/:id', async (req, res) => {
  try {
    const playlist = await getPlaylist(req.params.id);
    res.json(playlist);
  } catch (err) {
    res.status(err.message?.includes('not found') ? 404 : 502).json({ error: err.message });
  }
});

router.get('/resolve', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    const resolved = await resolveUrl(url);
    res.json(resolved);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
