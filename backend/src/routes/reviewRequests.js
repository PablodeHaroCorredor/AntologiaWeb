import { Router } from 'express';
import ReviewRequest from '../models/ReviewRequest.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { toUserId, contentType, soundcloudId, soundcloudPermalink, title, artworkUrl, artistName, message } = req.body;
    if (!toUserId || !contentType || !soundcloudId || !title) {
      return res.status(400).json({ error: 'Faltan campos: toUserId, contentType, soundcloudId, title' });
    }
    if (toUserId === req.userId) {
      return res.status(400).json({ error: 'No puedes pedirte una review a ti mismo' });
    }
    const request = await ReviewRequest.create({
      from: req.userId,
      to: toUserId,
      contentType: contentType || 'track',
      soundcloudId: String(soundcloudId),
      soundcloudPermalink: soundcloudPermalink || '',
      title,
      artworkUrl: artworkUrl || '',
      artistName: artistName || '',
      message: message || '',
    });
    await request.populate('from', 'username displayName avatarUrl');
    await request.populate('to', 'username displayName avatarUrl');
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/received', authMiddleware, async (req, res) => {
  try {
    const { status, limit = 30, offset = 0 } = req.query;
    const filter = { to: req.userId };
    if (status) filter.status = status;
    const list = await ReviewRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 30, 50))
      .populate('from', 'username displayName avatarUrl _id');
    const total = await ReviewRequest.countDocuments(filter);
    res.json({ requests: list, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const list = await ReviewRequest.find({ from: req.userId })
      .sort({ createdAt: -1 })
      .skip(Number(offset) || 0)
      .limit(Math.min(Number(limit) || 30, 50))
      .populate('to', 'username displayName avatarUrl _id');
    const total = await ReviewRequest.countDocuments({ from: req.userId });
    res.json({ requests: list, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const request = await ReviewRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (request.to.toString() !== req.userId) {
      return res.status(403).json({ error: 'Solo el destinatario puede actualizar esta solicitud' });
    }
    const { status, reviewId } = req.body;
    if (status) request.status = status;
    if (reviewId) request.reviewId = reviewId;
    await request.save();
    await request.populate('from', 'username displayName avatarUrl');
    await request.populate('to', 'username displayName avatarUrl');
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const request = await ReviewRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (request.from.toString() !== req.userId) {
      return res.status(403).json({ error: 'Solo quien la envió puede cancelar la solicitud' });
    }
    await request.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
