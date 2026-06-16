import axios from 'axios';

let _initialized = false;

export const __setInitialized = (val) => { _initialized = val; };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || error.config?.baseURL || '(unknown)';
      const method = error.config?.method || 'GET';
      console.log(`[AXIOS] 401 on ${method} ${url} — removing token`);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (_initialized) {
        console.log(`[AXIOS] 401 post-init (${method} ${url}) — dispatching auth:force-logout`);
        window.dispatchEvent(new CustomEvent('auth:force-logout', { detail: { url, method } }));
      } else {
        console.warn(`[AXIOS] 401 durante inicialización (${method} ${url}) — se difiere a AuthContext`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
