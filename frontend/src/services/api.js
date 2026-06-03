import axios from 'axios';

const TOKEN_KEY = 'testro_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
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
