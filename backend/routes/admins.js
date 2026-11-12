const express = require('express');
const { hashPassword, verifyPassword } = require('../lib/auth');
const { pick, idQuery, fail } = require('../lib/crud');
const Admin = require('../models/Admin');

const router = express.Router();

// ADMIN ACCOUNTS (mounted behind the admin guard in index.js)
const adminView = (a) => ({ id: a._id, username: a.username, name: a.name, role: a.role, createdAt: a.createdAt });
const checkPassword = (p) => (String(p || '').length < 8 ? 'Password must be at least 8 characters.' : null);

router.get('/api/admins', async (req, res) => {
  try {
    const list = await Admin.find().sort({ createdAt: 1 });
    res.json(list.map(adminView));
  } catch (error) {
    fail(res, error, 500);
  }
});

router.post('/api/admins', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-30 letters, numbers, dots, dashes or underscores.' });
    const bad = checkPassword(req.body.password);
    if (bad) return res.status(400).json({ error: bad });
    const admin = await Admin.create({
      username,
      password: hashPassword(String(req.body.password)),
      name: String(req.body.name || '').trim() || 'Administrator',
      role: String(req.body.role || '').trim() || 'Admin',
    });
    return res.status(201).json(adminView(admin));
  } catch (error) {
    return fail(res, error);
  }
});

// Change your own password (needs the current one). Registered before /:id so "me" is not read as an id.
router.put('/api/admins/me/password', async (req, res) => {
  try {
    const me = await Admin.findById(req.user.sub);
    if (!me) return res.status(404).json({ error: 'Account not found' });
    if (!verifyPassword(String(req.body.currentPassword || ''), me.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
    const bad = checkPassword(req.body.newPassword);
    if (bad) return res.status(400).json({ error: bad });
    me.password = hashPassword(String(req.body.newPassword));
    await me.save();
    return res.json({ message: 'Password changed.' });
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/api/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findOne(idQuery(req.params.id, ['username']));
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    return res.json(adminView(admin));
  } catch (error) {
    return fail(res, error);
  }
});

// Name and role only. Passwords change through /me/password, or are reset here by supplying `password`.
router.put('/api/admins/:id', async (req, res) => {
  try {
    const data = pick(req.body, ['name', 'role']);
    if (req.body.password) {
      const bad = checkPassword(req.body.password);
      if (bad) return res.status(400).json({ error: bad });
      data.password = hashPassword(String(req.body.password));
    }
    const updated = await Admin.findOneAndUpdate(idQuery(req.params.id, ['username']), data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Admin not found' });
    return res.json(adminView(updated));
  } catch (error) {
    return fail(res, error);
  }
});

router.delete('/api/admins/:id', async (req, res) => {
  try {
    const target = await Admin.findOne(idQuery(req.params.id, ['username']));
    if (!target) return res.status(404).json({ error: 'Admin not found' });
    if (String(target._id) === String(req.user.sub)) return res.status(400).json({ error: 'You cannot delete the account you are signed in with.' });
    if ((await Admin.countDocuments()) <= 1) return res.status(400).json({ error: 'The last admin account cannot be deleted.' });
    await target.deleteOne();
    return res.json({ message: 'Admin deleted successfully', id: req.params.id });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
