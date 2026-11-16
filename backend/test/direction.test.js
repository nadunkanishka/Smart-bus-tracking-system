// A route is run in both directions: a bus starts on the leg of its nearer terminal, flips at each terminal, and
// passengers at the far end see it coming before it turns round.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createFixPipeline } = require('../lib/fixPipeline');
const { createRouteCache } = require('../lib/routeCache');
const { createMetrics } = require('../lib/metrics');
const { prepareRoute } = require('../lib/eta');
const { TURNAROUND_SEC } = require('../lib/limits');

const LINE = [[0, 0], [0.009, 0], [0.009, 0.009]]; // an L, 2 km: S0 -> S1 -> S2
const STOPS = [{ name: 'S0', lat: 0, lng: 0 }, { name: 'S1', lat: 0.009, lng: 0 }, { name: 'S2', lat: 0.009, lng: 0.009 }];
const ROUTES = { out: prepareRoute(LINE, STOPS), back: prepareRoute([...LINE].reverse(), [...STOPS].reverse()) };
const T0 = 1_700_000_000_000;
const fix = (sec, [lat, lng]) => ({ lat, lng, speed: 8, heading: 0, accuracy: 5, ts: T0 + sec * 1000 });

function setup() {
  const published = [];
  const pipeline = createFixPipeline({
    getRoute: async (routeId, direction) => ROUTES[direction],
    track: async () => {},
    recordFix: () => {},
    publish: (bus, payload) => published.push(payload),
    metrics: createMetrics({ now: () => T0 }),
    smoothing: false,
    now: () => T0,
  });
  const bus = { busId: 'BUS-1', registration: 'NB-1', routeId: 'RT-1' };
  const send = (sec, point) => pipeline.handleFix(bus, fix(sec, point), { receivedAt: T0 + sec * 1000 });
  return { bus, send, published };
}

test('a bus flips to the return leg at the final stop, and the return counts from the other end', async () => {
  const s = setup();
  for (const [sec, p] of [[0, [0, 0]], [60, [0.0045, 0]], [120, [0.009, 0]], [180, [0.009, 0.0045]], [240, [0.009, 0.009]]]) await s.send(sec, p);
  assert.equal(s.published[0].direction, 'out');
  assert.equal(s.published[4].finished, true);
  assert.equal(s.bus.direction, 'back');
  await s.send(300, [0.009, 0.0045]);
  const back = s.published[5];
  assert.equal(back.direction, 'back');
  assert.deepEqual(back.stops.map((x) => [x.name, x.status]), [['S2', 'passed'], ['S1', 'upcoming'], ['S0', 'upcoming']]);
});

test('a bus whose first fix is at the far terminal starts on the return leg', async () => {
  const s = setup();
  await s.send(0, [0.009, 0.009]);
  assert.equal(s.bus.direction, 'back');
  assert.equal(s.published[0].direction, 'back');
});

test('a bus on either leg publishes the other leg with the wait built in', async () => {
  const s = setup();
  await s.send(0, [0.0045, 0]); // half way up the first side, still going out
  const p = s.published[0];
  const toEnd = p.stops[2].etaSec;
  assert.deepEqual(p.nextStops.map((x) => x.name), ['S2', 'S1', 'S0']);
  assert.equal(p.nextStops[0].etaSec, toEnd); // boarding at the far terminal: the time to get there
  assert.ok(p.nextStops[1].etaSec >= toEnd + TURNAROUND_SEC); // after the turnaround, then the first return segment
  assert.ok(p.nextStops[2].etaSec > p.nextStops[1].etaSec);
});

test('the route cache keeps each direction apart and drops both together', async () => {
  const loads = [];
  const cache = createRouteCache({ load: async (id, direction) => { loads.push(direction); return { id, direction }; } });
  assert.equal((await cache.get('R', 'out')).direction, 'out');
  assert.equal((await cache.get('R', 'back')).direction, 'back');
  await cache.get('R'); // no direction means 'out'
  assert.deepEqual(loads, ['out', 'back']);
  cache.invalidate('R');
  await cache.get('R', 'back');
  assert.deepEqual(loads, ['out', 'back', 'back']);
});
