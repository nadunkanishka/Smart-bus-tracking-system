// The fix pipeline, in memory: what each kind of fix does to the bus, what passengers are sent, what is logged.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createFixPipeline } = require('../lib/fixPipeline');
const { createMetrics } = require('../lib/metrics');
const { prepareRoute } = require('../lib/eta');
const { offset } = require('../lib/geo');

// An L-shaped route about 2 km long: S0 (0,0) north to S1, then east to S2.
const ROUTE = prepareRoute([[0, 0], [0.009, 0], [0.009, 0.009]], [{ name: 'S0', lat: 0, lng: 0 }, { name: 'S1', lat: 0.009, lng: 0 }, { name: 'S2', lat: 0.009, lng: 0.009 }]);
const T0 = 1_700_000_000_000;
// A fix `north` metres up the first leg at time T0 + sec.
const at = (sec, north, extra = {}) => {
  const [lat, lng] = offset(0, 0, 0, north);
  return { lat, lng, speed: 10, heading: 0, accuracy: 5, ts: T0 + sec * 1000, ...extra };
};

function setup({ smoothing = false } = {}) {
  const published = [];
  const logged = [];
  const tracked = [];
  const metrics = createMetrics({ now: () => T0 });
  const pipeline = createFixPipeline({
    getRoute: async () => ROUTE,
    track: async (bus, route, eta) => { tracked.push(eta.segIndex); },
    recordFix: (bus, raw, used, fromOfflineQueue) => logged.push({ raw, used, fromOfflineQueue }),
    publish: (bus, payload) => published.push(payload),
    metrics,
    smoothing,
    now: () => T0,
  });
  const bus = { busId: 'BUS-1', registration: 'NB-1', routeId: 'RT-1' };
  // a live fix arrives as it is captured
  const live = (fix) => pipeline.handleFix(bus, fix, { receivedAt: fix.ts });
  return { pipeline, bus, live, published, logged, tracked, fixes: () => metrics.snapshot({}).fixes, metrics };
}

test('ordered live fixes are accepted, move the bus along the route and reach passengers', async () => {
  const s = setup();
  for (const [sec, north] of [[0, 100], [3, 130], [6, 160]]) assert.equal(await s.live(at(sec, north)), 'accepted');
  assert.deepEqual(s.published.map((p) => p.deviceTs), [T0, T0 + 3000, T0 + 6000]);
  const last = s.published[2];
  assert.equal(last.segIndex, 0);
  assert.deepEqual(last.stops.map((x) => x.status), ['passed', 'upcoming', 'upcoming']);
  assert.equal(last.buffered, false);
  assert.equal(s.bus.nextStopIndex, 1);
  assert.equal(s.tracked.length, 3);
  assert.deepEqual(s.fixes(), { received: 3, accepted: 3, rejected: 0, duplicates: 0, buffered: 0, batches: 0, broadcasts: 3 });
});

test('a repeated fix is a duplicate and changes nothing', async () => {
  const s = setup();
  await s.live(at(0, 100));
  assert.equal(await s.live(at(0, 100)), 'duplicate');
  assert.equal(s.published.length, 1);
  assert.equal(s.logged.length, 1);
  assert.equal(s.fixes().duplicates, 1);
});

test('an out-of-order fix does not move the bus back', async () => {
  const s = setup();
  await s.live(at(6, 160));
  assert.equal(await s.live(at(3, 130)), 'duplicate');
  assert.equal(s.bus.lastFix.ts, T0 + 6000);
  assert.equal(s.published.length, 1);
});

test('a live fix sent too soon after the last one is dropped, a replayed one is not', async () => {
  const s = setup();
  await s.live(at(0, 100));
  assert.equal(await s.live(at(0.5, 105)), 'too frequent');
  const replay = setup();
  await replay.pipeline.handleFix(replay.bus, at(0, 100), { receivedAt: T0 });
  assert.equal(await replay.pipeline.handleFix(replay.bus, at(0.5, 105), { receivedAt: T0 + 500, fromOfflineQueue: true }), 'accepted');
});

