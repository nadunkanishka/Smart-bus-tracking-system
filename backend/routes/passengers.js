// Passenger accounts. Who may call which endpoint is in middleware/access.js.
const express = require('express');
const authLimiter = require('../middleware/authLimiter');
const { hashPassword, verifyPassword } = require('../lib/auth');
const { usernameError, passwordError, signIn, issueToken } = require('../lib/accounts');
const { idQuery, httpError } = require('../lib/crud');
const Passenger = require('../models/Passenger');

const router = express.Router();

const passengerView = (p) => ({ id: p._id, username: p.username, name: p.name, phone: p.phone });
const session = (p) => ({ token: issueToken('passenger', { sub: String(p._id) }), user: passengerView(p) });

router.post('/api/passengers/register', authLimiter, async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const name = String(req.body.name || '').trim();
  const bad = usernameError('passenger', username) || passwordError('passenger', password);
  if (bad) return res.status(400).json({ error: bad });
  if (!name) return res.status(400).json({ error: 'Full name is required.' });
  if (await Passenger.exists({ username })) return res.status(409).json({ error: 'That username is already taken.' });

  const passenger = await Passenger.create({ username, password: hashPassword(password), name, phone: String(req.body.phone || '').trim() });
  return res.status(201).json(session(passenger));
});

router.post('/api/passengers/login', authLimiter, async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
  const passenger = await Passenger.findOne({ username });
  if (!(await signIn(passenger, password))) return res.status(401).json({ error: 'Invalid username or password.' });
  return res.json(session(passenger));
});

// The signed-in passenger manages their own account.
async function loadMe(req) {
  const me = await Passenger.findById(req.user.sub);
  if (!me) throw httpError(404, 'Account not found');
  return me;
}

router.get('/api/passengers/me', async (req, res) => {
  res.json({ user: passengerView(await loadMe(req)) });
});

router.put('/api/passengers/me', async (req, res) => {
  const me = await loadMe(req);
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) return res.status(400).json({ error: 'Full name is required.' });
    me.name = name;
  }
  if (req.body.phone !== undefined) me.phone = String(req.body.phone).trim();
  await me.save();
  return res.json({ user: passengerView(me) });
});

router.put('/api/passengers/me/password', authLimiter, async (req, res) => {
  const me = await loadMe(req);
  if (!verifyPassword(String(req.body.currentPassword || ''), me.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
  const next = String(req.body.newPassword || '');
  const bad = passwordError('passenger', next);
  if (bad) return res.status(400).json({ error: bad });
  me.password = hashPassword(next);
  await me.save();
  return res.json({ message: 'Password changed.' });
});

// Deleting the account needs the password again, so a stolen token alone cannot erase it.
router.delete('/api/passengers/me', authLimiter, async (req, res) => {
  const me = await loadMe(req);
  if (!verifyPassword(String(req.body?.password || ''), me.password)) return res.status(401).json({ error: 'Password is incorrect.' });
  await me.deleteOne();
  return res.json({ message: 'Account deleted.' });
});

// Admin: list and remove passenger accounts.
router.get('/api/passengers', async (req, res) => {
  const list = await Passenger.find().sort({ createdAt: -1 });
  res.json(list.map((p) => ({ ...passengerView(p), createdAt: p.createdAt })));
});

router.delete('/api/passengers/:id', async (req, res) => {
  const deleted = await Passenger.findOneAndDelete(idQuery(req.params.id, ['username']));
  if (!deleted) return res.status(404).json({ error: 'Passenger not found' });
  return res.json({ message: 'Passenger deleted successfully', id: req.params.id });
});

module.exports = router;
