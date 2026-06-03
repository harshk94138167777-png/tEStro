import { useMemo, useState } from 'react';

const URL_HISTORY_KEY = 'testro_recent_urls';
const MAX_URLS = 25;

function readHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(URL_HISTORY_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v.trim()) : [];
  } catch {
    return [];
  }
}

function normalizeUrl(url) {
  return String(url || '').trim();
}

export function useUrlHistory() {
  const [urls, setUrls] = useState(() => readHistory());

  const saveUrl = (url) => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    setUrls((current) => {
      const next = [normalized, ...current.filter((u) => u !== normalized)].slice(0, MAX_URLS);
      if (typeof window !== 'undefined') {
        localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  return useMemo(() => ({ urls, saveUrl }), [urls]);
}
