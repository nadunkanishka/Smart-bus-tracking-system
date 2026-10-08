const express = require('express');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const EtaLog = require('../models/EtaLog');
const Route = require('../models/Route');
const SegmentLog = require('../models/SegmentLog');

// Admin-only read endpoints: live status, metrics, analytics and the dashboard summary.
// state: { store, realtime } filled in by index.js once the latest-fix store is ready.
module.exports = (state) => {
  const router = express.Router();

  // LIVE MONITORING: active driver connections and telemetry status
  router.get('/api/live', (req, res) => res.json({ buses: state.realtime ? state.realtime.liveStatus() : [], serverTs: Date.now() }));
  router.get('/api/metrics', (req, res) => res.json(state.realtime ? state.realtime.metrics() : {}));

  // HISTORICAL ANALYTICS: journey-time distribution per route segment (the ETA engine's baseline)
  router.get('/api/analytics/segments', async (req, res) => {
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
  router.get('/api/analytics/eta', async (req, res) => {
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
  router.get('/api/dashboard/summary', async (req, res) => {
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

  return router;
};
