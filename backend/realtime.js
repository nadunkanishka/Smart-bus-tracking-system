// Real-time pipeline: drivers emit GPS fixes, the server validates them, recomputes the ETA for every downstream
// stop, caches the latest fix per bus and pushes the update to the Socket.IO room of that bus's route.
const crypto = require('crypto');
const { prepareRoute, computeEta } = require('./lib/eta');
const { haversine } = require('./lib/geo');
const { validateFix, MAX_SPEED_MPS } = require('./lib/validate');
const { startTrip, advance } = require('./lib/tripTracker');
const { readToken } = require('./lib/auth');

const Route = require('./models/Route');
const Trip = require('./models/Trip');
const SegmentLog = require('./models/SegmentLog');
const EtaLog = require('./models/EtaLog');
const GpsLog = require('./models/GpsLog');

const ROUTE_CACHE_MS = 5 * 60 * 1000; // history baseline is re-read from MongoDB this often
const LIVE_MAX_AGE_MS = 15000; // a fix older than this is historical (offline buffer), not a live position
const GPS_FLUSH_MS = 5000;
const MIN_FIX_GAP_MS = 900; // drivers send every 3 s; anything faster than ~1/s is dropped
const room = (routeId) => `route:${routeId}`;

function createRealtime(io, store) {
  const buses = new Map(); // busId -> live state for this process
  const routes = new Map(); // routeId -> { prepared, at }
  let gpsBuffer = [];

  const metrics = {
    startedAt: Date.now(), received: 0, accepted: 0, rejected: 0, duplicates: 0, batches: 0, bufferedFixes: 0, broadcasts: 0,
    ingestMs: [], // device timestamp -> server receive (includes device clock skew)
    processMs: [], // server receive -> emitted to the route room
  };
  const sample = (list, v) => { list.push(v); if (list.length > 5000) list.shift(); };

  // ── Route geometry + historical baseline ────────────────────────────────
  async function getRoute(routeId) {
    const hit = routes.get(routeId);
    if (hit && Date.now() - hit.at < ROUTE_CACHE_MS) return hit.prepared;
    const doc = await Route.findOne({ routeId }).lean();
    let prepared = null;
    if (doc && doc.path?.coordinates?.length >= 2 && doc.stopPoints?.length >= 2) {
      const rows = await SegmentLog.aggregate([
        { $match: { routeId } },
        { $group: { _id: '$segIndex', traversalSec: { $avg: '$traversalSec' }, dwellSec: { $avg: '$dwellSec' }, samples: { $sum: 1 } } },
      ]);
      const history = Object.fromEntries(rows.map((r) => [r._id, r]));
      const line = doc.path.coordinates.map(([lng, lat]) => [lat, lng]);
      const stops = doc.stopPoints.map((s) => ({ name: s.name, lat: s.location.coordinates[1], lng: s.location.coordinates[0] }));
      prepared = prepareRoute(line, stops, history);
    }
    routes.set(routeId, { prepared, at: Date.now() });
    return prepared;
  }
  const invalidateRoute = (routeId) => (routeId ? routes.delete(routeId) : routes.clear());

  // ── One GPS fix through the pipeline ────────────────────────────────────
  // Returns 'accepted' | 'duplicate' | an error string. `buffered` marks fixes replayed from the offline queue.
  async function handleFix(bus, raw, { buffered = false, broadcast = true, recvTs = Date.now() } = {}) {
    metrics.received += 1;
    const v = validateFix(raw, recvTs);
    if (!v.ok) { metrics.rejected += 1; return v.error; }
    const fix = v.fix;

    // Duplicates and out-of-order fixes: only strictly newer device timestamps move the bus.
    if (bus.lastFix && fix.ts <= bus.lastFix.ts) { metrics.duplicates += 1; return 'duplicate'; }
    if (bus.lastFix) {
      const dt = (fix.ts - bus.lastFix.ts) / 1000;
      if (!buffered && dt * 1000 < MIN_FIX_GAP_MS) { metrics.rejected += 1; return 'too frequent'; }
      if (haversine([bus.lastFix.lat, bus.lastFix.lng], [fix.lat, fix.lng]) / dt > MAX_SPEED_MPS * 1.5) {
        metrics.rejected += 1;
        return 'position jump';
      }
    }
    metrics.accepted += 1;
    if (buffered) metrics.bufferedFixes += 1;
    bus.lastFix = fix;
    bus.lastSeen = recvTs;

    const route = await getRoute(bus.routeId);
    let eta = null;
    if (route) {
      eta = computeEta(route, fix, bus.distAlong);
      bus.distAlong = eta.distAlong;
      bus.nextStopIndex = Math.min(eta.segIndex + 1, route.stops.length - 1);
      await track(bus, route, eta, fix);
    }

    gpsBuffer.push({
      busId: bus.busId, routeId: bus.routeId, tripId: bus.trip?.tripId,
      location: { type: 'Point', coordinates: [fix.lng, fix.lat] },
      speed: fix.speed, heading: fix.heading, deviceTs: new Date(fix.ts), buffered,
    });

    const live = recvTs - fix.ts <= LIVE_MAX_AGE_MS;
    // Historical fixes (and all but the newest fix of a flushed batch) are logged and used for trip history,
    // but never shown to passengers as the bus's current position.
    if (!live || !broadcast) return 'accepted';

    const payload = {
      busId: bus.busId,
      registration: bus.registration,
      driverName: bus.driverName || null,
      routeId: bus.routeId,
      lat: fix.lat, lng: fix.lng, speed: fix.speed, heading: fix.heading,
      deviceTs: fix.ts,
      buffered,
      serverRecvTs: recvTs,
      serverEmitTs: Date.now(),
      segIndex: eta ? eta.segIndex : null,
      offRouteM: eta ? Math.round(eta.offRoute) : null,
      finished: eta ? eta.finished : false,
      stops: eta ? eta.stops : [], // ETA for every stop: passed, or minutes away
    };
    await store.setLast(bus.busId, payload);
    io.to(room(bus.routeId)).emit('bus:update', payload);
    metrics.broadcasts += 1;
    if (!buffered) { // latency is only meaningful for fixes sent as they were captured
      sample(metrics.ingestMs, recvTs - fix.ts);
      sample(metrics.processMs, payload.serverEmitTs - recvTs);
    }
    return 'accepted';
  }

  // Trip history: segment traversal/dwell samples and predicted-vs-actual arrival logs.
  async function track(bus, route, eta, fix) {
    if (!bus.trip || (eta.segIndex < bus.trip.segIndex && eta.distAlong < 200)) {
      // first fix, or the bus is back at the start of the route: a new trip begins
      if (bus.trip) await Trip.updateOne({ tripId: bus.trip.tripId }, { endedAt: new Date(fix.ts) });
      bus.trip = startTrip(eta, fix, `TRIP-${crypto.randomUUID().slice(0, 8)}`);
      await Trip.create({ tripId: bus.trip.tripId, busId: bus.busId, registration: bus.registration, routeId: bus.routeId, startedAt: new Date(fix.ts) });
      return;
    }
    const res = advance(bus.trip, route, eta, fix);
    const base = { routeId: bus.routeId, tripId: bus.trip.tripId, busId: bus.busId };
    if (res.segmentLogs.length) await SegmentLog.insertMany(res.segmentLogs.map((l) => ({ ...base, ...l, at: new Date(fix.ts) })));
    if (res.etaLogs.length) {
      await EtaLog.insertMany(res.etaLogs.map((l) => ({
        ...base, ...l, predictedAt: new Date(l.predictedAt), predictedArrival: new Date(l.predictedArrival), actualArrival: new Date(l.actualArrival),
      })));
    }
    if (res.ended) {
      await Trip.updateOne({ tripId: bus.trip.tripId }, { endedAt: new Date(fix.ts), completed: true });
      bus.trip = null;
    }
  }

  const flushTimer = setInterval(async () => {
    if (!gpsBuffer.length) return;
    const docs = gpsBuffer;
    gpsBuffer = [];
    try { await GpsLog.insertMany(docs, { ordered: false }); } catch (err) { console.error('[gps] log write failed:', err.message); }
  }, GPS_FLUSH_MS);
  flushTimer.unref();

  async function goOffline(bus) {
    bus.onDuty = false;
    await store.remove(bus.busId);
    io.to(room(bus.routeId)).emit('bus:offline', { busId: bus.busId });
  }

  // ── Sockets ─────────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    socket.data.user = token ? readToken(token) : null;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    // Passengers (and the admin map): one route room at a time, snapshot served from the cache.
    socket.on('route:subscribe', async ({ routeId } = {}, ack) => {
      if (typeof routeId !== 'string' || !routeId) return ack?.({ ok: false, error: 'routeId is required' });
      [...socket.rooms].filter((r) => r.startsWith('route:')).forEach((r) => socket.leave(r));
      socket.join(room(routeId));
      const snapshot = await store.byRoute(routeId);
      socket.emit('route:snapshot', { routeId, buses: snapshot, serverTs: Date.now() });
      return ack?.({ ok: true, buses: snapshot.length });
    });
    socket.on('route:unsubscribe', () => {
      [...socket.rooms].filter((r) => r.startsWith('route:')).forEach((r) => socket.leave(r));
    });

    if (user?.role !== 'driver') return;

    // Drivers: one live state per bus; a reconnect re-attaches to it so trip history survives network drops.
    let bus = buses.get(user.busId);
    if (!bus) {
      bus = { busId: user.busId, registration: user.registration, routeId: user.routeId, driverName: user.driverName, onDuty: false };
      buses.set(user.busId, bus);
    }
    Object.assign(bus, { routeId: user.routeId, driverName: user.driverName, socketId: socket.id, connected: true, connectedAt: Date.now() });

    socket.on('driver:duty', async ({ onDuty } = {}, ack) => {
      if (onDuty) { bus.onDuty = true; bus.lastSeen = Date.now(); } else await goOffline(bus);
      ack?.({ ok: true, onDuty: bus.onDuty });
    });

    socket.on('gps:fix', async (raw, ack) => {
      if (!bus.routeId) return ack?.({ ok: false, error: 'No route assigned to this bus' });
      bus.onDuty = true;
      const result = await handleFix(bus, raw);
      return ack?.({ ok: result === 'accepted' || result === 'duplicate', result, ts: raw?.ts, nextStopIndex: bus.nextStopIndex ?? null });
    });

    // Offline buffer flush: fixes are replayed oldest-first so trip history stays correct, and duplicates
    // (a batch re-sent because its ack was lost) are dropped by the timestamp check.
    socket.on('gps:batch', async (list, ack) => {
      if (!Array.isArray(list) || list.length > 1000) return ack?.({ ok: false, error: 'Batch must be an array of at most 1000 fixes' });
      if (!bus.routeId) return ack?.({ ok: false, error: 'No route assigned to this bus' });
      metrics.batches += 1;
      const recvTs = Date.now();
      const counts = { accepted: 0, duplicate: 0, rejected: 0 };
      const sorted = [...list].sort((a, b) => Number(a?.ts) - Number(b?.ts));
      for (let i = 0; i < sorted.length; i += 1) {
        const result = await handleFix(bus, sorted[i], { buffered: true, broadcast: i === sorted.length - 1, recvTs }); // eslint-disable-line no-await-in-loop
        counts[result === 'accepted' || result === 'duplicate' ? result : 'rejected'] += 1;
      }
      return ack?.({ ok: true, ...counts, lastTs: sorted.length ? Number(sorted[sorted.length - 1]?.ts) : null });
    });

    socket.on('disconnect', () => {
      if (bus.socketId === socket.id) { bus.connected = false; bus.disconnectedAt = Date.now(); }
      // The cached fix expires on its own TTL, so a short network drop does not blink the bus off the map.
    });
  });

  // ── Read models for the admin dashboard ─────────────────────────────────
  const stats = (list) => {
    if (!list.length) return { count: 0, avg: null, p95: null, max: null };
    const s = [...list].sort((a, b) => a - b);
    return { count: s.length, avg: Math.round(s.reduce((a, b) => a + b, 0) / s.length), p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1] };
  };

  return {
    invalidateRoute,
    handleFix, // exported for tests and the replay tools
    liveStatus: () => {
      // forget buses that disconnected more than 15 minutes ago
      buses.forEach((b, id) => { if (!b.connected && Date.now() - (b.lastSeen || b.connectedAt || 0) > 15 * 60 * 1000) buses.delete(id); });
      return [...buses.values()].map((b) => ({
      busId: b.busId, registration: b.registration, routeId: b.routeId, driverName: b.driverName || null,
      connected: !!b.connected, onDuty: !!b.onDuty, lastSeen: b.lastSeen || null,
      lat: b.lastFix?.lat ?? null, lng: b.lastFix?.lng ?? null, speed: b.lastFix?.speed ?? null,
      tripId: b.trip?.tripId || null,
      }));
    },
    metrics: () => ({
      uptimeSec: Math.round((Date.now() - metrics.startedAt) / 1000),
      store: store.kind,
      sockets: io.engine.clientsCount,
      fixes: { received: metrics.received, accepted: metrics.accepted, rejected: metrics.rejected, duplicates: metrics.duplicates, buffered: metrics.bufferedFixes, batches: metrics.batches, broadcasts: metrics.broadcasts },
      latencyMs: { deviceToServer: stats(metrics.ingestMs), serverProcessing: stats(metrics.processMs) },
    }),
    stop: () => clearInterval(flushTimer),
  };
}

module.exports = { createRealtime };
