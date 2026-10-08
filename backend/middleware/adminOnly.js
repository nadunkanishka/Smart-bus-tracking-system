const { requireRole } = require('../lib/auth');

const adminOnly = requireRole('admin');

// Reading is public (passengers need the route list and geometry); every other method is admin-only.
const adminWrites = (req, res, next) => (req.method === 'GET' ? next() : adminOnly(req, res, next));

module.exports = { adminOnly, adminWrites };