test('a position that implies an impossible speed is a jump and is dropped', async () => {
  const s = setup();
  await s.live(at(0, 100));
  assert.equal(await s.live(at(3, 1100)), 'position jump'); // 1 km in 3 s
  assert.equal(s.bus.lastFix.ts, T0);
  assert.equal(s.fixes().rejected, 1);
});

test('a fix older than the live window is accepted for history but not shown to passengers', async () => {
  const s = setup();
  const old = at(0, 100);
  assert.equal(await s.pipeline.handleFix(s.bus, old, { receivedAt: old.ts + 60_000 }), 'accepted');
  assert.equal(s.published.length, 0);
  assert.equal(s.logged.length, 1);
});

test('a batch is replayed oldest first, shows only its newest fix, and rejects a fix without a usable timestamp', async () => {
  const s = setup();
  const batch = [at(6, 160), { lat: 0.001, lng: 0, ts: 'garbage' }, at(0, 100), at(3, 130), { lat: 0.001, lng: 0 }];
  const res = await s.pipeline.handleBatch(s.bus, batch, T0 + 7000);
  assert.deepEqual(res, { accepted: 3, duplicate: 0, rejected: 2, lastTs: T0 + 6000 });
  assert.deepEqual(s.published.map((p) => [p.deviceTs, p.buffered]), [[T0 + 6000, true]]);
  assert.deepEqual(s.logged.map((l) => l.raw.ts), [T0, T0 + 3000, T0 + 6000]);
  assert.ok(s.logged.every((l) => l.fromOfflineQueue));
  const f = s.fixes();
  assert.equal(f.received, 5);
  assert.equal(f.rejected, 2);
  assert.equal(f.buffered, 3);
  assert.equal(f.batches, 1);
});

test('a batch re-sent after a lost ack only counts duplicates', async () => {
  const s = setup();
  const batch = [at(0, 100), at(3, 130)];
  await s.pipeline.handleBatch(s.bus, batch, T0 + 4000);
  assert.deepEqual(await s.pipeline.handleBatch(s.bus, batch, T0 + 5000), { accepted: 0, duplicate: 2, rejected: 0, lastTs: T0 + 3000 });
});

test('smoothing off: passengers get the fix as reported', async () => {
  const s = setup({ smoothing: false });
  const fixes = [at(0, 100), at(3, 130, { lng: 0.0002 }), at(6, 160)];
  for (const f of fixes) await s.live(f); // eslint-disable-line no-await-in-loop
  assert.deepEqual(s.published.map((p) => [p.lat, p.lng]), fixes.map((f) => [f.lat, f.lng]));
});

test('smoothing on: passengers get the smoothed point, the log keeps the raw fix beside it', async () => {
  const s = setup({ smoothing: true });
  const spike = at(6, 160, { lng: 0.0003, accuracy: 15 }); // ~33 m off the road
  for (const f of [at(0, 100, { accuracy: 15 }), at(3, 130, { accuracy: 15 }), spike]) await s.live(f); // eslint-disable-line no-await-in-loop
  const shown = s.published[2];
  assert.ok(Math.abs(shown.lng) < Math.abs(spike.lng), 'the shown point is pulled back towards the road');
  assert.deepEqual([s.logged[2].raw.lat, s.logged[2].raw.lng], [spike.lat, spike.lng]);
  assert.deepEqual([s.logged[2].used.lat, s.logged[2].used.lng], [shown.lat, shown.lng]);
});

test('a phone clock running ahead of the server does not produce a latency sample', async () => {
  const s = setup();
  const ahead = at(0, 100);
  await s.pipeline.handleFix(s.bus, ahead, { receivedAt: ahead.ts - 30_000 }); // device 30 s ahead (within the allowed drift)
  assert.equal(s.published.length, 1);
  assert.equal(s.metrics.snapshot({}).latencyMs.deviceToServer.count, 0);
});
