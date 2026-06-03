import { URL } from 'url';

/**
 * Only localhost / loopback targets are allowed for real HTTP from the server.
 * Prevents SSRF and abuse against third-party systems.
 * Can be disabled with ALLOW_LIVE_TESTING=true environment variable.
 */
function envTrue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

export function isLiveTestingEnabled() {
  return envTrue(process.env.ALLOW_LIVE_TESTING);
}

export function isAllowedLocalTarget(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  
  // Allow all URLs if ALLOW_LIVE_TESTING is enabled
  if (isLiveTestingEnabled()) {
    let u;
    try {
      u = new URL(rawUrl.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  let u;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1'
  );
}

export function assertLocalTarget(url) {
  if (!isAllowedLocalTarget(url)) {
    const err = new Error(
      'For safety, only http(s) URLs targeting localhost (127.0.0.1, ::1) are permitted for live checks. To test real API links, set ALLOW_LIVE_TESTING=true in backend/.env and restart backend.'
    );
    err.statusCode = 400;
    throw err;
  }
}
