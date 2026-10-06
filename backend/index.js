const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

dotenv.config(); // must run before modules that read process.env

const connectDB = require('./config/db');
const { createStore } = require('./lib/store');
const { createRealtime } = require('./realtime');
const { hashPassword, verifyPassword, isHashed, signToken, requireRole } = require('./lib/auth');
const Passenger = require('./models/Passenger');
const SegmentLog = require('./models/SegmentLog');
const EtaLog = require('./models/EtaLog');

const Driver = require('./models/Driver');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Counter = require('./models/Counter');
const Admin = require('./models/Admin');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS_ORIGIN: comma-separated list of allowed origins. Unset = allow all (local development).
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });
let realtime = null; // set once the latest-fix store is ready
let store = null;

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again later.' } });
const adminOnly = requireRole('admin');

// Connect to MongoDB and seed default admin
connectDB().then(async (connected) => {
  if (connected) {
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const initial = process.env.ADMIN_PASSWORD || 'admin123';
        await Admin.create({
          username: process.env.ADMIN_USERNAME || 'admin',
          password: hashPassword(initial),
          name: 'Super Admin',
          role: 'Super Admin',
        });
        console.log(process.env.ADMIN_PASSWORD
          ? 'Default admin account created from ADMIN_USERNAME / ADMIN_PASSWORD.'
          : 'Default admin account created: admin / admin123. Set ADMIN_PASSWORD before deploying.');
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
  const mongo = mongoose.connection.readyState === 1;
  res.status(mongo ? 200 : 503).json({
    status: mongo ? 'ok' : 'degraded',
    message: 'Smart Bus Tracking API is running',
    mongo: mongo ? 'connected' : 'disconnected',
    cache: store ? store.kind : 'starting',
    sockets: io.engine.clientsCount,
  });
});

// AUTH ROUTES
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username: String(username) });
    if (!admin || !verifyPassword(String(password), admin.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (!isHashed(admin.password)) { // upgrade a legacy plaintext password on first successful login
      admin.password = hashPassword(String(password));
      await admin.save();
    }

    res.json({
      message: 'Login successful',
      token: signToken({ role: 'admin', sub: String(admin._id), username: admin.username }),
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
app.post('/api/auth/driver-login', authLimiter, async (req, res) => {
  try {
    const { registration, busId, password } = req.body;
    if ((!registration && !busId) || !password) {
      return res.status(400).json({ error: 'Bus registration number and password are required.' });
    }

    const query = registration
      ? { registration: String(registration).trim() }
      : { busId: String(busId).trim() };

    const bus = await Bus.findOne(query);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found in database. Check registration no.' });
    }

    if (!verifyPassword(String(password), bus.password)) {
      return res.status(401).json({ error: 'Invalid password for this bus.' });
    }
    if (!isHashed(bus.password)) {
      bus.password = hashPassword(String(password));
      await bus.save();
    }
    const driver = bus.assignedDriver ? await Driver.findOne({ driverId: bus.assignedDriver }) : null;

    // Find assigned route in MongoDB for this bus
    // Matches if route.assignedBus includes registration or busId
    const assignedRoute = await Route.findOne({
      assignedBus: { $regex: bus.registration, $options: 'i' },
    }) || await Route.findOne({
      assignedBus: { $regex: bus.busId || 'BUS-', $options: 'i' },
    });

    res.json({
      message: 'Bus authentication successful',
      token: signToken({
        role: 'driver',
        busId: bus.busId,
        registration: bus.registration,
        routeId: assignedRoute ? assignedRoute.routeId : null,
        driverName: driver ? driver.name : null,
      }),
      driver: driver ? { driverId: driver.driverId, name: driver.name } : null,
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
            routeNumber: assignedRoute.routeNumber,
            path: assignedRoute.path,
            stopPoints: assignedRoute.stopPoints,
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

// PASSENGER ACCOUNTS
const passengerView = (p) => ({ id: p._id, username: p.username, name: p.name, phone: p.phone });

app.post('/api/passengers/register', authLimiter, async (req, res) => {
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

app.post('/api/passengers/login', authLimiter, async (req, res) => {
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

// Everything below is admin-only, except reading routes (passengers need the route list and geometry).
app.use(['/api/dashboard', '/api/drivers', '/api/buses', '/api/live', '/api/metrics', '/api/analytics'], adminOnly);
app.use('/api/routes', (req, res, next) => (req.method === 'GET' ? next() : adminOnly(req, res, next)));

// LIVE MONITORING: active driver connections and telemetry status
app.get('/api/live', (req, res) => res.json({ buses: realtime ? realtime.liveStatus() : [], serverTs: Date.now() }));
app.get('/api/metrics', (req, res) => res.json(realtime ? realtime.metrics() : {}));

// HISTORICAL ANALYTICS: journey-time distribution per route segment (the ETA engine's baseline)
app.get('/api/analytics/segments', async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: String(req.query.routeId || '') }).lean();
    if (!route) return res.status(404).json({ error: 'Route not found' });
    const logs = await SegmentLog.find({ routeId: route.routeId }).select('segIndex traversalSec dwellSec -_id').lean();
    const names = (route.stopPoints || []).map((s) => s.name);
    const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
    const segments = names.slice(0, -1).map((from, i) => {
      const rows = logs.filter((l) => l.segIndex === i);
      const t = rows.map((l) => l.traversalSec).sort((a, b) => a - b);
      const avg = (list) => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null);
      return {
        segIndex: i, from, to: names[i + 1], samples: rows.length,
        traversalSec: t.length ? { avg: avg(t), min: t[0], p50: pct(t, 0.5), p90: pct(t, 0.9), max: t[t.length - 1] } : null,
        dwellSecAvg: avg(rows.map((l) => l.dwellSec)),
        values: t, // raw samples for the distribution chart
      };
    });
    return res.json({ routeId: route.routeId, name: route.name, segments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ETA accuracy: mean absolute error of predicted vs actual stop arrivals
app.get('/api/analytics/eta', async (req, res) => {
  try {
    const match = req.query.routeId ? { routeId: String(req.query.routeId) } : {};
    const [row] = await EtaLog.aggregate([
      { $match: match },
      { $group: { _id: null, samples: { $sum: 1 }, maeSec: { $avg: { $abs: '$errorSec' } }, biasSec: { $avg: '$errorSec' }, maxAbsSec: { $max: { $abs: '$errorSec' } } } },
    ]);
    return res.json(row ? { samples: row.samples, maeSec: Math.round(row.maeSec), biasSec: Math.round(row.biasSec), maxAbsSec: row.maxAbsSec } : { samples: 0, maeSec: null, biasSec: null, maxAbsSec: null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
// The bus password is write-only: responses carry hasPassword instead of the value.
const busView = (bus) => {
  const { password, ...rest } = bus.toObject ? bus.toObject() : bus;
  return { ...rest, hasPassword: !!password };
};

app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.json(buses.map(busView));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/buses', async (req, res) => {
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

app.put('/api/buses/:id', async (req, res) => {
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
// Clients send geometry as plain arrays: path [[lat, lng], ...] and stopPoints [{ name, lat, lng }, ...].
// It is stored as GeoJSON (LineString / Point, [lng, lat]) so MongoDB can index it with 2dsphere.
const validLatLng = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function readGeometry(body) {
  const out = {};
  if (body.path !== undefined) {
    const pts = Array.isArray(body.path) ? body.path.map((p) => [Number(p[0]), Number(p[1])]) : [];
    if (pts.length === 1 || pts.some(([lat, lng]) => !validLatLng(lat, lng))) throw new Error('Route path needs at least 2 valid [lat, lng] points');
    out.path = pts.length ? { type: 'LineString', coordinates: pts.map(([lat, lng]) => [lng, lat]) } : undefined;
  }
  if (body.stopPoints !== undefined) {
    const stops = Array.isArray(body.stopPoints) ? body.stopPoints : [];
    out.stopPoints = stops.map((sp) => {
      const lat = Number(sp.lat);
      const lng = Number(sp.lng);
      const name = String(sp.name || '').trim();
      if (!name) throw new Error('Every stop needs a name');
      if (!validLatLng(lat, lng)) throw new Error(`Stop "${name}" needs a position on the map`);
      return { name, location: { type: 'Point', coordinates: [lng, lat] } };
    });
    if (out.stopPoints.length) out.stops = out.stopPoints.map((sp) => sp.name);
  }
  return out;
}

// Live buses on a route, served from the latest-fix cache (not MongoDB).
app.get('/api/routes/:id/buses', async (req, res) => {
  try {
    res.json({ routeId: req.params.id, buses: store ? await store.byRoute(req.params.id) : [], serverTs: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    const { name, start, end, distance, stops, assignedBus, status, routeNumber } = req.body;
    const geometry = readGeometry(req.body);
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
      routeNumber: routeNumber || '',
      status: status || 'Active',
      ...geometry,
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
    Object.assign(data, readGeometry(req.body));
    if (data.path === undefined && req.body.path !== undefined) { delete data.path; data.$unset = { path: 1 }; }

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ _id: req.params.id }, { routeId: req.params.id }] }
      : { routeId: req.params.id };

    const updated = await Route.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Route not found' });
    realtime?.invalidateRoute(updated.routeId); // new geometry takes effect on the next GPS fix
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
    realtime?.invalidateRoute(deleted.routeId);
    res.json({ message: 'Route deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

createStore().then((s) => {
  store = s;
  realtime = createRealtime(io, store);
  server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT} (Socket.IO enabled, cache: ${store.kind})`);
  });
});
