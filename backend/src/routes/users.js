import { Router } from 'express';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

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
