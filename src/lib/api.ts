import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Send cookies with every request automatically
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url?.includes('/api/auth/login') ||
                          err.config?.url?.includes('/api/auth/register') ||
                          err.config?.url?.includes('/api/auth/google') ||
                          err.config?.url?.includes('/api/auth/me');

    if (err.response?.status === 401 && typeof window !== 'undefined' && !isAuthRequest) {
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
