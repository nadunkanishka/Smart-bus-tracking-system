const express = require('express');
const { getNextSequence } = require('../lib/sequence');
const { pick, idQuery, fail } = require('../lib/crud');
const Route = require('../models/Route');
const Bus = require('../models/Bus');

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

const EDITABLE = ['name', 'start', 'end', 'distance', 'routeNumber', 'assignedBus', 'status'];
const byId = (id) => idQuery(id, ['routeId']);

// The assigned bus is stored as "NB-4712 (BUS-002)" (or just a registration / bus id). It must be a bus that exists.
async function checkBus(assigned) {
  if (!assigned) return;
  const text = String(assigned).trim();
  const m = text.match(/^(.*?)\s*\((BUS-\d+)\)$/);
  const ok = m ? await Bus.exists({ busId: m[2] }) : await Bus.exists({ $or: [{ busId: text }, { registration: text }] });
  if (!ok) throw new Error(`Bus "${text}" does not exist`);
}

// state: { store, realtime } filled in by index.js once the latest-fix store is ready.
module.exports = (state) => {
  const router = express.Router();

  // Live buses on a route, served from the latest-fix cache (not MongoDB).
  router.get('/api/routes/:id/buses', async (req, res) => {
    try {
      res.json({ routeId: req.params.id, buses: state.store ? await state.store.byRoute(req.params.id) : [], serverTs: Date.now() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/routes', async (req, res) => {
    try {
      const routes = await Route.find().sort({ createdAt: -1 });
      res.json(routes);
    } catch (error) {
      fail(res, error, 500);
    }
  });

  router.get('/api/routes/:id', async (req, res) => {
    try {
      const route = await Route.findOne(byId(req.params.id));
      if (!route) return res.status(404).json({ error: 'Route not found' });
      return res.json(route);
    } catch (error) {
      return fail(res, error);
    }
  });

  router.post('/api/routes', async (req, res) => {
    try {
      const { name, start, end, distance, stops, assignedBus, status, routeNumber } = req.body;
      const geometry = readGeometry(req.body);
      await checkBus(assignedBus);
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
      fail(res, error);
    }
  });

  router.put('/api/routes/:id', async (req, res) => {
    try {
      // Only the listed fields can change: the body cannot rewrite routeId or _id.
      const data = pick(req.body, EDITABLE);
      if (data.distance !== undefined) data.distance = Number(data.distance);
      if (req.body.stops !== undefined) data.stops = Array.isArray(req.body.stops) ? req.body.stops : [];
      Object.assign(data, readGeometry(req.body));
      if (data.path === undefined && req.body.path !== undefined) { delete data.path; data.$unset = { path: 1 }; }
      await checkBus(data.assignedBus);

      const updated = await Route.findOneAndUpdate(byId(req.params.id), data, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ error: 'Route not found' });
      state.realtime?.invalidateRoute(updated.routeId); // new geometry takes effect on the next GPS fix
      return res.json(updated);
    } catch (error) {
      return fail(res, error);
    }
  });

  router.delete('/api/routes/:id', async (req, res) => {
    try {
      const deleted = await Route.findOneAndDelete(byId(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Route not found' });
      state.realtime?.invalidateRoute(deleted.routeId);
      return res.json({ message: 'Route deleted successfully', id: req.params.id });
    } catch (error) {
      return fail(res, error, 500);
    }
  });

  return router;
};
