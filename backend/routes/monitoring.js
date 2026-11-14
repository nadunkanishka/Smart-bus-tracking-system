// Admin-only read endpoints: live status, metrics, analytics and the dashboard summary.
const express = require('express');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const { STATUS } = require('../lib/contract');
const { segmentAnalytics, etaAccuracy } = require('../lib/analytics');

// services: { realtime } built by index.js before the routes are mounted.
module.exports = ({ realtime }) => {
  const router = express.Router();

  router.get('/api/live', (req, res) => res.json({ buses: realtime.liveStatus(), serverTs: Date.now() }));
  router.get('/api/metrics', (req, res) => res.json(realtime.metrics()));

  // Journey-time distribution per route segment (the ETA engine's baseline).
  router.get('/api/analytics/segments', async (req, res) => {
    const route = await Route.findOne({ routeId: String(req.query.routeId || '') }).lean();
    if (!route) return res.status(404).json({ error: 'Route not found' });
    return res.json(await segmentAnalytics(route));
  });

  router.get('/api/analytics/eta', async (req, res) => {
    res.json(await etaAccuracy(req.query.routeId ? String(req.query.routeId) : ''));
  });

  router.get('/api/dashboard/summary', async (req, res) => {
    const [ACTIVE, IDLE, MAINTENANCE] = STATUS.bus;
    const [driverCount, busCount, routeCount, activeBuses, idleBuses, maintenanceBuses] = await Promise.all([
      Driver.countDocuments({ status: STATUS.driver[0] }),
      Bus.countDocuments(),
      Route.countDocuments({ status: STATUS.route[0] }),
      Bus.countDocuments({ status: ACTIVE }),
      Bus.countDocuments({ status: IDLE }),
      Bus.countDocuments({ status: MAINTENANCE }),
    ]);
    res.json({
      activeRoutes: routeCount,
      registeredBuses: busCount,
      activeDrivers: driverCount,
      fleetDistribution: { active: activeBuses, idle: idleBuses, maintenance: maintenanceBuses },
    });
  });

  return router;
};
