import { Router } from 'express';
import { requireAuth, loadUser } from '../middleware/auth.js';
import * as r from '../controllers/reportController.js';

const router = Router();
router.use(requireAuth, loadUser);
router.get('/', r.listTests);
router.get('/stats', r.stats);
router.get('/export/json', r.exportJson);
router.get('/export/pdf', r.exportPdf);

export default router;
