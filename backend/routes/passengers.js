const express = require('express');
const authLimiter = require('../middleware/authLimiter');
const { hashPassword, verifyPassword, signToken } = require('../lib/auth');
const Passenger = require('../models/Passenger');

const router = express.Router();

// PASSENGER ACCOUNTS
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

module.exports = router;
