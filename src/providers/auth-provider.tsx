'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { userApi } from '@/services/api';
import { setAccessToken } from '@/services/api/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, logout } = useAuthStore();

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) return;

    const initAuth = async () => {
      const accessToken = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      if (!accessToken) {
        setLoading(false);
        return;
      }

      setAccessToken(accessToken);

      try {
        const userData = await userApi.me();
        setUser(userData);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated, setUser, setLoading, logout]);

  return <>{children}</>;
}
