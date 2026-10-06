// Seeds a demo route (Route 138, Pettah -> Maharagama) with road geometry and stop coordinates.
// Usage: npm run seed            (safe to re-run: it updates the same route)
// The road line comes from the public OSRM demo server; if that is unreachable, straight lines between stops are used.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Counter = require('../models/Counter');

const STOPS = [
  { name: 'Pettah', lat: 6.9344, lng: 79.8500 },
  { name: 'Borella Junction', lat: 6.9147, lng: 79.8778 },
  { name: 'Nugegoda', lat: 6.8721, lng: 79.8884 },
  { name: 'Delkanda', lat: 6.8632, lng: 79.9010 },
  { name: 'Maharagama', lat: 6.8480, lng: 79.9265 },
];

async function roadLine() {
  const coords = STOPS.map((s) => `${s.lng},${s.lat}`).join(';');
  const base = process.env.OSRM_URL || 'https://router.project-osrm.org/route/v1/driving';
  try {
    const res = await fetch(`${base}/${coords}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const line = data.routes?.[0]?.geometry?.coordinates;
    if (Array.isArray(line) && line.length > 1) return { line, km: data.routes[0].distance / 1000, source: 'OSRM' };
  } catch (err) {
    console.warn('OSRM unavailable:', err.message);
  }
  return { line: STOPS.map((s) => [s.lng, s.lat]), km: 14, source: 'straight lines' };
}

(async () => {
  if (!(await connectDB())) process.exit(1);
  const { line, km, source } = await roadLine();
  const bus = await Bus.findOne().sort({ createdAt: 1 });

  let route = await Route.findOne({ routeNumber: '138' });
  if (!route) {
    const counter = await Counter.findOneAndUpdate({ name: 'route' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    route = new Route({ routeId: `RT-${String(counter.seq).padStart(3, '0')}` });
  }
  Object.assign(route, {
    routeNumber: '138',
    name: 'Route 138: Pettah ➔ Maharagama',
    start: 'Pettah',
    end: 'Maharagama',
    distance: Math.round(km * 10) / 10,
    stops: STOPS.map((s) => s.name),
    stopPoints: STOPS.map((s) => ({ name: s.name, location: { type: 'Point', coordinates: [s.lng, s.lat] } })),
    path: { type: 'LineString', coordinates: line },
    status: 'Active',
  });
  if (!route.assignedBus && bus) route.assignedBus = `${bus.registration} (${bus.busId})`;
  await route.save();

  console.log(`Seeded ${route.routeId} "${route.name}": ${line.length} path points from ${source}, ${STOPS.length} stops, ${route.distance} km.`);
  console.log(route.assignedBus ? `Assigned bus: ${route.assignedBus}` : 'No bus registered yet: add one in the admin dashboard and assign it to this route.');
  await mongoose.disconnect();
})();
