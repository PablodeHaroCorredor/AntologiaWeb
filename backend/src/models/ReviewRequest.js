import mongoose from 'mongoose';

const reviewRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentType: { type: String, enum: ['track', 'playlist', 'album'], required: true },
  soundcloudId: { type: String, required: true },
  soundcloudPermalink: { type: String, default: '' },
  title: { type: String, required: true },
  artworkUrl: { type: String, default: '' },
  artistName: { type: String, default: '' },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'declined', 'completed'],
    default: 'pending',
  },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
}, { timestamps: true });

reviewRequestSchema.index({ to: 1, status: 1, createdAt: -1 });
reviewRequestSchema.index({ from: 1, createdAt: -1 });

export default mongoose.model('ReviewRequest', reviewRequestSchema);
