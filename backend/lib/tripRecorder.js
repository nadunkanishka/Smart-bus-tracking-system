// Everything the live pipeline writes to MongoDB: trips, segment logs (the ETA history), ETA logs (the accuracy
// evaluation) and the GPS log. lib/tripTracker.js decides what happened (pure, times in epoch ms); this file turns
// that into documents. Epoch ms become Dates here and nowhere else.
const crypto = require('crypto');
const { startTrip, advance } = require('./tripTracker');
const { toPoint } = require('./geo');
const { BACK_AT_START_M, GPS_FLUSH_MS } = require('./limits');

const toDate = (ms) => (ms == null ? undefined : new Date(ms));
const ETA_DATE_FIELDS = ['predictedAt', 'predictedArrival', 'actualArrival', 'baselineArrival'];
const etaLogDoc = (base, log) => ({ ...base, ...log, ...Object.fromEntries(ETA_DATE_FIELDS.map((k) => [k, toDate(log[k])])) });

const newTripId = () => `TRIP-${crypto.randomUUID().slice(0, 8)}`;

// models: { Trip, SegmentLog, EtaLog, GpsLog } (injected so tests run without MongoDB).
// onHistoryAdded(routeId): called when a finished trip added segment history for its route.
const mongoModels = () => ({
  Trip: require('../models/Trip'),
  SegmentLog: require('../models/SegmentLog'),
  EtaLog: require('../models/EtaLog'),
  GpsLog: require('../models/GpsLog'),
});

function createTripRecorder({ models = mongoModels(), onHistoryAdded = () => {}, flushMs = GPS_FLUSH_MS, makeTripId = newTripId } = {}) {
  const { Trip, SegmentLog, EtaLog, GpsLog } = models;

  // The one way a trip ends. completed: the bus reached the final stop (false: off duty, a new trip, a route change).
  async function endTrip(bus, completed, ts) {
    const trip = bus.trip;
    if (!trip) return;
    bus.trip = null;
    await Trip.updateOne({ tripId: trip.tripId }, { endedAt: toDate(ts), completed });
  }

  // Trip history for one fix that the ETA engine placed on the route: starts, advances and ends trips.
  async function track(bus, route, eta, fix) {
    // A bus waiting at the final stop after finishing is not on a trip until it is back near the start.
    if (!bus.trip && eta.finished) return;
    if (!bus.trip || (eta.segIndex < bus.trip.segIndex && eta.distAlong < BACK_AT_START_M)) {
      await endTrip(bus, false, fix.ts);
      bus.trip = startTrip(route, eta, fix, makeTripId());
      await Trip.create({ tripId: bus.trip.tripId, busId: bus.busId, routeId: bus.routeId, startedAt: toDate(fix.ts) });
      return;
    }
    const res = advance(bus.trip, route, eta, fix);
    const base = { routeId: bus.routeId, tripId: bus.trip.tripId, busId: bus.busId };
    if (res.segmentLogs.length) await SegmentLog.insertMany(res.segmentLogs.map((l) => ({ ...base, ...l, at: toDate(fix.ts) })));
    if (res.etaLogs.length) await EtaLog.insertMany(res.etaLogs.map((l) => etaLogDoc(base, l)));
    if (res.ended) {
      await endTrip(bus, true, fix.ts);
      onHistoryAdded(bus.routeId); // the next trip on this route uses the history this one just added
    }
  }

  // Accepted fixes are buffered and written in batches, off the live path.
  let gpsBuffer = [];
  function recordFix(bus, fix, used, fromOfflineQueue) {
    gpsBuffer.push({
      busId: bus.busId, routeId: bus.routeId, tripId: bus.trip?.tripId,
      location: toPoint(fix.lat, fix.lng), // as the phone reported it
      smoothed: toPoint(used.lat, used.lng), // what the ETA engine and passengers used
      accuracy: fix.accuracy,
      speed: fix.speed, heading: fix.heading, deviceTs: toDate(fix.ts), buffered: fromOfflineQueue,
    });
  }
  async function flush() {
    if (!gpsBuffer.length) return;
    const docs = gpsBuffer;
    gpsBuffer = [];
    try { await GpsLog.insertMany(docs, { ordered: false }); } catch (err) { console.error('[gps] log write failed:', err.message); }
  }
  const timer = setInterval(flush, flushMs);
  timer.unref();

  return { track, endTrip, recordFix, flush, close: () => clearInterval(timer) };
}

module.exports = { createTripRecorder };
