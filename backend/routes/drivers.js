const express = require('express');
const { getNextSequence } = require('../lib/sequence');
const { pick, idQuery, fail } = require('../lib/crud');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');

const router = express.Router();

// DRIVER ROUTES
const EDITABLE = ['name', 'license', 'expiry', 'phone', 'status'];
const byId = (id) => idQuery(id, ['driverId']);

router.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    fail(res, error, 500);
  }
});

router.get('/api/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findOne(byId(req.params.id));
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    return res.json(driver);
  } catch (error) {
    return fail(res, error);
  }
});

router.post('/api/drivers', async (req, res) => {
  try {
    const seq = await getNextSequence('driver');
    const driverId = `DRV-${String(seq).padStart(3, '0')}`;
    const saved = await new Driver({ ...pick(req.body, EDITABLE), driverId, status: req.body.status || 'Active' }).save();
    res.status(201).json(saved);
  } catch (error) {
    fail(res, error);
  }
});

router.put('/api/drivers/:id', async (req, res) => {
  try {
    // Only the listed fields can change: the body cannot rewrite driverId or _id.
    const updated = await Driver.findOneAndUpdate(byId(req.params.id), pick(req.body, EDITABLE), { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Driver not found' });
    return res.json(updated);
  } catch (error) {
    return fail(res, error);
  }
});

router.delete('/api/drivers/:id', async (req, res) => {
  try {
    const deleted = await Driver.findOneAndDelete(byId(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Driver not found' });
    // A bus must not keep pointing at a driver that no longer exists.
    const freed = await Bus.updateMany({ assignedDriver: deleted.driverId }, { assignedDriver: '' });
    return res.json({ message: 'Driver deleted successfully', id: req.params.id, unassignedBuses: freed.modifiedCount });
  } catch (error) {
    return fail(res, error, 500);
  }
});

module.exports = router;
