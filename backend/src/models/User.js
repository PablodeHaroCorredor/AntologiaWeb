import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  soundcloudId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  profileUrl: { type: String, default: '' },
  accessToken: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  tokenExpiresAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.index({ soundcloudId: 1 });
userSchema.index({ username: 1 });

export default mongoose.model('User', userSchema);
