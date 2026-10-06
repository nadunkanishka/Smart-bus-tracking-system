const test = require('node:test');
const assert = require('node:assert/strict');
const { haversine, cumulativeDistances, projectOntoLine } = require('../lib/geo');
const { prepareRoute, computeEta, DEFAULTS } = require('../lib/eta');
const { validateFix } = require('../lib/validate');
const { startTrip, advance } = require('../lib/tripTracker');
const { memoryStore } = require('../lib/store');
const { hashPassword, verifyPassword, signToken, readToken } = require('../lib/auth');

// Fixture: an L-shaped route. 0.009 deg of latitude is ~1000.8 m, so each leg is ~1 km.
//   A(0,0) --north 1 km--> B(0.009,0) --east 1 km--> C(0.009,0.009)
// Stops: S0 at A, S1 at B (the corner), S2 at C.
const LINE = [[0, 0], [0.009, 0], [0.009, 0.009]];
const STOPS = [{ name: 'S0', lat: 0, lng: 0 }, { name: 'S1', lat: 0.009, lng: 0 }, { name: 'S2', lat: 0.009, lng: 0.009 }];
const LEG = haversine(LINE[0], LINE[1]);
const near = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg || ''} expected ~${expected}, got ${actual}`);

test('haversine and cumulative distance match the known leg length', () => {
  near(LEG, 1000.8, 1);
  const cum = cumulativeDistances(LINE);
  near(cum[2], 2 * LEG, 2);
});

test('(a) a fix beside the road is projected onto the nearest point of the polyline', () => {
  const cum = cumulativeDistances(LINE);
  // halfway up the first leg, ~55 m east of the road
  const p = projectOntoLine(LINE, cum, [0.0045, 0.0005]);
  near(p.distAlong, LEG / 2, 2, 'distance along');
  near(p.offRoute, 55.6, 2, 'distance off the road');
  near(p.point[1], 0, 1e-9, 'snapped longitude');
});

test('(b) the active segment and remaining distance follow the road, not the straight line', () => {
  const route = prepareRoute(LINE, STOPS);
  const eta = computeEta(route, { lat: 0.0045, lng: 0, speed: 10 });
  assert.equal(eta.segIndex, 0);
  near(eta.remainingInSegment, LEG / 2, 2);
  // Straight-line (Haversine) distance from this point to S2 is ~1119 m; the road distance is ~1501 m.
  const crow = haversine([0.0045, 0], [0.009, 0.009]);
  const road = eta.remainingInSegment + route.segments[1].length;
  assert.ok(road - crow > 350, 'road distance must exceed the straight-line distance around the corner');
});

test('(c)+(d) ETA = current segment at live speed + history and dwell for later segments', () => {
  const history = { 0: { traversalSec: 200, dwellSec: 30, samples: 5 }, 1: { traversalSec: 240, dwellSec: 45, samples: 5 } };
  const route = prepareRoute(LINE, STOPS, history);
  const eta = computeEta(route, { lat: 0.0045, lng: 0, speed: 10 }); // 500 m left at 10 m/s = 50 s
  const [s0, s1, s2] = eta.stops;
  assert.equal(s0.status, 'passed');
  near(s1.etaSec, 50, 1, 'next stop');
  // S2 = 50 s + dwell at S1 (30 s, history of segment 0) + traversal of segment 1 (240 s)
  near(s2.etaSec, 320, 1, 'downstream stop');
  assert.equal(s2.etaMin, 5);
});

test('a stopped bus falls back to the segment usual speed instead of dividing by zero', () => {
  const route = prepareRoute(LINE, STOPS, { 0: { traversalSec: 200, dwellSec: 30, samples: 3 } });
  const eta = computeEta(route, { lat: 0.0045, lng: 0, speed: 0 });
  near(eta.stops[1].etaSec, 100, 1); // half of the usual 200 s
  assert.ok(Number.isFinite(eta.stops[2].etaSec));
});

test('without history the engine uses the default speed and dwell', () => {
  const route = prepareRoute(LINE, STOPS);
  assert.equal(route.segments[0].samples, 0);
  near(route.segments[0].traversalSec, LEG / DEFAULTS.speedMps, 0.5);
  const eta = computeEta(route, { lat: 0, lng: 0, speed: DEFAULTS.speedMps });
  near(eta.stops[2].etaSec, (2 * LEG) / DEFAULTS.speedMps + DEFAULTS.dwellSec, 2);
});

test('stops behind the bus are marked passed and the end of the route finishes the trip', () => {
  const route = prepareRoute(LINE, STOPS);
  const mid = computeEta(route, { lat: 0.009, lng: 0.004, speed: 8 });
  assert.deepEqual(mid.stops.map((s) => s.status), ['passed', 'passed', 'upcoming']);
  assert.equal(mid.segIndex, 1);
  const end = computeEta(route, { lat: 0.009, lng: 0.009, speed: 0 });
  assert.equal(end.finished, true);
  assert.ok(end.stops.every((s) => s.status === 'passed'));
});

test('a bus that stops just short of the final stop still finishes the trip', () => {
  const route = prepareRoute(LINE, STOPS);
  const eta = computeEta(route, { lat: 0.009, lng: 0.0088, speed: 0 }); // ~22 m before S2
  assert.equal(eta.finished, true);
});

test('a trip that starts a little past the first stop still counts as a full first segment', () => {
  const route = prepareRoute(LINE, STOPS);
  const fix = { lat: 0.0009, lng: 0, speed: 8, ts: 1000 }; // ~100 m after S0
  assert.equal(startTrip(route, computeEta(route, fix), fix, 'TRIP-3').partial, false);
});

test('prepareRoute rejects routes that cannot be segmented', () => {
  assert.throws(() => prepareRoute([[0, 0]], STOPS));
  assert.throws(() => prepareRoute(LINE, [STOPS[0]]));
});

test('GPS validation: ranges, timestamps and unknown speed', () => {
  const now = 1_700_000_000_000;
  assert.equal(validateFix({ lat: 6.9, lng: 79.8, speed: 8, heading: 90, ts: now }, now).ok, true);
  assert.equal(validateFix({ lat: 91, lng: 79.8, ts: now }, now).ok, false);
  assert.equal(validateFix({ lat: 6.9, lng: 181, ts: now }, now).ok, false);
  assert.equal(validateFix({ lat: 6.9, lng: 79.8 }, now).ok, false, 'timestamp is required');
  assert.equal(validateFix({ lat: 6.9, lng: 79.8, ts: now + 5 * 60 * 1000 }, now).ok, false, 'future timestamp');
  assert.equal(validateFix({ lat: 6.9, lng: 79.8, ts: now - 2 * 86400000 }, now).ok, false, 'stale timestamp');
  assert.equal(validateFix({ lat: 6.9, lng: 79.8, speed: 200, ts: now }, now).ok, false, 'impossible speed');
  assert.equal(validateFix({ lat: 6.9, lng: 79.8, speed: -1, ts: now }, now).fix.speed, 0, 'unknown speed becomes 0');
  assert.equal(validateFix(null, now).ok, false);
});

test('trip tracker logs segment traversal, dwell and predicted-vs-actual arrival', () => {
  const route = prepareRoute(LINE, STOPS);
  const t0 = 1_700_000_000_000;
  const at = (lat, lng, speed, sec) => {
    const fix = { lat, lng, speed, ts: t0 + sec * 1000 };
    return { fix, eta: computeEta(route, fix) };
  };

  let step = at(0, 0, 10, 0);
  const state = startTrip(route, step.eta, step.fix, 'TRIP-1');
  assert.equal(state.partial, false);
  const predictedS1 = state.predictions.find((p) => p.stopIndex === 1).predictedArrival;

  step = at(0.0045, 0, 10, 50); // mid-segment, moving
  assert.equal(advance(state, route, step.eta, step.fix).segmentLogs.length, 0);
  step = at(0.00885, 0, 0, 100); // stopped ~17 m before S1
  advance(state, route, step.eta, step.fix);
  step = at(0.00885, 0, 0, 120); // still stopped: 20 s of dwell
  advance(state, route, step.eta, step.fix);
  step = at(0.009, 0.001, 8, 130); // past S1, now in segment 1
  const res = advance(state, route, step.eta, step.fix);

  assert.deepEqual(res.segmentLogs, [{ segIndex: 0, traversalSec: 110, dwellSec: 20 }]);
  const log = res.etaLogs.find((l) => l.stopIndex === 1);
  assert.equal(log.actualArrival, t0 + 130000);
  assert.equal(log.errorSec, Math.round((predictedS1 - (t0 + 130000)) / 1000));
  assert.equal(res.ended, false);

  step = at(0.009, 0.009, 0, 300);
  const end = advance(state, route, step.eta, step.fix);
  assert.equal(end.ended, true);
  assert.equal(end.segmentLogs[0].segIndex, 1);
  assert.ok(end.etaLogs.length >= 2, 'S2 was predicted at the start and again when leaving S1');
});

test('a bus that joins mid-segment does not produce a partial traversal sample', () => {
  const route = prepareRoute(LINE, STOPS);
  const fix = { lat: 0.0045, lng: 0, speed: 10, ts: 1000 };
  const state = startTrip(route, computeEta(route, fix), fix, 'TRIP-2');
  assert.equal(state.partial, true);
  const next = { lat: 0.009, lng: 0.001, speed: 10, ts: 61000 };
  assert.equal(advance(state, route, computeEta(route, next), next).segmentLogs.length, 0);
});

test('latest-fix store keeps one entry per bus and reads by route', async () => {
  const store = memoryStore();
  await store.setLast('BUS-1', { busId: 'BUS-1', routeId: 'RT-1', lat: 1 });
  await store.setLast('BUS-1', { busId: 'BUS-1', routeId: 'RT-1', lat: 2 });
  await store.setLast('BUS-2', { busId: 'BUS-2', routeId: 'RT-2', lat: 3 });
  assert.deepEqual((await store.byRoute('RT-1')).map((b) => b.lat), [2]);
  assert.equal((await store.all()).length, 2);
  await store.remove('BUS-1');
  assert.equal((await store.byRoute('RT-1')).length, 0);
});

test('passwords are hashed, legacy plaintext still verifies, tokens round-trip', () => {
  const hash = hashPassword('secret1');
  assert.notEqual(hash, 'secret1');
  assert.equal(verifyPassword('secret1', hash), true);
  assert.equal(verifyPassword('wrong', hash), false);
  assert.equal(verifyPassword('1234', '1234'), true, 'legacy plaintext record');
  assert.equal(verifyPassword('x', ''), false);
  assert.equal(readToken(signToken({ role: 'driver', busId: 'BUS-1' })).busId, 'BUS-1');
  assert.equal(readToken('not-a-token'), null);
});
