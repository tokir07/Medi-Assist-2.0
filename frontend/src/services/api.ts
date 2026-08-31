import axios from 'axios';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transparent Request Deduplication & In-Memory SWR Cache (15s TTL for GET queries)
const getCache = new Map<string, { data: any; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 15000;

export const cachedGet = async <T>(url: string, config?: any): Promise<{ data: T }> => {
  const cacheKey = url;
  const now = Date.now();

  const cached = getCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data };
  }

  if (inFlightRequests.has(cacheKey)) {
    const data = await inFlightRequests.get(cacheKey);
    return { data };
  }

  const promise = api.get<T>(url, config).then((res) => {
    getCache.set(cacheKey, { data: res.data, timestamp: Date.now() });
    inFlightRequests.delete(cacheKey);
    return res.data;
  }).catch((err) => {
    inFlightRequests.delete(cacheKey);
    throw err;
  });

  inFlightRequests.set(cacheKey, promise);
  const data = await promise;
  return { data };
};

export const clearApiCache = () => {
  getCache.clear();
  inFlightRequests.clear();
};

// Request Interceptor: Attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediassist_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 & 403 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const currentPath = window.location.pathname;

      if (status === 401 && currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
        localStorage.removeItem('mediassist_token');
        localStorage.removeItem('mediassist_user');
        window.location.href = '/login?expired=true';
      } else if (status === 403 && currentPath !== '/access-denied') {
        window.location.href = '/access-denied';
      }
    }
    return Promise.reject(error);
  }
);
