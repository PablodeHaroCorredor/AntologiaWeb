const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'antologia_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) ?? document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1] ?? null;
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const auth = {
  getAuthorizeUrl: () => api<{ url: string; state: string }>('/api/auth/soundcloud/authorize'),
  me: () => api<ApiUser>('/api/auth/me'),
  async logout() {
    await api<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    clearToken();
  },
};

export const soundcloud = {
  search: (q: string, type: 'all' | 'tracks' | 'playlists' = 'all', limit = 20, offset = 0) =>
    api<{ tracks: SoundCloudTrack[]; playlists: SoundCloudPlaylist[]; next_href?: string }>(
      `/api/soundcloud/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}&offset=${offset}`
    ),
  track: (id: string) => api<SoundCloudTrack>(`/api/soundcloud/tracks/${id}`),
  playlist: (id: string) => api<SoundCloudPlaylist>(`/api/soundcloud/playlists/${id}`),
  resolve: (url: string) => api<SoundCloudTrack | SoundCloudPlaylist>(`/api/soundcloud/resolve?url=${encodeURIComponent(url)}`),
};

export const reviews = {
  list: (params?: { userId?: string; draft?: boolean; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.userId) sp.set('userId', params.userId);
    if (params?.draft !== undefined) sp.set('draft', String(params.draft));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    return api<{ reviews: ApiReview[]; total: number }>(`/api/reviews?${sp}`);
  },
  get: (id: string) => api<ApiReview>(`/api/reviews/${id}`),
  create: (data: CreateReviewInput) =>
    api<ApiReview>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateReviewInput>) =>
    api<ApiReview>(`/api/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<{ ok: boolean }>(`/api/reviews/${id}`, { method: 'DELETE' }),
  like: (id: string) => api<{ likes: number; liked: boolean }>(`/api/reviews/${id}/like`, { method: 'POST' }),
};

export const feed = {
  list: (limit = 20, offset = 0) =>
    api<{ reviews: ApiReview[]; total: number }>(`/api/feed?limit=${limit}&offset=${offset}`),
};

export const users = {
  get: (id: string) => api<ApiUser & { stats: { reviewCount: number; draftCount: number } }>(`/api/users/${id}`),
  reviews: (id: string, opts?: { drafts?: boolean; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (opts?.drafts) sp.set('drafts', 'true');
    if (opts?.limit) sp.set('limit', String(opts.limit));
    if (opts?.offset) sp.set('offset', String(opts.offset));
    return api<{ reviews: ApiReview[]; total: number }>(`/api/users/${id}/reviews?${sp}`);
  },
  soundcloudLibrary: () =>
    api<{ playlists: SoundCloudPlaylist[]; tracks: SoundCloudTrack[] }>('/api/users/me/soundcloud-library'),
};

export interface ApiReviewRequest {
  _id: string;
  from: ApiUser;
  to: ApiUser;
  contentType: 'track' | 'playlist' | 'album';
  soundcloudId: string;
  soundcloudPermalink: string;
  title: string;
  artworkUrl: string;
  artistName: string;
  message: string;
  status: 'pending' | 'declined' | 'completed';
  reviewId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const reviewRequests = {
  create: (data: {
    toUserId: string;
    contentType: 'track' | 'playlist' | 'album';
    soundcloudId: string;
    soundcloudPermalink?: string;
    title: string;
    artworkUrl?: string;
    artistName?: string;
    message?: string;
  }) => api<ApiReviewRequest>('/api/review-requests', { method: 'POST', body: JSON.stringify(data) }),
  received: (params?: { status?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    return api<{ requests: ApiReviewRequest[]; total: number }>(`/api/review-requests/received?${sp}`);
  },
  sent: (params?: { limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    return api<{ requests: ApiReviewRequest[]; total: number }>(`/api/review-requests/sent?${sp}`);
  },
  update: (id: string, data: { status?: string; reviewId?: string }) =>
    api<ApiReviewRequest>(`/api/review-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<{ ok: boolean }>(`/api/review-requests/${id}`, { method: 'DELETE' }),
};

export interface ApiUser {
  _id: string;
  soundcloudId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface ApiReview {
  _id: string;
  author: ApiUser;
  contentType: 'track' | 'playlist' | 'album';
  soundcloudId: string;
  soundcloudPermalink: string;
  title: string;
  artworkUrl: string;
  artistName: string;
  artistPermalink: string;
  metadata: Record<string, unknown>;
  rating: number;
  body: string;
  isDraft: boolean;
  likes: string[];
  liked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  contentType: 'track' | 'playlist' | 'album';
  soundcloudId: string;
  soundcloudPermalink?: string;
  title: string;
  artworkUrl?: string;
  artistName?: string;
  artistPermalink?: string;
  metadata?: Record<string, unknown>;
  rating: number;
  body?: string;
  isDraft?: boolean;
}

export interface SoundCloudTrack {
  id: number;
  title: string;
  permalink_url?: string;
  artwork_url?: string;
  user?: { username?: string; permalink_url?: string };
  duration?: number;
  playback_count?: number;
  likes_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface SoundCloudPlaylist {
  id: number;
  title: string;
  permalink_url?: string;
  artwork_url?: string;
  user?: { username?: string; permalink_url?: string };
  track_count?: number;
  created_at?: string;
  tracks?: SoundCloudTrack[];
  [key: string]: unknown;
}
