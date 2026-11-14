const express = require('express');
const authLimiter = require('../middleware/authLimiter');
const { driverClaims } = require('../lib/auth');
const { signIn, issueToken } = require('../lib/accounts');
const { routeQueriesFor } = require('../lib/busRef');
const Admin = require('../models/Admin');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');

const router = express.Router();

router.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = await Admin.findOne({ username: String(username) });
  if (!(await signIn(admin, password))) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  return res.json({
    message: 'Login successful',
    token: issueToken('admin', { sub: String(admin._id), username: admin.username }),
    user: {
      id: admin._id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    },
  });
});

router.post('/api/auth/driver-login', authLimiter, async (req, res) => {
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
  if (!(await signIn(bus, password))) {
    return res.status(401).json({ error: 'Invalid password for this bus.' });
  }
  const driver = bus.assignedDriver ? await Driver.findOne({ driverId: bus.assignedDriver }) : null;

  const [byId, byRegistration] = routeQueriesFor(bus);
  const assignedRoute = await Route.findOne(byId) || await Route.findOne(byRegistration);

  return res.json({
    message: 'Bus authentication successful',
    token: issueToken('driver', driverClaims(bus, assignedRoute, driver ? driver.name : null)),
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
});

module.exports = router;
