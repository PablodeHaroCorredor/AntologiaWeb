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
    const hash = window.location.hash;
    const match = hash.match(/token=([^&]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      setToken(token);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      // Usar el token del hash en la petición /me para evitar 401 por timing con localStorage en producción
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
