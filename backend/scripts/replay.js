// GPS replay: simulates drivers moving along a route and prints what a passenger receives.
//
//   npm run replay -- --route RT-001 --buses 3 --speed 12 --interval 3000 --duration 120
//   npm run replay -- --route RT-001 --offline 20:50      (bus 1 loses signal from second 20 to 50, then flushes)
//
// Virtual buses (SIM-01, SIM-02, ...) get driver tokens signed with the server's JWT_SECRET, so run this with
// the same .env as the backend. Latency is measured on one clock (this machine): device timestamp -> passenger receive.
require('dotenv').config();
const { io } = require('socket.io-client');
const { signToken } = require('../lib/auth');
const { cumulativeDistances } = require('../lib/geo');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const URL = arg('url', process.env.API_URL || 'http://localhost:5000');
const ROUTE = arg('route');
const BUSES = Number(arg('buses', 1));
const SPEED = Number(arg('speed', 10)); // m/s
const INTERVAL = Number(arg('interval', 3000));
const DURATION = Number(arg('duration', 60)); // seconds
const [OFF_FROM, OFF_TO] = String(arg('offline', '')).split(':').map(Number);
const QUIET = process.argv.includes('--quiet');

if (!ROUTE) { console.error('Usage: npm run replay -- --route <routeId> [--buses N] [--offline from:to]'); process.exit(1); }

const pointAt = (line, cum, d) => {
  const dist = Math.min(d, cum[cum.length - 1]);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < dist) i += 1;
  const t = (dist - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t];
};

(async () => {
  const routes = await (await fetch(`${URL}/api/routes`)).json();
  const route = routes.find((r) => r.routeId === ROUTE);
  if (!route?.path?.coordinates?.length) { console.error(`Route ${ROUTE} not found or has no path. Run "npm run seed" first.`); process.exit(1); }
  const line = route.path.coordinates.map(([lng, lat]) => [lat, lng]);
  const cum = cumulativeDistances(line);
  const total = cum[cum.length - 1];

  // Passenger: subscribes to the route room and records end-to-end latency.
  const latencies = [];
  let updates = 0;
  let lastPrint = 0;
  const passenger = io(URL, { transports: ['websocket'] });
  passenger.on('connect', () => passenger.emit('route:subscribe', { routeId: ROUTE }));
  passenger.on('route:snapshot', (s) => console.log(`[passenger] snapshot from cache: ${s.buses.length} bus(es)`));
  passenger.on('bus:update', (u) => {
    updates += 1;
    if (!u.buffered) latencies.push(Date.now() - u.deviceTs);
    if (!QUIET && Date.now() - lastPrint > 5000) {
      lastPrint = Date.now();
      const etas = u.stops.map((s) => (s.status === 'passed' ? `${s.name}: passed` : `${s.name}: ${s.etaMin} min`)).join(' | ');
      console.log(`[passenger] ${u.busId} seg ${u.segIndex} -> ${etas}`);
    }
  });

  // Drivers
  const drivers = Array.from({ length: BUSES }, (_, n) => {
    const busId = `SIM-${String(n + 1).padStart(2, '0')}`;
    const socket = io(URL, { transports: ['websocket'], auth: { token: signToken({ role: 'driver', busId, registration: busId, routeId: ROUTE, driverName: 'Simulator' }) } });
    return { busId, socket, dist: (total / BUSES) * n * 0.6, queue: [], sent: 0, offline: false };
  });

  const started = Date.now();
  const tick = setInterval(() => {
    const elapsed = (Date.now() - started) / 1000;
    drivers.forEach((d, n) => {
      d.dist += SPEED * (INTERVAL / 1000);
      if (d.dist > total) d.dist = 0; // loop back to the start: a new trip
      const [lat, lng] = pointAt(line, cum, d.dist);
      const fix = { lat, lng, speed: SPEED, heading: 0, ts: Date.now(), seq: d.sent += 1 };

      const shouldBeOffline = n === 0 && Number.isFinite(OFF_FROM) && elapsed >= OFF_FROM && elapsed < OFF_TO;
      if (shouldBeOffline && !d.offline) { d.offline = true; console.log(`[${d.busId}] signal lost, buffering fixes`); }
      if (!shouldBeOffline && d.offline) {
        d.offline = false;
        const batch = d.queue.splice(0);
        d.socket.emit('gps:batch', batch, (ack) => console.log(`[${d.busId}] signal back, flushed ${batch.length} buffered fixes ->`, ack));
      }
      if (d.offline) d.queue.push(fix); else d.socket.emit('gps:fix', fix);
    });
    if (elapsed >= DURATION) finish();
  }, INTERVAL);

  function finish() {
    clearInterval(tick);
    setTimeout(() => {
      const s = [...latencies].sort((a, b) => a - b);
      const avg = s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
      console.log('\n── Replay summary ──');
      console.log(`drivers: ${BUSES}, fixes sent: ${drivers.reduce((a, d) => a + d.sent, 0)}, passenger updates received: ${updates}`);
      console.log(`end-to-end latency (device -> passenger): avg ${avg} ms, p95 ${s[Math.floor(s.length * 0.95)] ?? null} ms, peak ${s[s.length - 1] ?? null} ms`);
      drivers.forEach((d) => { d.socket.emit('driver:duty', { onDuty: false }); d.socket.close(); });
      passenger.close();
      setTimeout(() => process.exit(0), 300);
    }, 500);
  }
})();
