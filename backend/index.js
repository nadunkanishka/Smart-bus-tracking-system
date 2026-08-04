const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const Driver = require('./models/Driver');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Counter = require('./models/Counter');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Helper for auto-increment counter starting from 1
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Bus Tracking API is running' });
});

// DRIVER ROUTES
app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drivers', async (req, res) => {
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

app.put('/api/drivers/:id', async (req, res) => {
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

app.delete('/api/drivers/:id', async (req, res) => {
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

// BUS ROUTES
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/buses', async (req, res) => {
  try {
    const { registration, capacity, mileage, status } = req.body;
    const seq = await getNextSequence('bus');
    const busId = `BUS-${String(seq).padStart(3, '0')}`;

    const bus = new Bus({
      busId,
      registration,
      capacity: Number(capacity),
      mileage: Number(mileage),
      status: status || 'Active',
    });
    const saved = await bus.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/buses/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.capacity) data.capacity = Number(data.capacity);
    if (data.mileage) data.mileage = Number(data.mileage);

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { busId: req.params.id }] }
      : { busId: req.params.id };

    const updated = await Bus.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Bus not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/buses/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { busId: req.params.id }] }
      : { busId: req.params.id };

    const deleted = await Bus.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ error: 'Bus not found' });
    res.json({ message: 'Bus deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE ROUTES
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routes', async (req, res) => {
  try {
    const { name, start, end, distance, stops, status } = req.body;
    const seq = await getNextSequence('route');
    const routeId = `RT-${String(seq).padStart(3, '0')}`;

    const route = new Route({
      routeId,
      name,
      start,
      end,
      distance: Number(distance),
      stops: Array.isArray(stops) ? stops : [],
      status: status || 'Active',
    });
    const saved = await route.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/routes/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.distance) data.distance = Number(data.distance);
    if (data.stops && !Array.isArray(data.stops)) {
      data.stops = [];
    }

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { routeId: req.params.id }] }
      : { routeId: req.params.id };

    const updated = await Route.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Route not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/routes/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { routeId: req.params.id }] }
      : { routeId: req.params.id };

    const deleted = await Route.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
