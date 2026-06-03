import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, loadUser } from '../middleware/auth.js';
import { chat } from '../controllers/aiController.js';

const router = Router();
router.use(requireAuth, loadUser);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', aiLimiter, chat);

export default router;
