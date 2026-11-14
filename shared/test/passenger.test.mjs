// Which bus a passenger is shown, and the one line that explains it (apps/passenger-app/src/utils.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickBus, trackedSummary } from '../../apps/passenger-app/src/utils.js';

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
