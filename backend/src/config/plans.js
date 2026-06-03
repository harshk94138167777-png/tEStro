/**
 * Plan limits for traffic / rate-testing APIs (requests per minute to tEStro backend).
 * Defaults sit in spec ranges: Free 20–50, Premium 100–1000.
 */
function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function intEnv(key, fallback) {
  const v = parseInt(process.env[key], 10);
  return Number.isFinite(v) ? v : fallback;
}

export function getTrafficApiRpm(role) {
  if (role === 'admin') {
    return clamp(intEnv('PLAN_ADMIN_TRAFFIC_API_RPM', 1000), 100, 1000);
  }
  if (role === 'premium') {
    return clamp(intEnv('PLAN_PREMIUM_TRAFFIC_API_RPM', 600), 100, 1000);
  }
  return clamp(intEnv('PLAN_FREE_TRAFFIC_API_RPM', 40), 20, 50);
}

/** Max requests in one safe load simulation run */
export function getLoadSimMaxTotal(role) {
  if (role === 'free') {
    return clamp(intEnv('PLAN_FREE_LOAD_TOTAL', 50), 20, 50);
  }
  return clamp(intEnv('PLAN_PREMIUM_LOAD_TOTAL', 1000), 100, 1000);
}

/** Max requests in one rate-limit batch (sequential probes) */
export function getRateBatchMax(role) {
  if (role === 'free') {
    return clamp(intEnv('PLAN_FREE_RATE_BATCH_MAX', 40), 20, 50);
  }
  return clamp(intEnv('PLAN_PREMIUM_RATE_BATCH_MAX', 600), 100, 1000);
}

export function getPlanLimitsPublic() {
  return {
    trafficApiRpm: {
      free: getTrafficApiRpm('free'),
      premium: getTrafficApiRpm('premium'),
      admin: getTrafficApiRpm('admin'),
    },
    loadSimMaxTotal: {
      free: getLoadSimMaxTotal('free'),
      premium: getLoadSimMaxTotal('premium'),
    },
    rateBatchMax: {
      free: getRateBatchMax('free'),
      premium: getRateBatchMax('premium'),
    },
  };
}
