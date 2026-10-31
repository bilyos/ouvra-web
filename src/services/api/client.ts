import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';

const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    sessionStorage.setItem('accessToken', token);
  } else {
    sessionStorage.removeItem('accessToken');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken');
    if (localStorage.getItem('accessToken')) {
      sessionStorage.setItem('accessToken', accessToken!);
      localStorage.removeItem('accessToken');
    }
  }
  return accessToken;
}

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !('_retry' in original)) {
      Object.assign(original, { _retry: true });

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = sessionStorage.getItem('refreshToken') ?? localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${config.apiUrl}/api/auth/refresh`, { refreshToken });
        setAccessToken(data.accessToken);
        sessionStorage.setItem('refreshToken', data.refreshToken);
        localStorage.removeItem('refreshToken');

        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        sessionStorage.removeItem('refreshToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export { api };
