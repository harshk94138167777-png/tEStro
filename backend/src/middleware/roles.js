export function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.userRole || req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this plan or role' });
    }
    next();
  };
}
