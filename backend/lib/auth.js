// Minimal auth: scrypt password hashes (Node built-in) and JWT bearer tokens with a role claim.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) console.warn('[auth] JWT_SECRET not set: using an insecure development secret.');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(String(password), salt, 32).toString('hex')}`;
}

function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

// Also accepts legacy plaintext values so existing records keep working; callers re-hash on success.
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!isHashed(stored)) return stored === password;
  const [, salt, hash] = stored.split('$');
  const test = crypto.scryptSync(String(password), salt, 32);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

const signToken = (claims, expiresIn = '12h') => jwt.sign(claims, SECRET, { expiresIn });

function readToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

// Express middleware: requireRole('admin') etc.
const requireRole = (...roles) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const claims = header.startsWith('Bearer ') ? readToken(header.slice(7)) : null;
  if (!claims) return res.status(401).json({ error: 'Sign in required' });
  if (!roles.includes(claims.role)) return res.status(403).json({ error: 'Not allowed for this account' });
  req.user = claims;
  return next();
};

module.exports = { hashPassword, verifyPassword, isHashed, signToken, readToken, requireRole };
