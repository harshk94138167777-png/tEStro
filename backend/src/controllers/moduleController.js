import axios from 'axios';
import validator from 'validator';
import {
  analyzeSqlInjection,
  analyzeCommandInjection,
  analyzeXss,
  simulateCsrfEducation,
  simulateBruteForce,
  simulateCredentialStuffing,
  analyzePathTraversal,
  validateFilenameOnly,
  premiumRuleInsights,
  testSqlInjectionLive,
  testCommandInjectionLive,
  testXssLive,
  testBruteForceOnLiveTarget,
  testCsrfOnLiveTarget,
  testPathTraversalOnLiveTarget,
  testFileUploadOnLiveTarget,
} from '../utils/simulations.js';
import { assertLocalTarget } from '../utils/urlSafety.js';
import { saveTest, logAction } from '../services/testStore.js';
import { getLoadSimMaxTotal, getRateBatchMax } from '../config/plans.js';

function isPremiumOrAdmin(role) {
  return role === 'premium' || role === 'admin';
}

function isHttpUrl(url) {
  return validator.isURL(String(url || ''), {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  });
}

export function shouldUseLiveInjectionMode(body = {}) {
  const mode = String(body?.mode || body?.testMode || '').trim().toLowerCase();
  const liveFlag = body?.live === true || body?.live === 'true' || body?.live === 1;
  return mode === 'live' || liveFlag;
}

