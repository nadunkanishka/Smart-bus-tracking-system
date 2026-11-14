const express = require('express');
const { nextId } = require('../lib/sequence');
const { pick, withoutBlankStatus, idQuery, badRequest } = require('../lib/crud');
const { busQueryFor } = require('../lib/busRef');
const { toPoint, toLineString } = require('../lib/geo');
const Route = require('../models/Route');
const Bus = require('../models/Bus');

// Clients send geometry as plain arrays: path [[lat, lng], ...] and stopPoints [{ name, lat, lng }, ...].
// It is stored as GeoJSON (LineString / Point, [lng, lat]) so MongoDB can index it with 2dsphere.
const validLatLng = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function readGeometry(body) {
  const out = {};
  if (body.path !== undefined) {
    const pts = Array.isArray(body.path) ? body.path.map((p) => [Number(p[0]), Number(p[1])]) : [];
    if (pts.length === 1 || pts.some(([lat, lng]) => !validLatLng(lat, lng))) throw badRequest('Route path needs at least 2 valid [lat, lng] points');
    out.path = pts.length ? toLineString(pts) : undefined;
  }
  if (body.stopPoints !== undefined) {
    const stops = Array.isArray(body.stopPoints) ? body.stopPoints : [];
    out.stopPoints = stops.map((sp) => {
      const lat = Number(sp.lat);
      const lng = Number(sp.lng);
      const name = String(sp.name || '').trim();
      if (!name) throw badRequest('Every stop needs a name');
      if (!validLatLng(lat, lng)) throw badRequest(`Stop "${name}" needs a position on the map`);
      return { name, location: toPoint(lat, lng) };
    });
    out.stops = out.stopPoints.map((sp) => sp.name); // clearing every stop point clears the names too
  }
  return out;
}

const EDITABLE = ['name', 'start', 'end', 'distance', 'routeNumber', 'assignedBus', 'status'];
const byId = (id) => idQuery(id, ['routeId']);

// The assigned bus is a bus reference ("NB-4712 (BUS-002)", or just a registration / bus id). It must be a bus that exists.
async function checkBus(assigned) {
  if (!assigned) return;
  const text = String(assigned).trim();
  if (!(await Bus.exists(busQueryFor(text)))) throw badRequest(`Bus "${text}" does not exist`);
}

// services: { store, routeCache } built by index.js before the routes are mounted.
module.exports = ({ store, routeCache }) => {
  const router = express.Router();

  // Live buses on a route, served from the latest-fix cache (not MongoDB).
  router.get('/api/routes/:id/buses', async (req, res) => {
    res.json({ routeId: req.params.id, buses: await store.byRoute(req.params.id), serverTs: Date.now() });
  });

  router.get('/api/routes', async (req, res) => {
    res.json(await Route.find().sort({ createdAt: -1 }));
  });

  router.get('/api/routes/:id', async (req, res) => {
    const route = await Route.findOne(byId(req.params.id));
    if (!route) return res.status(404).json({ error: 'Route not found' });
    return res.json(route);
  });

  router.post('/api/routes', async (req, res) => {
    const { name, start, end, distance, stops, assignedBus, status, routeNumber } = req.body;
    const geometry = readGeometry(req.body);
    await checkBus(assignedBus);
    const route = new Route({
      ...withoutBlankStatus({ status }),
      routeId: await nextId('route'),
      name,
      start,
      end,
      distance: Number(distance),
      stops: Array.isArray(stops) ? stops : [],
      assignedBus: assignedBus || '',
      routeNumber: routeNumber || '',
      ...geometry,
    });
    res.status(201).json(await route.save());
  });

  router.put('/api/routes/:id', async (req, res) => {
    // Only the listed fields can change: the body cannot rewrite routeId or _id.
    const data = pick(req.body, EDITABLE);
    if (data.distance !== undefined) data.distance = Number(data.distance);
    if (req.body.stops !== undefined) data.stops = Array.isArray(req.body.stops) ? req.body.stops : [];
    Object.assign(data, readGeometry(req.body));
    if (data.path === undefined && req.body.path !== undefined) { delete data.path; data.$unset = { path: 1 }; }
    await checkBus(data.assignedBus);

    const updated = await Route.findOneAndUpdate(byId(req.params.id), data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Route not found' });
    routeCache.invalidate(updated.routeId); // new geometry takes effect on the next GPS fix
    return res.json(updated);
  });

  router.delete('/api/routes/:id', async (req, res) => {
    const deleted = await Route.findOneAndDelete(byId(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Route not found' });
    routeCache.invalidate(deleted.routeId);
    return res.json({ message: 'Route deleted successfully', id: req.params.id });
  });

  return router;
};
