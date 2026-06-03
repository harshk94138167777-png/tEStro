import { User } from '../models/User.js';
import { logAction } from '../services/testStore.js';

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function setUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!['free', 'premium', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    target.role = role;
    await target.save();
    await logAction(req.userId, 'admin_set_role', { targetId: id, role }, req.ip);
    res.json({ user: target.toSafeObject() });
  } catch (e) {
    next(e);
  }
}

export async function listUsers(req, res, next) {
  try {
       const q = req.query.search ? escapeRegex(String(req.query.search)) : '';
    const filter = q ? { email: new RegExp(q, 'i') } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}
