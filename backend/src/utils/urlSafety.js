import { URL } from 'url';

/**
 * Only localhost / loopback targets are allowed for real HTTP from the server.
 * Prevents SSRF and abuse against third-party systems.
 * Can be made more permissive for trusted admin/premium users via env vars.
 */
function envTrue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function normalizeAllowlist(rawValue) {
  const list = String(rawValue || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set(list);
}

export function isLiveTestingEnabled() {
  return envTrue(process.env.ALLOW_LIVE_TESTING);
}

export function isUrlInAllowlist(rawUrl, allowlist = []) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  let u;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  const allowedHosts = normalizeAllowlist(allowlist?.join ? allowlist.join(',') : allowlist);
  const exactHost = host.replace(/^www\./, '');
  if (allowedHosts.has(exactHost)) return true;
  return Array.from(allowedHosts).some((entry) => entry.startsWith('*.') && host.endsWith(entry.slice(1)));
}

export function isAllowedLocalTarget(rawUrl, role = 'free') {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  let u;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;

  const host = u.hostname.toLowerCase();
  const isLocalhost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1';
  if (isLocalhost) return true;

  const isPrivileged = role === 'admin' || role === 'premium';
  if (!isPrivileged) return false;

  if (isLiveTestingEnabled()) {
    return true;
  }

  const allowedHosts = normalizeAllowlist(process.env.ALLOWED_LIVE_TARGETS || '');
  const exactHost = host.replace(/^www\./, '');
  return allowedHosts.has(exactHost) || Array.from(allowedHosts).some((entry) => entry.startsWith('*.') && host.endsWith(entry.slice(1)));
}

export function assertLocalTarget(url, role = 'free') {
  if (!isAllowedLocalTarget(url, role)) {
    const err = new Error(
      'For safety, only localhost targets are permitted for free users. Admin and premium users may use explicitly approved live targets via ALLOWED_LIVE_TARGETS or ALLOW_LIVE_TESTING=true.'
    );
    err.statusCode = 400;
    throw err;
  }
}
