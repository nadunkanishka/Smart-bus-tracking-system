// Real-time layer: Socket.IO wiring and the live state of each bus. Drivers send GPS fixes, lib/fixPipeline.js turns
// them into updates, and this file pushes those to the Socket.IO room of the bus's route and to the latest-fix cache.
const { readToken } = require('./lib/auth');
const { EVENTS, MAX_BATCH } = require('./lib/contract');
const { FORGET_BUS_MS } = require('./lib/limits');
const { createFixPipeline, OK_RESULTS } = require('./lib/fixPipeline');
const { createRouteCache } = require('./lib/routeCache');
const { createTripRecorder } = require('./lib/tripRecorder');
const { createMetrics, liveRow } = require('./lib/metrics');
const env = require('./config/env');

const room = (routeId) => `route:${routeId}`;
const leaveRouteRooms = (socket) => [...socket.rooms].filter((r) => r.startsWith('route:')).forEach((r) => socket.leave(r));
const NO_ROUTE = 'No route assigned to this bus';

// io: Socket.IO server. store: latest-fix cache (lib/store.js). The rest is injected by tests; index.js passes the
// shared routeCache so the REST routes drop the same cache.
function createRealtime(io, store, {
  routeCache = createRouteCache(),
  recorder = createTripRecorder({ onHistoryAdded: (routeId) => routeCache.invalidate(routeId) }),
  metrics = createMetrics(),
  smoothing = env.GPS_SMOOTHING,
} = {}) {
  const buses = new Map(); // busId -> live state for this process

  const pipeline = createFixPipeline({
    getRoute: (routeId) => routeCache.get(routeId),
    track: recorder.track,
    recordFix: recorder.recordFix,
    publish(bus, payload) {
      io.to(room(bus.routeId)).emit(EVENTS.UPDATE, payload);
      // A cache failure must not stop live updates: passengers already subscribed still get the push above.
      store.setLast(bus.busId, payload).catch((err) => console.error('[store] write failed:', err.message));
    },
    metrics,
    smoothing,
  });

  // The bus leaves its route's map: its trip ends, its position is forgotten (the next duty period starts fresh, with
  // no comparison against this one's last fix) and the route's passengers are told. They are told even when ending
  // the trip or clearing the cache fails; the failure is then reported to the caller.
  async function takeOffMap(bus) {
    const routeId = bus.routeId;
    const ending = recorder.endTrip(bus, false, Date.now());
    Object.assign(bus, { onDuty: false, lastFix: null, smooth: null, distAlong: undefined, nextStopIndex: undefined });
    const results = await Promise.allSettled([ending, store.remove(bus.busId)]);
    io.to(room(routeId)).emit(EVENTS.OFFLINE, { busId: bus.busId });
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) throw failed.reason;
  }

  // A failing handler (database or cache down) is logged and reported to the client instead of crashing the server.
  const safe = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error('[socket]', err.message);
      const ack = args[args.length - 1];
      if (typeof ack === 'function') ack({ ok: false, error: 'Server error' });
    }
  };

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    socket.data.user = token ? readToken(token) : null;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    // Passengers: one route room at a time, snapshot served from the cache.
    socket.on(EVENTS.SUBSCRIBE, safe(async ({ routeId } = {}, ack) => {
      if (typeof routeId !== 'string' || !routeId) return ack?.({ ok: false, error: 'routeId is required' });
      leaveRouteRooms(socket);
      socket.join(room(routeId));
      const snapshot = await store.byRoute(routeId);
      socket.emit(EVENTS.SNAPSHOT, { routeId, buses: snapshot, serverTs: Date.now() });
      return ack?.({ ok: true, buses: snapshot.length });
    }));
    socket.on(EVENTS.UNSUBSCRIBE, () => leaveRouteRooms(socket));

    // Drivers authenticate with the handshake token, or afterwards with driver:auth (used by the load tests).
    if (user?.role === 'driver') attachDriver(socket, user);
    else {
      socket.once(EVENTS.AUTH, ({ token } = {}, ack) => {
        const claims = token ? readToken(token) : null;
        if (claims?.role !== 'driver') return ack?.({ ok: false, error: 'Invalid driver token' });
        attachDriver(socket, claims);
        return ack?.({ ok: true });
      });
    }
  });

  function attachDriver(socket, claims) {
    // One live state per bus; a reconnect re-attaches to it so trip history survives network drops.
    let bus = buses.get(claims.busId);
    if (!bus) {
      bus = { busId: claims.busId, routeId: claims.routeId, onDuty: false, ready: Promise.resolve() };
      buses.set(claims.busId, bus);
    } else if (bus.routeId !== claims.routeId) {
      // The bus was moved to another route since its last token: it leaves the old route first, and its events wait
      // for that, so nothing more is published to the old room.
      bus.ready = takeOffMap(bus).catch((err) => console.error('[socket] leaving the old route failed:', err.message));
    }
    Object.assign(bus, {
      routeId: claims.routeId, registration: claims.registration, driverName: claims.driverName,
      socketId: socket.id, connected: true, connectedAt: Date.now(),
    });

    // Every driver event needs a route, and runs after a pending route change has finished.
    const driverEvent = (fn) => safe(async (payload, ack) => {
      if (!bus.routeId) return ack?.({ ok: false, error: NO_ROUTE });
      await bus.ready;
      return fn(payload, ack);
    });

    socket.on(EVENTS.DUTY, driverEvent(async ({ onDuty } = {}, ack) => {
      if (onDuty) { bus.onDuty = true; bus.lastSeen = Date.now(); } else await takeOffMap(bus);
      ack?.({ ok: true, onDuty: bus.onDuty });
    }));

    socket.on(EVENTS.FIX, driverEvent(async (raw, ack) => {
      bus.onDuty = true;
      const result = await pipeline.handleFix(bus, raw);
      return ack?.({ ok: OK_RESULTS.has(result), result, ts: raw?.ts, nextStopIndex: bus.nextStopIndex ?? null });
    }));

    const batch = driverEvent(async (list, ack) => ack?.({ ok: true, ...(await pipeline.handleBatch(bus, list)) }));
    socket.on(EVENTS.BATCH, (list, ack) => {
      if (!Array.isArray(list) || list.length > MAX_BATCH) return ack?.({ ok: false, error: `Batch must be an array of at most ${MAX_BATCH} fixes` });
      return batch(list, ack);
    });

    socket.on('disconnect', () => {
      if (bus.socketId === socket.id) { bus.connected = false; bus.disconnectedAt = Date.now(); }
      // The cached fix expires on its own TTL, so a short network drop does not blink the bus off the map.
    });
  }

  return {
    liveStatus: () => {
      buses.forEach((b, id) => { if (!b.connected && Date.now() - (b.lastSeen || b.connectedAt || 0) > FORGET_BUS_MS) buses.delete(id); });
      return [...buses.values()].map(liveRow);
    },
    metrics: () => metrics.snapshot({ store: store.kind, sockets: io.engine.clientsCount }),
  };
}

module.exports = { createRealtime };
