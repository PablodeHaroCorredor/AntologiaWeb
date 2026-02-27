import { Router } from 'express';
import Review from '../models/Review.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;
    const reviews = await Review.find({ isDraft: false })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('author', 'username displayName avatarUrl profileUrl');
    const total = await Review.countDocuments({ isDraft: false });
    const list = reviews.map((r) => {
      const doc = r.toObject();
      doc.liked = req.userId && r.likes.some((id) => id.toString() === req.userId);
      return doc;
    });
    res.json({ reviews: list, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
