// Minimal auth: scrypt password hashes (Node built-in) and JWT bearer tokens with a role claim.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(String(password), salt, 32).toString('hex')}`;
}

function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

// Also accepts legacy plaintext values so existing records keep working; lib/accounts.js re-hashes them on success.
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!isHashed(stored)) return stored === password;
  const [, salt, hash] = stored.split('$');
  const test = crypto.scryptSync(String(password), salt, 32);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

const signToken = (claims, expiresIn = '12h') => jwt.sign(claims, env.JWT_SECRET, { expiresIn });

function readToken(token) {
  try { return jwt.verify(token, env.JWT_SECRET); } catch { return null; }
}

// What a driver token says: which bus this phone is, and the route it publishes to (null when none is assigned).
const driverClaims = (bus, route, driverName = null) => ({
  role: 'driver',
  busId: bus.busId,
  registration: bus.registration,
  routeId: route ? route.routeId : null,
  driverName,
});

const requireRole = (...roles) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const claims = header.startsWith('Bearer ') ? readToken(header.slice(7)) : null;
  if (!claims) return res.status(401).json({ error: 'Sign in required' });
  if (!roles.includes(claims.role)) return res.status(403).json({ error: 'Not allowed for this account' });
  req.user = claims;
  return next();
};

module.exports = { hashPassword, verifyPassword, isHashed, signToken, readToken, driverClaims, requireRole };
