import { Router } from 'express';
import { requireAuth, loadUser } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import * as a from '../controllers/adminController.js';

const router = Router();
router.use(requireAuth, loadUser, requireRole('admin'));
router.get('/users', a.listUsers);
router.patch('/users/:id/role', a.setUserRole);

export default router;
