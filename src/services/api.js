import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch (_) {
    localStorage.removeItem('user');
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const status = err.response?.status;
    const method = err.config?.method?.toUpperCase() || 'GET';
    const serverMsg = err.response?.data?.message;

    if (serverMsg) {
      err.message = `${serverMsg} (${method} ${url} -> ${status})`;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error(`[API Error ${status || 'Network'}] ${method} ${url}:`, err.response?.data || err.message);
    }

    // Only redirect to login on 401 for authenticated routes,
    // NOT for the login/register endpoints themselves.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
