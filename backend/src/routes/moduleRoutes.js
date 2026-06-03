import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, loadUser } from '../middleware/auth.js';
import { getTrafficApiRpm } from '../config/plans.js';
import * as m from '../controllers/moduleController.js';

const router = Router();

router.use(requireAuth, loadUser);

const trafficApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => getTrafficApiRpm(req.user?.role || 'free'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Traffic / rate-testing API limit exceeded for your plan (per minute).' },
});

router.post('/injection/sql', m.sqlInjection);
router.post('/injection/command', m.commandInjection);
router.post('/cross-site/xss', m.xss);
router.post('/cross-site/csrf', m.csrf);
router.post('/auth/brute-force', m.bruteForce);
router.post('/auth/credential-stuffing', m.credentialStuffing);
router.post('/traffic/simulate', trafficApiLimiter, m.trafficSim);
router.post('/api/probe', trafficApiLimiter, m.apiProbe);
router.post('/api/rate-test', trafficApiLimiter, m.rateLimitBatch);
router.post('/security/headers', trafficApiLimiter, m.securityHeaders);
router.post('/file/path-traversal', m.pathTraversal);
router.post('/file/validate-name', m.fileValidate);
router.post('/ml/analyze', m.mlIntelligence);

export default router;
