const express = require('express');
const mongoose = require('mongoose');
const { getNextSequence } = require('../lib/sequence');
const Driver = require('../models/Driver');

const router = express.Router();

// DRIVER ROUTES
router.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/drivers', async (req, res) => {
  try {
    const { name, license, expiry, phone, status } = req.body;
    const seq = await getNextSequence('driver');
    const driverId = `DRV-${String(seq).padStart(3, '0')}`;

    const driver = new Driver({
      driverId,
      name,
      license,
      expiry,
      phone,
      status: status || 'Active',
    });
    const saved = await driver.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/api/drivers/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { driverId: req.params.id }] }
      : { driverId: req.params.id };

    const updated = await Driver.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Driver not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/api/drivers/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { driverId: req.params.id }] }
      : { driverId: req.params.id };

    const deleted = await Driver.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
