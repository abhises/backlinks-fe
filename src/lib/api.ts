import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url?.includes('/api/auth/login') ||
                          err.config?.url?.includes('/api/auth/register') ||
                          err.config?.url?.includes('/api/auth/google');

    if (err.response?.status === 401 && typeof window !== 'undefined' && !isAuthRequest) {
      localStorage.removeItem('bl_token');
      localStorage.removeItem('bl_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
