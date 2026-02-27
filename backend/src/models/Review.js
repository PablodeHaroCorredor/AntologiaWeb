import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Tipo: track | playlist | album (en SoundCloud son playlists con tipo album)
  contentType: { type: String, enum: ['track', 'playlist', 'album'], required: true },
  soundcloudId: { type: String, required: true },
  soundcloudPermalink: { type: String, default: '' },
  title: { type: String, required: true },
  artworkUrl: { type: String, default: '' },
  artistName: { type: String, default: '' },
  artistPermalink: { type: String, default: '' },
  // Metadatos extra que guardamos del recurso
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  rating: { type: Number, min: 1, max: 5, required: true },
  body: { type: String, default: '' },
  isDraft: { type: Boolean, default: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

reviewSchema.index({ author: 1, createdAt: -1 });
reviewSchema.index({ isDraft: 1, createdAt: -1 });
reviewSchema.index({ soundcloudId: 1, contentType: 1 });

export default mongoose.model('Review', reviewSchema);
