import { TestResult } from '../models/TestResult.js';
import { AuditLog } from '../models/AuditLog.js';

const ALLOWED_RISK_LEVELS = new Set(['info', 'low', 'medium', 'high', 'critical']);

function normalizeRiskLevel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ALLOWED_RISK_LEVELS.has(normalized) ? normalized : 'info';
}

export async function saveTest(userId, module, testType, inputSummary, result, riskLevel, premiumInsights) {
  const doc = await TestResult.create({
    userId,
    module,
    testType,
    inputSummary: String(inputSummary ?? '').slice(0, 2000),
    result,
    riskLevel: normalizeRiskLevel(riskLevel || result?.riskLevel),
    premiumInsights: premiumInsights || null,
  });
  return doc;
}

export async function logAction(userId, action, details, ip) {
  await AuditLog.create({
    userId,
    action,
    details: details || {},
    ip: ip || '',
  });
}
