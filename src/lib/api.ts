// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('sb-session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    } catch {}
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sb-session');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
