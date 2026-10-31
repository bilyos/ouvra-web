'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi, userApi } from '@/services/api';
import { setAccessToken } from '@/services/api/client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, login: storeLogin, logout: storeLogout } = useAuthStore();

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
        storeLogout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated, setUser, setLoading, storeLogout]);

  const login = useCallback(
    async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await authApi.login(data);
      setAccessToken(response.accessToken);
      storeLogin(response.user, response.accessToken, response.refreshToken);
      return response;
    },
    [storeLogin]
  );

  const loginWithPhone = useCallback(
    async (phone: string, code: string): Promise<AuthResponse> => {
      const response = await authApi.verifyPhoneLogin(phone, code);
      setAccessToken(response.accessToken);
      storeLogin(response.user, response.accessToken, response.refreshToken);
      return response;
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await authApi.register(data);
      setAccessToken(response.accessToken);
      storeLogin(response.user, response.accessToken, response.refreshToken);
      return response;
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? sessionStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore logout errors
    } finally {
      setAccessToken(null);
      storeLogout();
    }
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithPhone,
    register,
    logout,
  };
}
