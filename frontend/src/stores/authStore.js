import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  // Never let a request hang forever; prevents the loading spinner from persisting
  // if the backend is unreachable or slow (e.g. stale accessToken + no backend).
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  // Guard against storage access throwing (e.g. private browsing) — never let a
  // blocked localStorage break API requests.
  try {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore storage errors
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = response.data.data.tokens;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, isAuthenticated: false, initialized: false,
      setUser: (user) => set({ user, isAuthenticated: !!user, initialized: true }),
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, tokens } = response.data.data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ user, isAuthenticated: true, initialized: true });
        return user;
      },
      register: async (data) => {
        const response = await api.post('/auth/register', data);
        const { user, tokens } = response.data.data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ user, isAuthenticated: true, initialized: true });
        return user;
      },
      logout: async () => {
        try { await api.post('/auth/logout'); } catch (e) {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, initialized: true });
      },
      updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      init: async () => {
        // Always mark initialization complete first so the loading spinner can
        // never persist — even if localStorage access or the /auth/me request
        // fails (private browsing, blocked storage, backend down, etc.).
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
          set({ user: response.data.data.user, isAuthenticated: true });
        } catch {
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          } catch {
            // ignore storage errors; already marked initialized
          }
        }
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) }
  )
);
