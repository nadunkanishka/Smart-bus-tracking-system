// Who may call what: the one table of role guards for the REST API. index.js mounts it before every route file.
// The first matching row decides: its role is required (or, for `reads: 'public'`, only writes need it) and the
// rest of the table is skipped. Paths not listed are public (health, sign-in, registration, the route list).
// Matching is Express's own (case-insensitive, trailing slash allowed), the same as for the route files.
const express = require('express');
const { requireRole } = require('../lib/auth');

const ACCESS = [
  // The signed-in passenger's own account. Listed before the admin row below, which would otherwise match "me" as an id.
  { method: 'all', paths: ['/api/passengers/me', '/api/passengers/me/*rest'], role: 'passenger' },
  { method: 'get', paths: ['/api/passengers'], role: 'admin' },
  { method: 'delete', paths: ['/api/passengers/:id'], role: 'admin' },
  { method: 'use', paths: ['/api/dashboard', '/api/drivers', '/api/buses', '/api/live', '/api/metrics', '/api/analytics', '/api/admins'], role: 'admin' },
  // Passengers read the route list and geometry; changing routes is admin-only.
  { method: 'use', paths: ['/api/routes'], role: 'admin', reads: 'public' },
];

const leave = (req, res, next) => next('router'); // skip the rest of the table, go on to the route files

function accessGuard(table = ACCESS) {
  const router = express.Router();
  for (const row of table) {
    const guard = requireRole(row.role);
    const check = row.reads === 'public' ? (req, res, next) => (req.method === 'GET' ? leave(req, res, next) : guard(req, res, next)) : guard;
    router[row.method](row.paths, check, leave);
  }
  return router;
}

module.exports = { ACCESS, accessGuard };
