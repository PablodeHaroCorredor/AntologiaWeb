import { Router } from 'express';
import Review from '../models/Review.js';
import { authMiddleware } from '../middleware/auth.js';
import { getIO } from '../config/socket.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { userId, draft, limit = 20, offset = 0 } = req.query;
    const filter = {};
    if (userId) filter.author = userId;
    if (draft !== undefined) filter.isDraft = draft === 'true';
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 20, 50))
      .populate('author', 'username displayName avatarUrl profileUrl');
    const total = await Review.countDocuments(filter);
    res.json({ reviews, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('author', 'username displayName avatarUrl profileUrl');
    if (!review) return res.status(404).json({ error: 'Review no encontrada' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      contentType,
      soundcloudId,
      soundcloudPermalink,
      title,
      artworkUrl,
      artistName,
      artistPermalink,
      metadata,
      rating,
      body,
      isDraft = true,
    } = req.body;
    if (!contentType || !soundcloudId || !title || rating == null) {
      return res.status(400).json({ error: 'Faltan campos requeridos: contentType, soundcloudId, title, rating' });
    }
    const review = await Review.create({
      author: req.userId,
      contentType: contentType || 'track',
      soundcloudId: String(soundcloudId),
      soundcloudPermalink: soundcloudPermalink || '',
      title,
      artworkUrl: artworkUrl || '',
      artistName: artistName || '',
      artistPermalink: artistPermalink || '',
      metadata: metadata || {},
      rating: Math.min(5, Math.max(1, Number(rating))),
      body: body || '',
      isDraft: Boolean(isDraft),
    });
    await review.populate('author', 'username displayName avatarUrl profileUrl');
    if (!review.isDraft) {
      getIO().emit('new_review', JSON.parse(JSON.stringify(review)));
    }
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review no encontrada' });
    if (review.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'No puedes editar esta review' });
    }
    const allowed = ['rating', 'body', 'isDraft', 'title', 'artworkUrl', 'artistName', 'metadata'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) review[key] = req.body[key];
    }
    if (review.rating != null) review.rating = Math.min(5, Math.max(1, Number(review.rating)));
    await review.save();
    await review.populate('author', 'username displayName avatarUrl profileUrl');
    if (!review.isDraft) getIO().emit('review_updated', review);
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review no encontrada' });
    if (review.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'No puedes eliminar esta review' });
    }
    await review.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review no encontrada' });
    const idx = review.likes.indexOf(req.userId);
    if (idx === -1) review.likes.push(req.userId);
    else review.likes.splice(idx, 1);
    await review.save();
    res.json({ likes: review.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
