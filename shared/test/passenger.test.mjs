// Which bus a passenger is shown, and the one line that explains it (apps/passenger-app/src/utils.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busesFromSnapshot, pickBus, restoreJourney, searchRoutes, trackedSummary, visibleBuses } from '../../apps/passenger-app/src/utils.js';

const stop = (name, status, etaMin) => ({ name, status, etaMin, etaSec: etaMin == null ? null : etaMin * 60 });
const bus = (busId, stops, extra = {}) => ({ busId, stops, ...extra });

// Kottawa -> Pettah: the passenger boards at Maharagama and rides to Nugegoda.
const STOPS = ['Kottawa', 'Pannipitiya', 'Maharagama', 'Nugegoda', 'Pettah'];
const at = (statuses) => STOPS.map((name, i) => stop(name, statuses[i][0], statuses[i][1]));

test('coming: the bus with the shortest wait at the boarding stop wins', () => {
  const far = bus('BUS-001', at([['upcoming', 2], ['upcoming', 9], ['upcoming', 14], ['upcoming', 20], ['upcoming', 35]]));
  const near = bus('BUS-002', at([['passed'], ['upcoming', 1], ['upcoming', 4], ['upcoming', 10], ['upcoming', 25]]));
  const t = pickBus([far, near], 2, 3, 'Maharagama', 'Nugegoda');
  assert.equal(t.bus.busId, 'BUS-002');
  assert.equal(t.phase, 'coming');
  assert.equal(t.etaMin, 4);
  assert.equal(trackedSummary(t, 'Maharagama', 'Nugegoda'), 'Arrives at Maharagama in 4 min');
});

// The return trip: Pettah to Maharagama runs the other way (boarding index 4, destination index 2).
const REVERSED = [...STOPS].reverse();
const leg = (statuses) => REVERSED.map((name, i) => stop(name, statuses[i][0], statuses[i][1]));

test('a return trip waits for a bus still on its way out: its nextStops carry the wait to the terminal and back', () => {
  const going = bus('BUS-010', at([['passed'], ['upcoming', 3], ['upcoming', 8], ['upcoming', 14], ['upcoming', 22]]), {
    direction: 'out',
    nextStops: leg([['upcoming', 22], ['upcoming', 25], ['upcoming', 33], ['upcoming', 40], ['upcoming', 48]]),
  });
  const t = pickBus([going], 4, 2, 'Pettah', 'Maharagama');
  assert.equal(t.phase, 'coming');
  assert.equal(t.etaMin, 22);
  assert.equal(t.bus.stops[0].name, 'Pettah'); // the stop list the passenger sees runs in the direction of the trip
  assert.equal(trackedSummary(t, 'Pettah', 'Maharagama'), 'Arrives at Pettah in 22 min');
});

test('a return trip prefers a bus that is already running back, when it gets there sooner', () => {
  const going = bus('BUS-010', at([['passed'], ['upcoming', 3], ['upcoming', 8], ['upcoming', 14], ['upcoming', 22]]), {
    direction: 'out', nextStops: leg([['upcoming', 22], ['upcoming', 25], ['upcoming', 33], ['upcoming', 40], ['upcoming', 48]]),
  });
  const returning = bus('BUS-011', leg([['passed'], ['upcoming', 6], ['upcoming', 12], ['upcoming', 18], ['upcoming', 30]]), { direction: 'back' });
  assert.equal(pickBus([going, returning], 3, 2, 'Nugegoda', 'Maharagama').bus.busId, 'BUS-011');
});

test('an outward trip counts a bus that is running back through its nextStops', () => {
  const returning = bus('BUS-011', leg([['passed'], ['upcoming', 2], ['upcoming', 9], ['upcoming', 14], ['upcoming', 20]]), {
    direction: 'back',
    nextStops: at([['upcoming', 20], ['upcoming', 24], ['upcoming', 30], ['upcoming', 36], ['upcoming', 45]]),
  });
  const t = pickBus([returning], 2, 3, 'Maharagama', 'Nugegoda');
  assert.equal(t.etaMin, 30);
});

