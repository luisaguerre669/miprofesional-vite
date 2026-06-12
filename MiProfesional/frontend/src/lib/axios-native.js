import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const isNativeApp = Capacitor.isNativePlatform();

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

async function nativeRequest(config) {
  const { Http } = await import('@capacitor-community/http');
  const url = config.url?.startsWith('http') ? config.url : `${API_URL.replace(/\/$/, '')}${config.url}`;

  try {
    const response = await Http.request({
      url,
      method: (config.method || 'GET').toUpperCase(),
      headers: config.headers,
      params: config.params,
      data: config.data,
      responseType: 'json',
      timeout: config.timeout || 60000,
    });

    if (response.status === 401) {
      window.location.href = '/login';
      throw { response: { status: 401 }, message: 'Unauthorized' };
    }

    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
      config,
      statusText: response.statusText || '',
    };
  } catch (error) {
    if (error?.response?.status === 401) {
      window.location.href = '/login';
    }
    throw error;
  }
}

const api = {
  ...axiosInstance,
  request: async function (config) {
    if (isNativeApp) {
      return nativeRequest(config);
    }
    return axiosInstance.request(config);
  },
  get: async function (url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  },
  post: async function (url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  },
  put: async function (url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  },
  delete: async function (url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  },
  patch: async function (url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data });
  },
  interceptors: axiosInstance.interceptors,
  defaults: axiosInstance.defaults,
};

export default api;
