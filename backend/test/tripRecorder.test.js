// Trip records with fake models: how trips start and end, and what the stored documents look like.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTripRecorder } = require('../lib/tripRecorder');
const { prepareRoute, computeEta } = require('../lib/eta');

const ROUTE = prepareRoute([[0, 0], [0.009, 0], [0.009, 0.009]], [{ name: 'S0', lat: 0, lng: 0 }, { name: 'S1', lat: 0.009, lng: 0 }, { name: 'S2', lat: 0.009, lng: 0.009 }]);
const T0 = 1_700_000_000_000;

function fakeModels() {
  const db = { created: [], updates: [], segments: [], etas: [] };
  return {
    db,
    models: {
      Trip: { create: async (d) => db.created.push(d), updateOne: async (q, u) => db.updates.push({ ...q, ...u }) },
      SegmentLog: { insertMany: async (d) => db.segments.push(...d) },
      EtaLog: { insertMany: async (d) => db.etas.push(...d) },
      GpsLog: { insertMany: async () => {} },
    },
  };
}

function setup() {
  const { db, models } = fakeModels();
  const historyFor = [];
  let n = 0;
  const rec = createTripRecorder({ models, onHistoryAdded: (id) => historyFor.push(id), makeTripId: () => `TRIP-${(n += 1)}` });
  const bus = { busId: 'BUS-1', routeId: 'RT-1' };
  const drive = async (lat, lng, speed, sec) => {
    const fix = { lat, lng, speed, ts: T0 + sec * 1000 };
    await rec.track(bus, ROUTE, computeEta(ROUTE, fix), fix);
  };
  return { rec, bus, db, drive, historyFor, done: () => rec.close() };
}

test('a trip driven to the final stop ends completed, and its route gets new history', async () => {
  const s = setup();
  await s.drive(0, 0, 10, 0);
  await s.drive(0.009, 0.001, 8, 130);
  await s.drive(0.009, 0.009, 0, 300);
  s.done();
  assert.deepEqual(s.db.created.map((t) => [t.tripId, t.startedAt.getTime()]), [['TRIP-1', T0]]);
  assert.deepEqual(s.db.updates, [{ tripId: 'TRIP-1', endedAt: new Date(T0 + 300000), completed: true }]);
  assert.equal(s.bus.trip, null);
  assert.deepEqual(s.historyFor, ['RT-1']);
  assert.ok(s.db.segments.length >= 1);
  assert.ok(s.db.segments.every((l) => l.at instanceof Date && l.tripId === 'TRIP-1'));
});

test('ETA logs store their times as Dates, and a missing baseline stays empty', async () => {
  const s = setup();
  await s.drive(0, 0, 10, 0);
  await s.drive(0.009, 0.001, 8, 130);
  s.done();
  assert.ok(s.db.etas.length >= 1);
  for (const log of s.db.etas) {
    for (const k of ['predictedAt', 'predictedArrival', 'actualArrival']) assert.ok(log[k] instanceof Date, k);
    assert.ok(log.baselineArrival === undefined || log.baselineArrival instanceof Date);
  }
});

test('a trip ended early (off duty, or a new trip from the start) is not completed', async () => {
  const s = setup();
  await s.drive(0, 0, 10, 0);
  await s.drive(0.009, 0.001, 8, 130); // into segment 1
  await s.drive(0.0005, 0, 8, 400); // back near the first stop: a new trip
  await s.rec.endTrip(s.bus, false, T0 + 500000); // then off duty
  await s.rec.endTrip(s.bus, false, T0 + 600000); // nothing left to end
  s.done();
  assert.deepEqual(s.db.created.map((t) => t.tripId), ['TRIP-1', 'TRIP-2']);
  assert.deepEqual(s.db.updates.map((u) => [u.tripId, u.completed, u.endedAt.getTime()]), [['TRIP-1', false, T0 + 400000], ['TRIP-2', false, T0 + 500000]]);
  assert.deepEqual(s.historyFor, []);
});
