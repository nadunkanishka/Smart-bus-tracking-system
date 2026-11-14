// Admin accounts (admin-only, see middleware/access.js).
const express = require('express');
const { hashPassword, verifyPassword } = require('../lib/auth');
const { usernameError, passwordError } = require('../lib/accounts');
const { pick, idQuery } = require('../lib/crud');
const Admin = require('../models/Admin');

const router = express.Router();

const adminView = (a) => ({ id: a._id, username: a.username, name: a.name, role: a.role, createdAt: a.createdAt });
const byId = (id) => idQuery(id, ['username']);

router.get('/api/admins', async (req, res) => {
  const list = await Admin.find().sort({ createdAt: 1 });
  res.json(list.map(adminView));
});

router.post('/api/admins', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const bad = usernameError('admin', username) || passwordError('admin', req.body.password);
  if (bad) return res.status(400).json({ error: bad });
  const admin = await Admin.create({
    username,
    password: hashPassword(String(req.body.password)),
    name: String(req.body.name || '').trim() || 'Administrator',
    role: String(req.body.role || '').trim() || 'Admin',
  });
  return res.status(201).json(adminView(admin));
});

// Change your own password (needs the current one). Registered before /:id so "me" is not read as an id.
router.put('/api/admins/me/password', async (req, res) => {
  const me = await Admin.findById(req.user.sub);
  if (!me) return res.status(404).json({ error: 'Account not found' });
  if (!verifyPassword(String(req.body.currentPassword || ''), me.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
  const bad = passwordError('admin', req.body.newPassword);
  if (bad) return res.status(400).json({ error: bad });
  me.password = hashPassword(String(req.body.newPassword));
  await me.save();
  return res.json({ message: 'Password changed.' });
});

router.get('/api/admins/:id', async (req, res) => {
  const admin = await Admin.findOne(byId(req.params.id));
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  return res.json(adminView(admin));
});

// Name and role only. Passwords change through /me/password, or are reset here by supplying `password`.
router.put('/api/admins/:id', async (req, res) => {
  const data = pick(req.body, ['name', 'role']);
  if (req.body.password) {
    const bad = passwordError('admin', req.body.password);
    if (bad) return res.status(400).json({ error: bad });
    data.password = hashPassword(String(req.body.password));
  }
  const updated = await Admin.findOneAndUpdate(byId(req.params.id), data, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ error: 'Admin not found' });
  return res.json(adminView(updated));
});

router.delete('/api/admins/:id', async (req, res) => {
  const target = await Admin.findOne(byId(req.params.id));
  if (!target) return res.status(404).json({ error: 'Admin not found' });
  if (String(target._id) === String(req.user.sub)) return res.status(400).json({ error: 'You cannot delete the account you are signed in with.' });
  if ((await Admin.countDocuments()) <= 1) return res.status(400).json({ error: 'The last admin account cannot be deleted.' });
  await target.deleteOne();
  return res.json({ message: 'Admin deleted successfully', id: req.params.id });
});

module.exports = router;
