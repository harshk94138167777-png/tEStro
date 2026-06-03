import { useLocation } from 'react-router-dom';

/**
 * Multi-tool routes: return which section id matches `location.hash` (e.g. `#sql`).
 * If hash is missing or unknown, returns `fallbackId`.
 */
export function useModuleSection(fallbackId, allowedIds) {
  const { hash } = useLocation();
  const id = hash.replace(/^#/, '').trim();
  if (id && allowedIds.includes(id)) return id;
  return fallbackId;
}
