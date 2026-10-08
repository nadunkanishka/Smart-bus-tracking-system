const express = require('express');
const authLimiter = require('../middleware/authLimiter');
const { hashPassword, verifyPassword, isHashed, signToken } = require('../lib/auth');
const Admin = require('../models/Admin');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');

const router = express.Router();

// AUTH ROUTES
router.post('/api/auth/login', authLimiter, async (req, res) => {
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
router.post('/api/auth/driver-login', authLimiter, async (req, res) => {
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

module.exports = router;
