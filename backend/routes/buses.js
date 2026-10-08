const express = require('express');
const mongoose = require('mongoose');
const { hashPassword } = require('../lib/auth');
const { getNextSequence } = require('../lib/sequence');
const Bus = require('../models/Bus');

const router = express.Router();

// BUS ROUTES
// The bus password is write-only: responses carry hasPassword instead of the value.
const busView = (bus) => {
  const { password, ...rest } = bus.toObject ? bus.toObject() : bus;
  return { ...rest, hasPassword: !!password };
};

router.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.json(buses.map(busView));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/buses', async (req, res) => {
  try {
    const { registration, capacity, mileage, password, status, assignedDriver } = req.body;
    const seq = await getNextSequence('bus');
    const busId = `BUS-${String(seq).padStart(3, '0')}`;

    const bus = new Bus({
      busId,
      registration,
      capacity: Number(capacity),
      mileage: Number(mileage),
      password: password ? hashPassword(String(password)) : '',
      assignedDriver: assignedDriver || '',
      status: status || 'Active',
    });
    const saved = await bus.save();
    res.status(201).json(busView(saved));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/api/buses/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.capacity) data.capacity = Number(data.capacity);
    if (data.mileage) data.mileage = Number(data.mileage);
    if (data.password) data.password = hashPassword(String(data.password));
    else delete data.password; // blank = keep the current password
    delete data.hasPassword;

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { busId: req.params.id }] }
      : { busId: req.params.id };

    const updated = await Bus.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Bus not found' });
    res.json(busView(updated));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/api/buses/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    let query;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      query = { $or: [{ _id: idParam }, { busId: idParam }, { registration: idParam }] };
    } else {
      query = { $or: [{ busId: idParam }, { registration: idParam }] };
    }

    const deleted = await Bus.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ error: 'Bus not found' });
    res.json({ message: 'Bus deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
