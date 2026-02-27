const SOUNDCLOUD_API = 'https://api.soundcloud.com';
const SOUNDCLOUD_OAUTH = 'https://secure.soundcloud.com';

let clientToken = null;
let clientTokenExpiry = 0;

function getClientId() {
  const id = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!id) throw new Error('SOUNDCLOUD_CLIENT_ID not set');
  return id;
}

function getClientSecret() {
  return process.env.SOUNDCLOUD_CLIENT_SECRET || '';
}

export async function getClientCredentialsToken() {
  if (clientToken && Date.now() < clientTokenExpiry - 60000) {
    return clientToken;
  }
  const id = getClientId();
  const secret = getClientSecret();
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${SOUNDCLOUD_OAUTH}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json; charset=utf-8',
      'Authorization': `Basic ${auth}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SoundCloud token error: ${res.status} ${err}`);
  }
  const data = await res.json();
  clientToken = data.access_token;
  clientTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return clientToken;
}

function authHeader(token) {
  return { Authorization: `OAuth ${token}` };
}

export async function searchTracks(q, limit = 20, offset = 0) {
  const token = await getClientCredentialsToken();
  const params = new URLSearchParams({
    q: q || '',
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
    linked_partitioning: 'true',
  });
  const res = await fetch(`${SOUNDCLOUD_API}/tracks?${params}`, {
    headers: { 'Accept': 'application/json; charset=utf-8', ...authHeader(token) },
  });
  if (!res.ok) throw new Error(`SoundCloud API: ${res.status}`);
  return res.json();
}

export async function searchPlaylists(q, limit = 20, offset = 0) {
  const token = await getClientCredentialsToken();
  const params = new URLSearchParams({
    q: q || '',
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
    linked_partitioning: 'true',
  });
  const res = await fetch(`${SOUNDCLOUD_API}/playlists?${params}`, {
    headers: { 'Accept': 'application/json; charset=utf-8', ...authHeader(token) },
  });
  if (!res.ok) throw new Error(`SoundCloud API: ${res.status}`);
  return res.json();
}

export async function getTrack(id, token) {
  const t = token || await getClientCredentialsToken();
  const res = await fetch(`${SOUNDCLOUD_API}/tracks/${id}`, {
    headers: { 'Accept': 'application/json; charset=utf-8', ...authHeader(t) },
  });
  if (!res.ok) throw new Error(`Track not found: ${res.status}`);
  return res.json();
}

export async function getPlaylist(id, token) {
  const t = token || await getClientCredentialsToken();
  const res = await fetch(`${SOUNDCLOUD_API}/playlists/${id}?show_tracks=true`, {
    headers: { 'Accept': 'application/json; charset=utf-8', ...authHeader(t) },
  });
  if (!res.ok) throw new Error(`Playlist not found: ${res.status}`);
  return res.json();
}

export async function resolveUrl(url, token) {
  const t = token || await getClientCredentialsToken();
  const params = new URLSearchParams({ url });
  const res = await fetch(`${SOUNDCLOUD_API}/resolve?${params}`, {
    headers: { 'Accept': 'application/json; charset=utf-8', ...authHeader(t) },
  });
  if (!res.ok) throw new Error(`Resolve failed: ${res.status}`);
  return res.json();
}

export async function getMe(accessToken) {
  const res = await fetch(`${SOUNDCLOUD_API}/me`, {
    headers: { 'Accept': 'application/json; charset=utf-8', ...authHeader(accessToken) },
  });
  if (!res.ok) throw new Error('Invalid SoundCloud token');
  return res.json();
}

export function getAuthorizeUrl(redirectUri, state, codeChallenge) {
  const clientId = getClientId();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
  return `${SOUNDCLOUD_OAUTH}/authorize?${params}`;
}

export async function exchangeCodeForToken(code, redirectUri, codeVerifier) {
  const id = getClientId();
  const secret = getClientSecret();
  const res = await fetch(`${SOUNDCLOUD_OAUTH}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json; charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: id,
      client_secret: secret,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      code,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }
  return res.json();
}
