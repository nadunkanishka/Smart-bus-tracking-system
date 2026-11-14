// One GPS fix through the checks, the smoother and the ETA engine, for one bus's live state.
// No sockets and no MongoDB here: the caller injects where routes come from, where history and logs go, and how an
// update reaches passengers, so the whole decision chain is tested in memory.
//
// For each fix: validate -> drop duplicates and out-of-order fixes -> drop fixes that come too fast -> drop position
// jumps -> smooth -> ETA and trip history -> GPS log -> broadcast if it is still live. The result is 'accepted',
// 'duplicate', 'too frequent', 'position jump' or the validation error.
const { validateFix } = require('./validate');
const { haversine } = require('./geo');
const { computeEta } = require('./eta');
const { smoothFix, SMOOTHING } = require('./smooth');
const { LIVE_WINDOW_MS, MAX_SPEED_MPS } = require('./contract');
const { MIN_FIX_GAP_MS, JUMP_FACTOR } = require('./limits');

const OK_RESULTS = new Set(['accepted', 'duplicate']); // what the driver app may drop from its queue

// deps:
//   getRoute(routeId)               prepared route or null (no geometry: positions are still shown, without ETA)
//   track(bus, route, eta, fix)     trip history (lib/tripRecorder.js)
//   recordFix(bus, raw, used, fromOfflineQueue)  GPS log
//   publish(bus, payload)           send the update to the route's passengers and the latest-fix cache
//   metrics                         lib/metrics.js
//   smoothing                       true: passengers and the ETA engine see the smoothed point
function createFixPipeline({ getRoute, track, recordFix, publish, metrics, smoothing = true, now = Date.now }) {
  // How the fix arrived:
  //   receivedAt        server time the message arrived (a whole batch shares one)
  //   fromOfflineQueue  replayed by the phone after a signal loss: not rate-limited, logged as buffered, not a latency sample
  //   mayBroadcast      false for all but the newest fix of a batch, so passengers never watch the bus replay its backlog
  async function handleFix(bus, raw, { receivedAt = now(), fromOfflineQueue = false, mayBroadcast = true } = {}) {
    metrics.count('received');
    const v = validateFix(raw, receivedAt);
    if (!v.ok) { metrics.count('rejected'); return v.error; }
    const fix = v.fix;

    // Only strictly newer device timestamps move the bus.
    const last = bus.lastFix;
    if (last && fix.ts <= last.ts) { metrics.count('duplicates'); return 'duplicate'; }
    if (last) {
      const gapMs = fix.ts - last.ts;
      if (!fromOfflineQueue && gapMs < MIN_FIX_GAP_MS) { metrics.count('rejected'); return 'too frequent'; }
      if (haversine([last.lat, last.lng], [fix.lat, fix.lng]) / (gapMs / 1000) > MAX_SPEED_MPS * JUMP_FACTOR) {
        metrics.count('rejected');
        return 'position jump';
      }
    }
    metrics.accepted(receivedAt, fromOfflineQueue);
    bus.lastFix = fix;
    bus.lastSeen = receivedAt;

    // The raw fix is kept (jump checks, GpsLog.location); everything downstream (ETA, passengers) uses `used`.
    let used = fix;
    if (smoothing) {
      const sm = smoothFix(bus.smooth, fix, SMOOTHING);
      bus.smooth = sm.state;
      used = { ...fix, lat: sm.lat, lng: sm.lng };
    } else {
      bus.smooth = null;
    }

    const route = await getRoute(bus.routeId);
    let eta = null;
    if (route) {
      eta = computeEta(route, used, bus.distAlong);
      bus.distAlong = eta.distAlong;
      bus.nextStopIndex = Math.min(eta.segIndex + 1, route.stops.length - 1);
      await track(bus, route, eta, used);
    }
    recordFix(bus, fix, used, fromOfflineQueue);

    // A fix older than the live window is history: logged and used for trips, never shown as the current position.
    if (receivedAt - fix.ts > LIVE_WINDOW_MS || !mayBroadcast) return 'accepted';

    const payload = {
      busId: bus.busId,
      registration: bus.registration,
      driverName: bus.driverName || null,
      routeId: bus.routeId,
      lat: used.lat, lng: used.lng, speed: fix.speed, heading: fix.heading,
      deviceTs: fix.ts,
      buffered: fromOfflineQueue,
      serverRecvTs: receivedAt,
      serverEmitTs: now(),
      segIndex: eta ? eta.segIndex : null,
      offRouteM: eta ? Math.round(eta.offRoute) : null,
      finished: eta ? eta.finished : false,
      stops: eta ? eta.stops : [],
    };
    publish(bus, payload);
    metrics.count('broadcasts');
    if (!fromOfflineQueue) metrics.latency(receivedAt - fix.ts, payload.serverEmitTs - receivedAt);
    return 'accepted';
  }

  // An offline-queue flush. Fixes are replayed oldest first so trip history stays correct; a fix without a usable
  // timestamp cannot be placed in that order and is rejected. Duplicates (a batch re-sent because its ack was lost)
  // are dropped by the timestamp check. Returns { accepted, duplicate, rejected, lastTs }.
  async function handleBatch(bus, list, receivedAt = now()) {
    metrics.count('batches');
    const counts = { accepted: 0, duplicate: 0, rejected: 0 };
    const usable = list.filter((f) => Number.isFinite(Number(f?.ts)));
    const unusable = list.length - usable.length;
    metrics.count('received', unusable);
    metrics.count('rejected', unusable);
    counts.rejected += unusable;

    const ordered = usable.sort((a, b) => Number(a.ts) - Number(b.ts));
    for (let i = 0; i < ordered.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await handleFix(bus, ordered[i], { receivedAt, fromOfflineQueue: true, mayBroadcast: i === ordered.length - 1 });
      counts[OK_RESULTS.has(result) ? result : 'rejected'] += 1;
    }
    return { ...counts, lastTs: ordered.length ? Number(ordered[ordered.length - 1].ts) : null };
  }

  return { handleFix, handleBatch };
}

module.exports = { createFixPipeline, OK_RESULTS };
