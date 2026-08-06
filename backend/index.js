const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const Driver = require('./models/Driver');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Counter = require('./models/Counter');
const Admin = require('./models/Admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB and seed default admin
connectDB().then(async (connected) => {
  if (connected) {
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        await Admin.create({
          username: 'admin',
          password: 'admin123',
          name: 'Super Admin',
          role: 'Super Admin',
        });
        console.log('Default admin account created: username: admin / password: admin123');
      }
    } catch (err) {
      console.error('Admin seeding error:', err.message);
    }
  }
});

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

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username, password });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DRIVER / BUS AUTH ROUTE (For Driver App Authentication)
app.post('/api/auth/driver-login', async (req, res) => {
  try {
    const { registration, busId, password } = req.body;
    if ((!registration && !busId) || !password) {
      return res.status(400).json({ error: 'Bus registration number and password are required.' });
    }

    const query = registration
      ? { registration: registration.trim() }
      : { busId: busId.trim() };

    const bus = await Bus.findOne(query);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found in database. Check registration no.' });
    }

    if (!bus.password || bus.password !== password) {
      return res.status(401).json({ error: 'Invalid password for this bus.' });
    }

    // Find assigned route in MongoDB for this bus
    // Matches if route.assignedBus includes registration or busId
    const assignedRoute = await Route.findOne({
      assignedBus: { $regex: bus.registration, $options: 'i' },
    }) || await Route.findOne({
      assignedBus: { $regex: bus.busId || 'BUS-', $options: 'i' },
    });

    res.json({
      message: 'Bus authentication successful',
      bus: {
        id: bus._id,
        busId: bus.busId,
        registration: bus.registration,
        capacity: bus.capacity,
        mileage: bus.mileage,
        status: bus.status,
      },
      assignedRoute: assignedRoute
        ? {
            routeId: assignedRoute.routeId,
            name: assignedRoute.name,
            start: assignedRoute.start,
            end: assignedRoute.end,
            distance: assignedRoute.distance,
            stops: assignedRoute.stops,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DASHBOARD SUMMARY ROUTE (Calculated live from real MongoDB data)
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const [driverCount, busCount, routeCount, activeBuses, idleBuses, maintenanceBuses] = await Promise.all([
      Driver.countDocuments({ status: 'Active' }),
      Bus.countDocuments(),
      Route.countDocuments({ status: 'Active' }),
      Bus.countDocuments({ status: 'Active' }),
      Bus.countDocuments({ status: 'Idle' }),
      Bus.countDocuments({ status: 'Maintenance' }),
    ]);

    res.json({
      activeRoutes: routeCount,
      registeredBuses: busCount,
      activeDrivers: driverCount,
      fleetDistribution: {
        active: activeBuses,
        idle: idleBuses,
        maintenance: maintenanceBuses,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    const { registration, capacity, mileage, password, status } = req.body;
    const seq = await getNextSequence('bus');
    const busId = `BUS-${String(seq).padStart(3, '0')}`;

    const bus = new Bus({
      busId,
      registration,
      capacity: Number(capacity),
      mileage: Number(mileage),
      password: password || '',
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
    const { name, start, end, distance, stops, assignedBus, status } = req.body;
    const seq = await getNextSequence('route');
    const routeId = `RT-${String(seq).padStart(3, '0')}`;

    const route = new Route({
      routeId,
      name,
      start,
      end,
      distance: Number(distance),
      stops: Array.isArray(stops) ? stops : [],
      assignedBus: assignedBus || '',
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