export function shouldUseLiveProbeMode(body = {}) {
  const mode = String(body?.mode || body?.probeMode || body?.testMode || '').trim().toLowerCase();
  const liveFlag = body?.live === true || body?.live === 'true' || body?.live === 1;
  return mode === 'live' || liveFlag;
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveUserLimit(role, requestedValue, baseLimit) {
  if (role === 'premium' || role === 'admin') {
    const parsed = parsePositiveInt(requestedValue, baseLimit);
    return parsed > 0 ? parsed : baseLimit;
  }
  return baseLimit;
}

async function persist(req, module, testType, inputSummary, result, premiumInsights) {
  await saveTest(req.userId, module, testType, inputSummary, result, result.riskLevel, premiumInsights);
  await logAction(req.userId, 'test_run', { module, testType }, req.ip);
}

export async function sqlInjection(req, res, next) {
  try {
    const { payload, url } = req.body || {};
    const useLive = shouldUseLiveInjectionMode(req.body || {});

    let result;
    if (useLive && url) {
      // Live testing mode (explicitly requested)
      assertLocalTarget(url, req.user?.role);
      result = await testSqlInjectionLive(url, payload || '');
    } else {
      // Pattern analysis mode (safe default)
      result = analyzeSqlInjection(payload);
    }

    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = premiumRuleInsights(result, 'injection');
    }
    await persist(req, 'injection', 'sql_injection', payload || url || '', result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function commandInjection(req, res, next) {
  try {
    const { payload, url } = req.body || {};
    const useLive = shouldUseLiveInjectionMode(req.body || {});

    let result;
    if (useLive && url) {
      // Live testing mode (explicitly requested)
      assertLocalTarget(url, req.user?.role);
      result = await testCommandInjectionLive(url, payload || '');
    } else {
      // Pattern analysis mode (safe default)
      result = analyzeCommandInjection(payload);
    }
    
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = premiumRuleInsights(result, 'injection');
    }
    await persist(req, 'injection', 'command_injection', payload || url || '', result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function xss(req, res, next) {
  try {
    const { payload, url } = req.body || {};
    
    let result;
    if (url) {
      // Live testing mode
      assertLocalTarget(url, req.user?.role);
      result = await testXssLive(url, payload || '');
    } else {
      // Pattern analysis mode
      result = analyzeXss(payload);
    }
    
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = premiumRuleInsights(result, 'cross_site');
    }
    await persist(req, 'cross_site', 'xss_injection', payload || url || '', result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function csrf(req, res, next) {
  try {
    const { url } = req.body || {};
    
    let result;
    if (url) {
      // Live testing mode
      assertLocalTarget(url, req.user?.role);
      result = await testCsrfOnLiveTarget(url);
    } else {
      // Education mode
      result = simulateCsrfEducation();
    }
    
    await persist(req, 'cross_site', 'csrf_test', url || '', result, null);
    res.json({ result, premiumInsights: null });
  } catch (e) {
    next(e);
  }
}

export async function bruteForce(req, res, next) {
  try {
    const { attempts, url, username, passwords, mode, live } = req.body || {};
    const useLive = shouldUseLiveProbeMode(req.body || {});
    
    let result;
    if (useLive && url && username) {
      assertLocalTarget(url, req.user?.role);
      result = await testBruteForceOnLiveTarget(url, username, passwords || []);
    } else {
      result = simulateBruteForce({ attempts });
    }
    
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = premiumRuleInsights(result, 'authentication');
    }
    await persist(req, 'authentication', 'brute_force', username || JSON.stringify(attempts || []), result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function credentialStuffing(req, res, next) {
  try {
    const { password, url, username } = req.body || {};
    const useLive = shouldUseLiveProbeMode(req.body || {});
    
    let result;
    if (useLive && url && username && password) {
      assertLocalTarget(url, req.user?.role);
      result = await testBruteForceOnLiveTarget(url, username, [password]);
    } else {
      result = simulateCredentialStuffing(password);
    }
    
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = premiumRuleInsights(result, 'authentication');
    }
    await persist(req, 'authentication', 'credential_stuffing', '[redacted]', result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

/**
 * Safe load simulation: bounded concurrent requests only to localhost targets.
 * Not a real DoS tool — hard caps per plan.
 */
export async function trafficSim(req, res, next) {
  try {
    const { url, concurrency = 2, totalRequests = 10, limit, mode, live } = req.body || {};
    const useLive = shouldUseLiveProbeMode(req.body || {});
    if (!url || !isHttpUrl(url)) {
      return res.status(400).json({ error: 'Valid http(s) URL is required, for example http://localhost:5000/api/health' });
    }
    assertLocalTarget(url, req.user?.role);

    const role = req.user.role;
    const maxConc = role === 'free' ? 2 : role === 'premium' ? 8 : 10;
    const maxTotal = getLoadSimMaxTotal(role);

    const requestedConcurrency = concurrency ?? limit ?? 2;
    const requestedTotal = totalRequests ?? limit ?? 10;
    const conc = resolveUserLimit(role, requestedConcurrency, maxConc);
    const total = resolveUserLimit(role, requestedTotal, maxTotal);

    const latencies = [];
    const errors = [];
    const attempts = [];
    const targetHost = new URL(url).hostname.toLowerCase();
    const localhostOnly = ['localhost', '127.0.0.1', '::1'].includes(targetHost);

    for (let offset = 0; offset < total; offset += conc) {
      const batch = Math.min(conc, total - offset);
      const tasks = [];
      for (let i = 0; i < batch; i++) {
        tasks.push(
          (async () => {
            const start = Date.now();
            try {
              const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
              const elapsed = Date.now() - start;
              latencies.push(elapsed);
              attempts.push({
                statusCode: response.status,
                elapsedMs: elapsed,
                ok: response.status >= 200 && response.status < 400,
              });
            } catch (e) {
              const elapsed = Date.now() - start;
              errors.push({ message: e.message, elapsedMs: elapsed });
              attempts.push({ statusCode: null, elapsedMs: elapsed, ok: false, error: e.message });
            }
          })()
        );
      }
      await Promise.all(tasks);
    }

    const result = {
      module: 'traffic',
      type: 'safe_load_simulation',
      live: true,
      simulated: false,
      localhostOnly,
      url,
      concurrency: conc,
      totalRequests: total,
      completed: latencies.length,
      failed: errors.length,
      attempts,
      errors,
      avgLatencyMs:
        latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null,
      riskLevel: errors.length > 0 ? 'medium' : 'info',
      message: 'Bounded live HTTP probes completed against an authorized target. Review status codes and latency; this is not a denial-of-service test.',
    };

    let premium = null;
    if (isPremiumOrAdmin(role)) {
      premium = {
        rules: [
          'Premium: compare p95 latency trends over time in Reports.',
          'If errors spike, reduce concurrency and inspect server logs.',
        ],
      };
    }
    await persist(req, 'traffic', 'safe_load_simulation', url, result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function apiProbe(req, res, next) {
  try {
    const { url, method = 'GET' } = req.body || {};
    if (!url || !isHttpUrl(url)) {
      return res.status(400).json({ error: 'Valid http(s) URL is required, for example http://localhost:5000/api/health' });
    }
    assertLocalTarget(url, req.user?.role);
    const m = String(method).toUpperCase();
    if (!['GET', 'HEAD'].includes(m)) {
      return res.status(400).json({ error: 'Only GET and HEAD are allowed for safety' });
    }
    const start = Date.now();
    const response = await axios.request({
      url,
      method: m,
      timeout: 8000,
      validateStatus: () => true,
      maxRedirects: 3,
    });
    const ms = Date.now() - start;
    const result = {
      module: 'api_rate',
      type: 'endpoint_probe',
      live: true,
      target: url,
      status: response.status,
      responseTimeMs: ms,
      headersSample: {
        'content-type': response.headers['content-type'],
        'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
      },
      riskLevel: response.status >= 500 ? 'medium' : 'info',
      message: 'Live GET/HEAD probe completed against an authorized target.',
    };
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = { rules: ['Track status and latency in Reports for regression detection.'] };
    }
    await persist(req, 'api_rate', 'endpoint_probe', `${m} ${url}`, result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function securityHeaders(req, res, next) {
  try {
    const { url } = req.body || {};
    if (!url || !isHttpUrl(url)) {
      return res.status(400).json({ error: 'Valid http(s) URL is required, for example http://localhost:5000/api/health' });
    }
    assertLocalTarget(url, req.user?.role);
    const response = await axios.get(url, { timeout: 8000, validateStatus: () => true, maxRedirects: 3 });
    const h = response.headers;
    const expected = [
      { key: 'content-security-policy', label: 'CSP' },
      { key: 'strict-transport-security', label: 'HSTS' },
      { key: 'x-frame-options', label: 'X-Frame-Options' },
      { key: 'x-content-type-options', label: 'X-Content-Type-Options' },
      { key: 'referrer-policy', label: 'Referrer-Policy' },
    ];
    const present = [];
    const missing = [];
    for (const e of expected) {
      if (h[e.key]) present.push({ ...e, value: String(h[e.key]).slice(0, 200) });
      else missing.push(e);
    }
    const result = {
      module: 'security_config',
      type: 'header_check',
      status: response.status,
      present,
      missing: missing.map((m) => m.label),
      riskLevel: missing.length >= 3 ? 'medium' : 'info',
      message: 'Header review against localhost response only.',
    };
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = { rules: ['Add CSP and HSTS before production; test with staging.'] };
    }
    await persist(req, 'security_config', 'header_check', url, result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function pathTraversal(req, res, next) {
  try {
    const { payload, url } = req.body || {};
    
    let result;
    if (url) {
      // Live testing mode
      assertLocalTarget(url, req.user?.role);
      result = await testPathTraversalOnLiveTarget(url, payload || '');
    } else {
      // Pattern analysis mode
      result = analyzePathTraversal(payload);
    }
    
    let premium = null;
    if (isPremiumOrAdmin(req.user.role)) {
      premium = premiumRuleInsights({ riskLevel: result.riskLevel }, 'file_path');
    }
    await persist(req, 'file_path', 'path_traversal', payload || url || '', result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

export async function fileValidate(req, res, next) {
  try {
    const { filename, url } = req.body || {};
    
    let result;
    if (url) {
      // Live testing mode
      assertLocalTarget(url, req.user?.role);
      result = await testFileUploadOnLiveTarget(url, filename || 'test');
    } else {
      // Pattern analysis mode
      result = validateFilenameOnly(filename);
    }
    
    await persist(req, 'file_path', 'file_validation', filename || url || '', result, null);
    res.json({ result, premiumInsights: null });
  } catch (e) {
    next(e);
  }
}

/**
 * Rate limiting tester: sequential GETs to localhost; aggregates status codes and latency.
 */
export async function rateLimitBatch(req, res, next) {
  try {
    const { url, count = 10, limit } = req.body || {};
    if (!url || !isHttpUrl(url)) {
      return res.status(400).json({ error: 'Valid http(s) URL is required, for example http://localhost:5000/api/health' });
    }
    assertLocalTarget(url, req.user?.role);

    const role = req.user.role;
    const maxN = getRateBatchMax(role);
    const requestedCount = count ?? limit ?? 10;
    const n = resolveUserLimit(role, requestedCount, maxN);

    const statusHistogram = {};
    const latencies = [];
    const rateLimitedIndices = [];

    for (let i = 0; i < n; i++) {
      const t0 = Date.now();
      try {
        const response = await axios.get(url, { timeout: 6000, validateStatus: () => true, maxRedirects: 2 });
        latencies.push(Date.now() - t0);
        const s = String(response.status);
        statusHistogram[s] = (statusHistogram[s] || 0) + 1;
        if (response.status === 429) rateLimitedIndices.push(i);
      } catch (e) {
        statusHistogram.network_error = (statusHistogram.network_error || 0) + 1;
      }
    }

    const avgMs =
      latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

    const result = {
      module: 'api_rate',
      type: 'rate_limit_batch',
      localhostOnly: true,
      url,
      requestedCount: n,
      statusHistogram,
      avgResponseTimeMs: avgMs,
      rateLimited429Count: rateLimitedIndices.length,
      message:
        'Sequential probes for education only. Localhost targets only. Throttling observed as HTTP 429 counts.',
      riskLevel: rateLimitedIndices.length > 0 ? 'medium' : 'info',
    };

    let premium = null;
    if (isPremiumOrAdmin(role)) {
      premium = {
        rules: [
          'Compare histograms over time; rising429s indicate stricter server-side limits.',
          'Tune client backoff when testing your own APIs.',
        ],
      };
    }
    await persist(req, 'api_rate', 'rate_limit_batch', `${n}× GET ${url}`, result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}

/**
 * MERN-stack placeholder "ML" intelligence — heuristic scoring only (no Python microservice).
 * Premium / Admin only.
 */
export async function mlIntelligence(req, res, next) {
  try {
    if (!isPremiumOrAdmin(req.user.role)) {
      return res.status(403).json({
        error: 'ML intelligence module requires Premium or Admin. Upgrade or contact an administrator.',
      });
    }

    const { targetDescription = '', samplePayloads = '' } = req.body || {};
    const payloadStr = Array.isArray(samplePayloads) ? samplePayloads.join('\n') : String(samplePayloads ?? '');
    const desc = String(targetDescription).slice(0, 2000);

    let score = 18;
    if (/(--)|;|\||\$\(/.test(payloadStr) || (payloadStr.includes("'") && /or|union|select/i.test(payloadStr))) {
      score += 22;
    }
    if (/<script|javascript:|onerror=/i.test(payloadStr)) score += 24;
    if (/\.\.\/|%2e%2e|\.\.\\/.test(payloadStr)) score += 16;
    if (/union\s+select|or\s+1\s*=\s*1/i.test(payloadStr)) score += 12;
    score = Math.min(98, score + Math.min(20, Math.floor(payloadStr.length / 400)));

    const result = {
      module: 'ml_intelligence',
      type: 'heuristic_vulnerability_prediction',
      modelVersion: 'mern-placeholder-heuristic-v1',
      predictedRiskScore: score,
      interpretation:
        score >= 72
          ? 'Elevated — prioritize strict input validation, output encoding, and WAF rules.'
          : score >= 42
            ? 'Moderate — review edge cases and add regression tests.'
            : 'Baseline — maintain standard secure SDLC checks.',
      suggestedTestSequence: [
        'security_config/header_check',
        'injection/sql_pattern_detection',
        'cross_site/xss_detection',
        'api_rate/endpoint_probe',
      ],
      payloadOptimizationHints: ['Try encoding variants', 'Boundary lengths', 'Header combinations'],
      disclaimer:
        'Heuristic placeholder running in Node.js — not a trained ML model. Human validation required. Authorized use only.',
      riskLevel: score >= 72 ? 'high' : score >= 42 ? 'medium' : 'low',
    };

    const premium = {
      rules: [
        'For production ML, integrate a vetted model behind the same auth and safety gates.',
        'Never point automated high-volume tests at systems without authorization.',
      ],
    };
    await persist(req, 'ml_intelligence', 'heuristic_vulnerability_prediction', desc.slice(0, 500), result, premium);
    res.json({ result, premiumInsights: premium });
  } catch (e) {
    next(e);
  }
}
