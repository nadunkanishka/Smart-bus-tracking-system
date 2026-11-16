// Prepared routes (geometry segmented at the stops, plus the history baseline) for the ETA engine, cached per route.
// The cache is dropped for a route when its geometry changes (routes/routes.js) or a trip on it adds history
// (lib/tripRecorder.js), and otherwise re-read after ROUTE_CACHE_MS.
const Route = require('../models/Route');
const { prepareRoute } = require('./eta');
const { fromPoint, fromLineString } = require('./geo');
const { segmentHistory } = require('./analytics');
const { ROUTE_CACHE_MS } = require('./limits');

// A route the engine can use, or null (unknown route, or fewer than two path points or stops). direction 'back' is the
// same road and stops reversed, so the engine always sees stops at increasing distance. shortcut: the return uses the
// same road and stops; one-way streets or other return stops need a route record of their own.
async function loadPreparedRoute(routeId, direction = 'out') {
  const doc = await Route.findOne({ routeId }).lean();
  if (!(doc && doc.path?.coordinates?.length >= 2 && doc.stopPoints?.length >= 2)) return null;
  const back = direction === 'back';
  const stops = doc.stopPoints.map((s) => ({ name: s.name, ...fromPoint(s.location) }));
  const coords = back ? [...doc.path.coordinates].reverse() : doc.path.coordinates;
  return prepareRoute(fromLineString(coords), back ? stops.reverse() : stops, await segmentHistory(routeId, direction));
}

function createRouteCache({ load = loadPreparedRoute, ttlMs = ROUTE_CACHE_MS, now = Date.now } = {}) {
  const cache = new Map(); // `routeId:direction` -> { prepared, at }
  return {
    async get(routeId, direction = 'out') {
      const key = `${routeId}:${direction}`;
      const hit = cache.get(key);
      if (hit && now() - hit.at < ttlMs) return hit.prepared;
      const prepared = await load(routeId, direction);
      cache.set(key, { prepared, at: now() });
      return prepared;
    },
    // One route (both directions), or every route when no id is given.
    invalidate(routeId) {
      if (routeId) { cache.delete(`${routeId}:out`); cache.delete(`${routeId}:back`); } else cache.clear();
    },
  };
}

module.exports = { createRouteCache };
