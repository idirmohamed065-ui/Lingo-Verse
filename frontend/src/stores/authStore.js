import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Production must never fall back to localhost.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://lingoverse-backend.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage errors
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never try to refresh when the refresh endpoint itself returns 401.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await api.post('/auth/refresh', {
          refreshToken,
        });

        const { accessToken } = response.data.data.tokens;

        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export { api };

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          initialized: true,
        }),

      login: async (email, password) => {
        const response = await api.post('/auth/login', {
          email,
          password,
        });

        const { user, tokens } = response.data.data;

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        set({
          user,
          isAuthenticated: true,
          initialized: true,
        });

        return user;
      },

      register: async (data) => {
        const response = await api.post('/auth/register', data);

        const { user, tokens } = response.data.data;

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        set({
          user,
          isAuthenticated: true,
          initialized: true,
        });

        return user;
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore logout API errors
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        set({
          user: null,
          isAuthenticated: false,
          initialized: true,
        });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...updates }
            : null,
        })),

      init: async () => {
        // Mark initialization complete immediately.
        set({ initialized: true });

        let token = null;

        try {
          token = localStorage.getItem('accessToken');
        } catch {
          token = null;
        }

        if (!token) return;

        try {
          const response = await api.get('/auth/me');

          set({
            user: response.data.data.user,
            isAuthenticated: true,
          });
        } catch {
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          } catch {
            // Ignore storage errors
          }

          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);