test('passed: once every bus is past the boarding stop, the one heading to the destination is shown', () => {
  const riding = bus('BUS-003', at([['passed'], ['passed'], ['passed'], ['upcoming', 6], ['upcoming', 21]]));
  const t = pickBus([riding], 2, 3, 'Maharagama', 'Nugegoda');
  assert.equal(t.phase, 'passed');
  assert.equal(t.etaMin, 6);
  assert.equal(trackedSummary(t, 'Maharagama', 'Nugegoda'), 'Passed Maharagama. 6 min to Nugegoda');
});

test('done: a bus past both stops is still tracked, without an arrival time', () => {
  const gone = bus('BUS-004', at([['passed'], ['passed'], ['passed'], ['passed'], ['upcoming', 3]]));
  const t = pickBus([gone], 2, 3, 'Maharagama', 'Nugegoda');
  assert.deepEqual({ id: t.bus.busId, phase: t.phase, etaMin: t.etaMin }, { id: 'BUS-004', phase: 'done', etaMin: null });
  assert.equal(trackedSummary(t, 'Maharagama', 'Nugegoda'), 'This bus has passed your stops.');
});

test('no live bus: nothing is tracked and the summary is empty', () => {
  assert.equal(pickBus([], 2, 3, 'Maharagama', 'Nugegoda'), null);
  assert.equal(trackedSummary(null, 'Maharagama', 'Nugegoda'), '');
});

test('stale: a bus with a live signal beats a nearer one that lost it', () => {
  const lost = bus('BUS-005', at([['passed'], ['passed'], ['upcoming', 1], ['upcoming', 5], ['upcoming', 20]]), { stale: true });
  const live = bus('BUS-006', at([['upcoming', 3], ['upcoming', 8], ['upcoming', 12], ['upcoming', 18], ['upcoming', 30]]));
  const t = pickBus([lost, live], 2, 3, 'Maharagama', 'Nugegoda');
  assert.equal(t.bus.busId, 'BUS-006');
  assert.equal(t.etaMin, 12);
});

test('stale: when every bus lost its signal, the last known one is still shown and says so', () => {
  const lost = bus('BUS-007', at([['passed'], ['passed'], ['upcoming', 1], ['upcoming', 5], ['upcoming', 20]]), { stale: true });
  const t = pickBus([lost], 2, 3, 'Maharagama', 'Nugegoda');
  assert.equal(t.bus.busId, 'BUS-007');
  assert.equal(trackedSummary(t, 'Maharagama', 'Nugegoda'), 'Signal lost. Showing the last known position.');
});

test('regression: the stop is matched by name, so an outdated route copy still says Maharagama 9 min, not 17', () => {
  // The admin removed "Pannipitiya" after the passenger loaded the route: the passenger's index 2 is Maharagama,
  // but in the bus's current stop list index 2 is Nugegoda (17 min) and Maharagama is index 1 (9 min).
  const current = bus('BUS-008', [stop('Kottawa', 'passed'), stop('Maharagama', 'upcoming', 9), stop('Nugegoda', 'upcoming', 17), stop('Pettah', 'upcoming', 30)]);
  const t = pickBus([current], 2, 3, 'Maharagama', 'Nugegoda');
  assert.equal(t.etaMin, 9);
  assert.equal(trackedSummary(t, 'Maharagama', 'Nugegoda'), 'Arrives at Maharagama in 9 min');
});

test('a stop name the bus does not know falls back to the index', () => {
  const b = bus('BUS-009', at([['passed'], ['upcoming', 2], ['upcoming', 7], ['upcoming', 11], ['upcoming', 26]]));
  const t = pickBus([b], 2, 3, 'Renamed stop', 'Nugegoda');
  assert.equal(t.phase, 'coming');
  assert.equal(t.etaMin, 7);
});

