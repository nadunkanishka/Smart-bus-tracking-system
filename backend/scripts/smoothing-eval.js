// Measures how far the GPS smoother pulls a noisy track back towards the truth.
// Usage: node scripts/smoothing-eval.js [routeNumber]   (default 138; prints a table, same numbers every run)
// The route's real road line comes from the database when it can be reached (npm run seed first), else straight lines
// between its stops. A bus drives it at 8 m/s with a 40 s stop at every third stop, one fix every 3 s. Each fix gets random
// position noise (the report's 10-25 m) plus the odd 80 m spike; the phone reports an accuracy figure like a real one.
// Error = distance from where the bus really was. The same noisy fixes go through the raw path and the smoother.
require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('../models/Route');
const { ROUTES } = require('./data/routes');
const places = require('./data/places.json');
const { haversine, cumulativeDistances, projectOntoLine, pointAt: along, offset, fromLineString } = require('../lib/geo');
const { smoothFix, SMOOTHING } = require('../lib/smooth');
const { MONGODB_URI } = require('../config/env');
const { rng, gauss, sigmaForMeanError } = require('./lib/rand');

const SPEED = 8;
const STEP = 3;
let line;
let cum;
let stopDists;

async function loadRoute(number) {
  const def = ROUTES.find((r) => r.number === number);
  if (!def) throw new Error(`No route ${number} in scripts/data/routes.js`);
  const stops = def.stops.map((n) => [places[n].lat, places[n].lng]);
  let source = 'straight lines between the stops';
  line = stops;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    const route = await Route.findOne({ routeNumber: number }).lean();
    if (route?.path?.coordinates?.length > 1) { line = fromLineString(route.path.coordinates); source = `the stored road line (${line.length} points)`; }
    await mongoose.disconnect();
  } catch (err) { /* no database: straight lines */ }
  cum = cumulativeDistances(line);
  stopDists = stops.map((s) => projectOntoLine(line, cum, s).distAlong);
  return `Route ${number}, ${(cum[cum.length - 1] / 1000).toFixed(1)} km, from ${source}`;
}

const pointAt = (d) => along(line, cum, d);

// The true track: [{ ts, lat, lng, speed, stopped }]
function truth() {
  const out = [];
  const total = cum[cum.length - 1];
  const waits = stopDists.filter((_, i) => i % 3 === 2);
  let ts = 0;
  let d = 0;
  while (d < total) {
    const [lat, lng] = pointAt(d);
    out.push({ ts, lat, lng, speed: SPEED, stopped: false });
    ts += STEP * 1000;
    const next = d + SPEED * STEP;
    const hit = waits.find((w) => w >= d && w < next);
    d = next;
    if (hit != null) {
      const [wlat, wlng] = pointAt(hit);
      for (let w = 0; w < 40; w += STEP) { out.push({ ts, lat: wlat, lng: wlng, speed: 0, stopped: true }); ts += STEP * 1000; }
    }
  }
  return out;
}

const stats = (list) => {
  if (!list.length) return { mean: NaN, p95: NaN };
  const s = [...list].sort((a, b) => a - b);
  return { mean: list.reduce((a, b) => a + b, 0) / list.length, p95: s[Math.floor(s.length * 0.95)] };
};
const f1 = (n) => n.toFixed(1).padStart(6);

function run(meanErrM, cfg) {
  const rand = rng(7);
  const sigma = sigmaForMeanError(meanErrM);
  const track = truth();
  const rawErr = [];
  const smErr = [];
  const rawCross = [];
  const smCross = [];
  const rawStop = [];
  const smStop = [];
  let state = null;
  track.forEach((p) => {
    const mx = gauss(rand) * sigma;
    const my = gauss(rand) * sigma;
    const spike = rand() < 0.01 ? 80 : 0;
    const [lat, lng] = offset(p.lat, p.lng, mx, my + spike);
    const fix = { lat, lng, ts: 1e12 + p.ts, speed: p.speed, heading: null, accuracy: sigma * 1.5 };
    const res = smoothFix(state, fix, cfg);
    state = res.state;
    rawErr.push(haversine([p.lat, p.lng], [lat, lng]));
    smErr.push(haversine([p.lat, p.lng], [res.lat, res.lng]));
    rawCross.push(projectOntoLine(line, cum, [lat, lng]).offRoute);
    smCross.push(projectOntoLine(line, cum, [res.lat, res.lng]).offRoute);
    if (p.stopped) {
      rawStop.push(haversine([p.lat, p.lng], [lat, lng]));
      smStop.push(haversine([p.lat, p.lng], [res.lat, res.lng]));
    }
  });
  return { n: track.length, rawErr: stats(rawErr), smErr: stats(smErr), rawCross: stats(rawCross), smCross: stats(smCross), rawStop: stats(rawStop), smStop: stats(smStop) };
}

loadRoute(process.argv[2] || '138').then((what) => {
console.log(what);
console.log(`Smoother settings: ${JSON.stringify(SMOOTHING)}`);
console.log('Position error in metres, mean / 95th percentile. Lower is better.\n');
console.log('noise      fixes | position error raw -> smoothed | off the road raw -> smoothed | at a stop raw -> smoothed');
[10, 15, 25].forEach((m) => {
  const r = run(m, SMOOTHING);
  console.log(`${String(m).padStart(3)} m   ${String(r.n).padStart(6)} | ${f1(r.rawErr.mean)} /${f1(r.rawErr.p95)} -> ${f1(r.smErr.mean)} /${f1(r.smErr.p95)} | ${f1(r.rawCross.mean)} /${f1(r.rawCross.p95)} -> ${f1(r.smCross.mean)} /${f1(r.smCross.p95)} | ${f1(r.rawStop.mean)} /${f1(r.rawStop.p95)} -> ${f1(r.smStop.mean)} /${f1(r.smStop.p95)}`);
});
}).catch((err) => { console.error(err.message); process.exit(1); });
