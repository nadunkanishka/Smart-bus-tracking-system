const express = require('express');
const { nextId } = require('../lib/sequence');
const { pick, withoutBlankStatus, idQuery, badRequest, httpError } = require('../lib/crud');
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

const EDITABLE = ['name', 'start', 'end', 'distance', 'routeNumber', 'status'];
const byId = (id) => idQuery(id, ['routeId']);

// A route has many buses, a bus has one route. The link is Bus.routeId; the admin sends the route's whole list as busIds.
// Checks first, so a rejected list changes nothing: every bus must exist and not be on another route.
async function checkBuses(routeId, busIds) {
  const ids = [...new Set((Array.isArray(busIds) ? busIds : []).map((id) => String(id).trim()).filter(Boolean))];
  const found = ids.length ? await Bus.find({ busId: { $in: ids } }) : [];
  const missing = ids.filter((id) => !found.some((b) => b.busId === id));
  if (missing.length) throw badRequest(`Bus ${missing.join(', ')} does not exist`);
  const taken = found.filter((b) => b.routeId && b.routeId !== routeId);
  if (taken.length) throw httpError(409, `${taken.map((b) => `${b.registration} (${b.busId}) is on route ${b.routeId}`).join('; ')}. A bus can run on one route only.`);
  return ids;
}

// Makes exactly `ids` the buses of the route.
async function setBuses(routeId, ids) {
  await Bus.updateMany({ routeId, busId: { $nin: ids } }, { routeId: '' });
  if (ids.length) await Bus.updateMany({ busId: { $in: ids } }, { routeId });
}

// Route documents as the API shows them: plus the ids and registrations of the buses on the route.
async function withBuses(routes) {
  const list = Array.isArray(routes) ? routes : [routes];
  const buses = await Bus.find({ routeId: { $in: list.map((r) => r.routeId) } }).sort({ busId: 1 });
  const view = list.map((r) => {
    const mine = buses.filter((b) => b.routeId === r.routeId);
    return { ...r.toObject(), busIds: mine.map((b) => b.busId), buses: mine.map((b) => ({ busId: b.busId, registration: b.registration })) };
  });
  return Array.isArray(routes) ? view : view[0];
}

// services: { store, routeCache } built by index.js before the routes are mounted.
module.exports = ({ store, routeCache }) => {
  const router = express.Router();

  // Live buses on a route, served from the latest-fix cache (not MongoDB).
  router.get('/api/routes/:id/buses', async (req, res) => {
    res.json({ routeId: req.params.id, buses: await store.byRoute(req.params.id), serverTs: Date.now() });
  });

  router.get('/api/routes', async (req, res) => {
    res.json(await withBuses(await Route.find().sort({ createdAt: -1 })));
  });

  router.get('/api/routes/:id', async (req, res) => {
    const route = await Route.findOne(byId(req.params.id));
    if (!route) return res.status(404).json({ error: 'Route not found' });
    return res.json(await withBuses(route));
  });

  router.post('/api/routes', async (req, res) => {
    const { name, start, end, distance, stops, busIds, status, routeNumber } = req.body;
    const geometry = readGeometry(req.body);
    const routeId = await nextId('route');
    const ids = await checkBuses(routeId, busIds);
    const route = new Route({
      ...withoutBlankStatus({ status }),
      routeId,
      name,
      start,
      end,
      distance: Number(distance),
      stops: Array.isArray(stops) ? stops : [],
      routeNumber: routeNumber || '',
      ...geometry,
    });
    await route.save();
    await setBuses(routeId, ids);
    res.status(201).json(await withBuses(route));
  });

  router.put('/api/routes/:id', async (req, res) => {
    // Only the listed fields can change: the body cannot rewrite routeId or _id.
    const data = pick(req.body, EDITABLE);
    if (data.distance !== undefined) data.distance = Number(data.distance);
    if (req.body.stops !== undefined) data.stops = Array.isArray(req.body.stops) ? req.body.stops : [];
    Object.assign(data, readGeometry(req.body));
    if (data.path === undefined && req.body.path !== undefined) { delete data.path; data.$unset = { path: 1 }; }
    const current = await Route.findOne(byId(req.params.id));
    if (!current) return res.status(404).json({ error: 'Route not found' });
    const ids = req.body.busIds !== undefined ? await checkBuses(current.routeId, req.body.busIds) : null;

    const updated = await Route.findOneAndUpdate(byId(req.params.id), data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Route not found' });
    if (ids) await setBuses(updated.routeId, ids);
    routeCache.invalidate(updated.routeId); // new geometry takes effect on the next GPS fix
    return res.json(await withBuses(updated));
  });

  router.delete('/api/routes/:id', async (req, res) => {
    const deleted = await Route.findOneAndDelete(byId(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Route not found' });
    await Bus.updateMany({ routeId: deleted.routeId }, { routeId: '' }); // its buses become free to take another route
    routeCache.invalidate(deleted.routeId);
    return res.json({ message: 'Route deleted successfully', id: req.params.id });
  });

  return router;
};
