import axios from 'axios';

const TOKEN_KEY = 'testro_token';

const resolvedBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '');
const api = axios.create({
  baseURL: resolvedBase,
  headers: { 'Content-Type': 'application/json' },
});

const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
if (existing) {
  api.defaults.headers.common.Authorization = `Bearer ${existing}`;
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
