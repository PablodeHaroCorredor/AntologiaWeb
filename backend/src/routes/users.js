import { Router } from 'express';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { authMiddleware } from '../middleware/auth.js';
import { getMePlaylists, getMeTracks, getPlaylist } from '../services/soundcloud.js';

const router = Router();

router.get('/me/soundcloud-library', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('accessToken');
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'Vincula tu cuenta de SoundCloud desde el inicio de sesión' });
    }
    const [playlistsRaw, tracksRaw] = await Promise.all([
      getMePlaylists(user.accessToken, 50, 0),
      getMeTracks(user.accessToken, 50, 0),
    ]);
    const playlists = Array.isArray(playlistsRaw) ? playlistsRaw : playlistsRaw?.collection || [];
    const tracks = Array.isArray(tracksRaw) ? tracksRaw : tracksRaw?.collection || [];
    res.json({ playlists, tracks });
  } catch (err) {
    if (err.message?.includes('401') || err.message?.includes('Invalid')) {
      return res.status(401).json({ error: 'Sesión de SoundCloud expirada. Vuelve a iniciar sesión.' });
    }
    res.status(502).json({ error: err.message || 'Error al cargar la biblioteca' });
  }
});

router.get('/me/playlists/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('accessToken');
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'Vincula tu cuenta de SoundCloud desde el inicio de sesión' });
    }
    const playlist = await getPlaylist(req.params.id, user.accessToken);
    res.json(playlist);
  } catch (err) {
    if (err.message?.includes('401') || err.message?.includes('Invalid')) {
      return res.status(401).json({ error: 'Sesión de SoundCloud expirada. Vuelve a iniciar sesión.' });
    }
    if (err.message?.includes('not found') || err.message?.includes('404')) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }
    res.status(502).json({ error: err.message || 'Error al cargar la playlist' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-accessToken -refreshToken');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const reviewCount = await Review.countDocuments({ author: user._id, isDraft: false });
    const draftCount = await Review.countDocuments({ author: user._id, isDraft: true });
    res.json({
      ...user.toObject(),
      stats: { reviewCount, draftCount },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;
    const drafts = req.query.drafts === 'true';
    const filter = { author: req.params.id };
    if (!drafts) filter.isDraft = false;
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('author', 'username displayName avatarUrl profileUrl');
    const total = await Review.countDocuments(filter);
    res.json({ reviews, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
