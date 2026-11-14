// Seeds the Colombo bus routes (scripts/data/routes.js) with road geometry and stop coordinates (scripts/data/places.json).
// Usage: npm run seed              all routes (safe to re-run: it updates the same routes)
//        npm run seed -- 138       only the route numbers you list, e.g. 138 or 100 101
// The road line comes from the public OSRM demo server; if that is unreachable, straight lines between stops are used.
// The first bus in the fleet is assigned to Route 138 (the pilot route) when that route has no bus yet.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { nextId } = require('../lib/sequence');
const { formatBusRef } = require('../lib/busRef');
const { STATUS } = require('../lib/contract');
const { cumulativeDistances, toPoint, toLineString } = require('../lib/geo');
const { OSRM_URL } = require('../config/env');
const { ROUTES } = require('./data/routes');

const PILOT = '138';
const PLACES_FILE = path.join(__dirname, 'data', 'places.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function roadLine(stops) {
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  try {
    const res = await fetch(`${OSRM_URL}/${coords}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    const line = data.routes?.[0]?.geometry?.coordinates;
    if (Array.isArray(line) && line.length > 1) return { line, km: data.routes[0].distance / 1000, source: 'OSRM' };
  } catch (err) {
    console.warn(`  OSRM unavailable: ${err.message}`);
  }
  const points = stops.map((s) => [s.lat, s.lng]);
  const m = cumulativeDistances(points).pop();
  return { line: toLineString(points).coordinates, km: (m * 1.3) / 1000, source: 'straight lines' };
}

(async () => {
  if (!fs.existsSync(PLACES_FILE)) {
    console.error('scripts/data/places.json is missing. Run: node scripts/geocode-places.js');
    process.exit(1);
  }
  const places = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8'));
  const wanted = process.argv.slice(2);
  const todo = wanted.length ? ROUTES.filter((r) => wanted.includes(r.number)) : ROUTES;
  if (!todo.length) {
    console.error(`No such route in scripts/data/routes.js: ${wanted.join(', ')}`);
    process.exit(1);
  }
  if (!(await connectDB())) process.exit(1);
  const bus = await Bus.findOne().sort({ createdAt: 1 });

  let done = 0;
  for (const def of todo) {
    const missing = def.stops.filter((n) => !places[n]);
    const stops = def.stops.filter((n) => places[n]).map((n) => ({ name: n, ...places[n] }));
    if (missing.length) console.warn(`Route ${def.number}: no coordinates for ${missing.join(', ')} (left out)`);
    if (stops.length < 2) {
      console.warn(`Route ${def.number}: fewer than two stops with coordinates, skipped.`);
      continue;
    }
    const { line, km, source } = await roadLine(stops);

    let route = await Route.findOne({ routeNumber: def.number });
    if (!route) route = new Route({ routeId: await nextId('route') });
    Object.assign(route, {
      routeNumber: def.number,
      name: `Route ${def.number}: ${def.start} ➔ ${def.end}`,
      start: def.start,
      end: def.end,
      distance: Math.round(km * 10) / 10,
      stops: stops.map((s) => s.name),
      stopPoints: stops.map((s) => ({ name: s.name, location: toPoint(s.lat, s.lng) })),
      path: { type: 'LineString', coordinates: line }, // already GeoJSON order, from roadLine()
      status: STATUS.route[0],
    });
    if (def.number === PILOT && !route.assignedBus && bus) route.assignedBus = formatBusRef(bus);
    await route.save();
    done += 1;
    console.log(`Route ${def.number} ${route.routeId}: ${def.start} -> ${def.end}, ${stops.length} stops, ${route.distance} km, ${line.length} path points (${source})${route.assignedBus ? `, bus ${route.assignedBus}` : ''}`);
    if (source === 'OSRM' && todo.length > 1) await sleep(1000); // be polite to the public demo server
  }

  console.log(`\nSeeded ${done} of ${todo.length} route(s).`);
  if (todo.some((r) => r.number === PILOT)) {
    const pilot = await Route.findOne({ routeNumber: PILOT });
    if (pilot && !pilot.assignedBus) console.log('No bus registered yet: add one in the admin dashboard and assign it to Route 138.');
  }
  await mongoose.disconnect();
})();