const ROUTES = [{ id: 'RT-1', stops: ['A', 'B', 'C', 'D'] }, { id: 'RT-2', stops: ['X', 'Y'] }];

test('the saved journey comes back with its route and stops', () => {
  const j = restoreJourney(ROUTES, { routeId: 'RT-1', boarding: 'B', destination: 'C' });
  assert.deepEqual([j.route.id, j.boarding, j.destination], ['RT-1', 'B', 'C']);
});

test('a saved stop that no longer exists, or a trip that starts and ends at the same stop, falls back to the terminals', () => {
  const gone = restoreJourney(ROUTES, { routeId: 'RT-1', boarding: 'Z', destination: 'C' });
  assert.deepEqual([gone.boarding, gone.destination], ['A', 'D']);
  const same = restoreJourney(ROUTES, { routeId: 'RT-1', boarding: 'C', destination: 'C' });
  assert.deepEqual([same.boarding, same.destination], ['A', 'D']);
});

test('a saved return trip (a later stop to an earlier one) is kept', () => {
  const j = restoreJourney(ROUTES, { routeId: 'RT-1', boarding: 'C', destination: 'B' });
  assert.deepEqual([j.boarding, j.destination], ['C', 'B']);
});

test('no journey is restored when nothing is saved or its route is gone', () => {
  assert.equal(restoreJourney(ROUTES, null), null);
  assert.equal(restoreJourney(ROUTES, { routeId: 'RT-9', boarding: 'A', destination: 'B' }), null);
});

const BUS = (id, routeId, recvAt) => ({ busId: id, routeId, recvAt });

test('a bus on the route is shown; one not heard from for 15 s is flagged stale, one gone for 60 s disappears', () => {
  const now = 1_000_000;
  const buses = { fresh: BUS('fresh', 'RT-1', now - 2_000), quiet: BUS('quiet', 'RT-1', now - 20_000), gone: BUS('gone', 'RT-1', now - 61_000) };
  const shown = visibleBuses(buses, 'RT-1', now);
  assert.deepEqual(shown.map((b) => [b.busId, b.stale]), [['fresh', false], ['quiet', true]]);
});

test('buses on another route are never shown', () => {
  assert.deepEqual(visibleBuses({ a: BUS('a', 'RT-2', 0) }, 'RT-1', 1_000), []);
});

test('a snapshot keeps the real age of each cached fix, so an old one is stale at once', () => {
  const now = 5_000_000;
  const out = busesFromSnapshot([{ busId: 'old', serverEmitTs: 1_000_000 - 30_000 }, { busId: 'new', serverEmitTs: 1_000_000 }], 1_000_000, now);
  assert.equal(out.old.recvAt, now - 30_000);
  assert.equal(out.new.recvAt, now);
  assert.equal(visibleBuses({ old: { ...out.old, routeId: 'R' } }, 'R', now)[0].stale, true);
});

test('route search matches number, name or any stop, and lists the tracked route first', () => {
  const routes = [
    { id: 'RT-1', number: '138', name: 'Pettah to Homagama', stops: ['Pettah', 'Maharagama'] },
    { id: 'RT-2', number: '112', name: 'Maharagama to Kotahena', stops: ['Maharagama', 'Kotahena'] },
    { id: 'RT-3', number: '100', name: 'Panadura', stops: ['Panadura'] },
  ];
  assert.deepEqual(searchRoutes(routes, 'mahara', null).map((r) => r.id), ['RT-1', 'RT-2']);
  assert.deepEqual(searchRoutes(routes, '', 'RT-3').map((r) => r.id), ['RT-3', 'RT-1', 'RT-2']);
  assert.deepEqual(searchRoutes(routes, '  KOTAHENA ', null).map((r) => r.id), ['RT-2']);
  assert.deepEqual(searchRoutes(routes, 'zzz', 'RT-1'), []);
});
