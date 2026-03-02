'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ApiUser } from '@/lib/api';
import { auth as authApi, setToken, clearToken } from '@/lib/api';

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (tokenFromHash?: string | null) => {
    try {
      const me = await authApi.me(tokenFromHash);
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Leer token de query (?token=...) o de hash (#token=...) por si el redirect usa uno u otro
    const params = new URLSearchParams(window.location.search);
    const hashMatch = window.location.hash.match(/token=([^&]+)/);
    const tokenParam = params.get('token') || (hashMatch ? decodeURIComponent(hashMatch[1]) : null);
    if (tokenParam) {
      const token = tokenParam;
      setToken(token);
      // Quitar token de la URL por seguridad (no dejar en historial)
      const cleanSearch = [...params.entries()]
        .filter(([k]) => k !== 'token')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, string>);
      const newSearch = new URLSearchParams(cleanSearch).toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState(null, '', newUrl);
      refresh(token);
    } else {
      refresh();
    }
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
