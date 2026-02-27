import { Router } from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { jwtSign } from '../middleware/auth.js';
import {
  getAuthorizeUrl,
  exchangeCodeForToken,
  getMe,
} from '../services/soundcloud.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REDIRECT_URI = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/soundcloud/callback`;

router.get('/soundcloud/authorize', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  res.cookie('pkce_verifier', verifier, { httpOnly: true, maxAge: 600000, sameSite: 'lax' });
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000, sameSite: 'lax' });
  const url = getAuthorizeUrl(REDIRECT_URI, state, challenge);
  res.json({ url, state });
});

router.get('/soundcloud/callback', async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;
  const verifier = req.cookies?.pkce_verifier;
  if (!code || state !== savedState || !verifier) {
    return res.redirect(`${FRONTEND_URL}/login?error=invalid_callback`);
  }
  res.clearCookie('oauth_state');
  res.clearCookie('pkce_verifier');
  try {
    const tokens = await exchangeCodeForToken(code, REDIRECT_URI, verifier);
    const me = await getMe(tokens.access_token);
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;
    let user = await User.findOne({ soundcloudId: String(me.id) });
    if (!user) {
      user = await User.create({
        soundcloudId: String(me.id),
        username: me.username || me.permalink || String(me.id),
        displayName: me.full_name || me.username || '',
        avatarUrl: me.avatar_url || '',
        profileUrl: me.permalink_url || '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenExpiresAt: expiresAt,
      });
    } else {
      user.accessToken = tokens.access_token;
      user.refreshToken = tokens.refresh_token || user.refreshToken;
      user.tokenExpiresAt = expiresAt;
      user.username = me.username || user.username;
      user.displayName = me.full_name || user.displayName;
      user.avatarUrl = me.avatar_url || user.avatarUrl;
      user.profileUrl = me.permalink_url || user.profileUrl;
      await user.save();
    }
    const token = jwtSign({ userId: user._id.toString() });
    res.redirect(`${FRONTEND_URL}/?logged_in=1#token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const { jwtVerify } = await import('../middleware/auth.js');
    const { userId } = jwtVerify(token);
    const user = await User.findById(userId).select('-accessToken -refreshToken');
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
