const express = require('express');
const { nextId } = require('../lib/sequence');
const { pick, withoutBlankStatus, idQuery, httpError } = require('../lib/crud');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');

const router = express.Router();

const EDITABLE = ['name', 'license', 'expiry', 'phone', 'status'];
const byId = (id) => idQuery(id, ['driverId']);

router.get('/api/drivers', async (req, res) => {
  res.json(await Driver.find().sort({ createdAt: -1 }));
});

router.get('/api/drivers/:id', async (req, res) => {
  const driver = await Driver.findOne(byId(req.params.id));
  if (!driver) throw httpError(404, 'Driver not found');
  return res.json(driver);
});

router.post('/api/drivers', async (req, res) => {
  const saved = await new Driver({ ...withoutBlankStatus(pick(req.body, EDITABLE)), driverId: await nextId('driver') }).save();
  res.status(201).json(saved);
});

router.put('/api/drivers/:id', async (req, res) => {
  // Only the listed fields can change: the body cannot rewrite driverId or _id.
  const updated = await Driver.findOneAndUpdate(byId(req.params.id), pick(req.body, EDITABLE), { new: true, runValidators: true });
  if (!updated) throw httpError(404, 'Driver not found');
  return res.json(updated);
});

router.delete('/api/drivers/:id', async (req, res) => {
  const deleted = await Driver.findOneAndDelete(byId(req.params.id));
  if (!deleted) throw httpError(404, 'Driver not found');
  // A bus must not keep pointing at a driver that no longer exists.
  const freed = await Bus.updateMany({ assignedDriver: deleted.driverId }, { assignedDriver: '' });
  return res.json({ message: 'Driver deleted successfully', id: req.params.id, unassignedBuses: freed.modifiedCount });
});

module.exports = router;
