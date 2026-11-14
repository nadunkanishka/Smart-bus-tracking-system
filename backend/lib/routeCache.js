// Prepared routes (geometry segmented at the stops, plus the history baseline) for the ETA engine, cached per route.
// The cache is dropped for a route when its geometry changes (routes/routes.js) or a trip on it adds history
// (lib/tripRecorder.js), and otherwise re-read after ROUTE_CACHE_MS.
const Route = require('../models/Route');
const { prepareRoute } = require('./eta');
const { fromPoint, fromLineString } = require('./geo');
const { segmentHistory } = require('./analytics');
const { ROUTE_CACHE_MS } = require('./limits');

// A route the engine can use, or null (unknown route, or fewer than two path points or stops).
async function loadPreparedRoute(routeId) {
  const doc = await Route.findOne({ routeId }).lean();
  if (!(doc && doc.path?.coordinates?.length >= 2 && doc.stopPoints?.length >= 2)) return null;
  const stops = doc.stopPoints.map((s) => ({ name: s.name, ...fromPoint(s.location) }));
  return prepareRoute(fromLineString(doc.path.coordinates), stops, await segmentHistory(routeId));
}

function createRouteCache({ load = loadPreparedRoute, ttlMs = ROUTE_CACHE_MS, now = Date.now } = {}) {
  const cache = new Map(); // routeId -> { prepared, at }
  return {
    async get(routeId) {
      const hit = cache.get(routeId);
      if (hit && now() - hit.at < ttlMs) return hit.prepared;
      const prepared = await load(routeId);
      cache.set(routeId, { prepared, at: now() });
      return prepared;
    },
    // One route, or every route when no id is given.
    invalidate(routeId) {
      if (routeId) cache.delete(routeId); else cache.clear();
    },
  };
}

module.exports = { createRouteCache, loadPreparedRoute };
