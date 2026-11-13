const express = require('express');
const authLimiter = require('../middleware/authLimiter');
const { hashPassword, verifyPassword, signToken, requireRole } = require('../lib/auth');
const { idQuery, fail } = require('../lib/crud');
const Passenger = require('../models/Passenger');

const router = express.Router();

const passengerView = (p) => ({ id: p._id, username: p.username, name: p.name, phone: p.phone });

router.post('/api/passengers/register', authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-30 letters, numbers, dots or underscores.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (!name) return res.status(400).json({ error: 'Full name is required.' });
    if (await Passenger.exists({ username })) return res.status(409).json({ error: 'That username is already taken.' });

    const passenger = await Passenger.create({ username, password: hashPassword(password), name, phone: String(req.body.phone || '').trim() });
    return res.status(201).json({ token: signToken({ role: 'passenger', sub: String(passenger._id) }, '30d'), user: passengerView(passenger) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/api/passengers/login', authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    const passenger = await Passenger.findOne({ username });
    if (!passenger || !verifyPassword(password, passenger.password)) return res.status(401).json({ error: 'Invalid username or password.' });
    return res.json({ token: signToken({ role: 'passenger', sub: String(passenger._id) }, '30d'), user: passengerView(passenger) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── The signed-in passenger manages their own account ───────────────────────
const ownAccount = requireRole('passenger');
const loadMe = async (req, res) => {
  const me = await Passenger.findById(req.user.sub);
  if (!me) res.status(404).json({ error: 'Account not found' });
  return me;
};

router.get('/api/passengers/me', ownAccount, async (req, res) => {
  try {
    const me = await loadMe(req, res);
    if (me) res.json({ user: passengerView(me) });
  } catch (error) {
    fail(res, error, 500);
  }
});

router.put('/api/passengers/me', ownAccount, async (req, res) => {
  try {
    const me = await loadMe(req, res);
    if (!me) return undefined;
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: 'Full name is required.' });
      me.name = name;
    }
    if (req.body.phone !== undefined) me.phone = String(req.body.phone).trim();
    await me.save();
    return res.json({ user: passengerView(me) });
  } catch (error) {
    return fail(res, error);
  }
});

router.put('/api/passengers/me/password', authLimiter, ownAccount, async (req, res) => {
  try {
    const me = await loadMe(req, res);
    if (!me) return undefined;
    if (!verifyPassword(String(req.body.currentPassword || ''), me.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
    const next = String(req.body.newPassword || '');
    if (next.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    me.password = hashPassword(next);
    await me.save();
    return res.json({ message: 'Password changed.' });
  } catch (error) {
    return fail(res, error);
  }
});

// Deleting the account needs the password again, so a stolen token alone cannot erase it.
router.delete('/api/passengers/me', authLimiter, ownAccount, async (req, res) => {
  try {
    const me = await loadMe(req, res);
    if (!me) return undefined;
    if (!verifyPassword(String(req.body?.password || ''), me.password)) return res.status(401).json({ error: 'Password is incorrect.' });
    await me.deleteOne();
    return res.json({ message: 'Account deleted.' });
  } catch (error) {
    return fail(res, error, 500);
  }
});

// ── Admin: list and remove passenger accounts ───────────────────────────────
router.get('/api/passengers', requireRole('admin'), async (req, res) => {
  try {
    const list = await Passenger.find().sort({ createdAt: -1 });
    res.json(list.map((p) => ({ ...passengerView(p), createdAt: p.createdAt })));
  } catch (error) {
    fail(res, error, 500);
  }
});

router.delete('/api/passengers/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Passenger.findOneAndDelete(idQuery(req.params.id, ['username']));
    if (!deleted) return res.status(404).json({ error: 'Passenger not found' });
    return res.json({ message: 'Passenger deleted successfully', id: req.params.id });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
