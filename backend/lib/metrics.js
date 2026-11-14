// Counters, latency samples and the read models the admin dashboard polls (/api/metrics, /api/live).
const { createRate } = require('./rate');
const { percentile, average } = require('./stats');

const MAX_SAMPLES = 5000; // latest latency samples kept per series
const RATE_MINUTES = 12; // minutes of history in the positions-per-minute chart

const latencyStats = (list) => {
  if (!list.length) return { count: 0, avg: null, p95: null, max: null };
  const s = [...list].sort((a, b) => a - b);
  return { count: s.length, avg: average(s), p95: percentile(s, 0.95), max: s[s.length - 1] };
};

function createMetrics({ now = Date.now } = {}) {
  const startedAt = now();
  const counts = { received: 0, accepted: 0, rejected: 0, duplicates: 0, batches: 0, bufferedFixes: 0, broadcasts: 0 };
  const ingestMs = []; // device timestamp -> server receive (includes device clock skew)
  const processMs = []; // server receive -> emitted to the route room
  const fixRate = createRate(); // accepted positions per minute
  const sample = (list, v) => { list.push(v); if (list.length > MAX_SAMPLES) list.shift(); };

  return {
    count(name, n = 1) { counts[name] += n; },
    accepted(receivedAt, fromOfflineQueue) {
      counts.accepted += 1;
      fixRate.hit(receivedAt);
      if (fromOfflineQueue) counts.bufferedFixes += 1;
    },
    // A negative delay means the phone's clock is ahead of the server's: it says nothing about the network, so it is
    // left out instead of pulling the average down.
    latency(ingest, processing) {
      if (ingest >= 0) sample(ingestMs, ingest);
      if (processing >= 0) sample(processMs, processing);
    },
    snapshot({ store, sockets }) {
      return {
        uptimeSec: Math.round((now() - startedAt) / 1000),
        store,
        sockets,
        fixesPerMinute: fixRate.series(now(), RATE_MINUTES),
        fixes: { received: counts.received, accepted: counts.accepted, rejected: counts.rejected, duplicates: counts.duplicates, buffered: counts.bufferedFixes, batches: counts.batches, broadcasts: counts.broadcasts },
        latencyMs: { deviceToServer: latencyStats(ingestMs), serverProcessing: latencyStats(processMs) },
      };
    },
  };
}

// One row of the admin's live list.
const liveRow = (b) => ({
  busId: b.busId, registration: b.registration, routeId: b.routeId, driverName: b.driverName || null,
  connected: !!b.connected, onDuty: !!b.onDuty, lastSeen: b.lastSeen || null,
  lat: b.lastFix?.lat ?? null, lng: b.lastFix?.lng ?? null, speed: b.lastFix?.speed ?? null,
  tripId: b.trip?.tripId || null,
});

module.exports = { createMetrics, liveRow, latencyStats };
