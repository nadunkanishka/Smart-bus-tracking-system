const test = require('node:test');
const assert = require('node:assert/strict');
const { smoothFix, SMOOTHING } = require('../lib/smooth');
const { haversine } = require('../lib/geo');

const M_LAT = 1 / 111195; // degrees of latitude per metre
const M_LNG = 1 / (111195 * Math.cos((6.9 * Math.PI) / 180));
const T0 = 1e12;

// Small repeatable random numbers.
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// Runs fixes through the smoother and returns the smoothed points.
function run(fixes) {
  let state = null;
  return fixes.map((f) => {
    const res = smoothFix(state, f);
    state = res.state;
    return res;
  });
}
const dist = (a, b) => haversine([a.lat, a.lng], [b.lat, b.lng]);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

test('a jittery straight track becomes closer to the truth', () => {
  const r = rng(1);
  const truth = [];
  const noisy = [];
  for (let i = 0; i < 80; i += 1) {
    const t = { lat: 6.9, lng: 79.9 + i * 24 * M_LNG, ts: T0 + i * 3000, speed: 8, heading: 90, accuracy: 15 };
    truth.push(t);
    noisy.push({ ...t, lat: t.lat + gauss(r) * 12 * M_LAT, lng: t.lng + gauss(r) * 12 * M_LNG });
  }
  const smoothed = run(noisy);
  const rawErr = mean(noisy.map((n, i) => dist(n, truth[i])));
  const smErr = mean(smoothed.map((s, i) => dist(s, truth[i])));
  assert.ok(smErr < rawErr * 0.8, `smoothed ${smErr.toFixed(1)} m should beat raw ${rawErr.toFixed(1)} m`);
});

test('a real turn is followed, not cut off', () => {
  const fixes = [];
  let lat = 6.9;
  let lng = 79.9;
  for (let i = 0; i < 40; i += 1) {
    if (i < 20) lng += 24 * M_LNG; else lat += 24 * M_LAT; // 90 degree turn at fix 20, 8 m/s
    fixes.push({ lat, lng, ts: T0 + i * 3000, speed: 8, heading: null, accuracy: 5 });
  }
  const out = run(fixes);
  const errs = out.map((o, i) => dist(o, fixes[i]));
  assert.ok(Math.max(...errs) < 12, `worst error at the turn was ${Math.max(...errs).toFixed(1)} m`);
  assert.ok(Math.max(...errs.slice(26)) < 3, 'it should be back on the track a few fixes after the turn');
});

test('a bus that is stopped stays stopped, and wanders less than the raw fixes', () => {
  const r = rng(2);
  const stop = { lat: 6.92, lng: 79.88 };
  const fixes = [];
  // it drives in at 8 m/s, then waits 30 fixes (90 s) at the stop
  for (let i = 0; i < 10; i += 1) {
    const t = { lat: stop.lat, lng: stop.lng - (10 - i) * 24 * M_LNG, speed: 8 };
    fixes.push({ ...t, lat: t.lat + gauss(r) * 12 * M_LAT, lng: t.lng + gauss(r) * 12 * M_LNG, ts: T0 + i * 3000, heading: 90, accuracy: 15 });
  }
  for (let i = 10; i < 40; i += 1) {
    fixes.push({ lat: stop.lat + gauss(r) * 12 * M_LAT, lng: stop.lng + gauss(r) * 12 * M_LNG, ts: T0 + i * 3000, speed: 0, heading: null, accuracy: 15 });
  }
  const out = run(fixes);
  const smWander = mean(out.slice(20).map((o) => dist(o, stop)));
  const rawWander = mean(fixes.slice(20).map((f) => dist(f, stop)));
  assert.ok(smWander < rawWander * 0.6, `at the stop: smoothed ${smWander.toFixed(1)} m, raw ${rawWander.toFixed(1)} m`);
  assert.ok(out.slice(10).every((o) => o.held));
});

test('one spike is skipped, but a real jump is accepted after two skipped fixes', () => {
  const fixes = [];
  for (let i = 0; i < 12; i += 1) fixes.push({ lat: 6.9, lng: 79.9 + i * 24 * M_LNG, ts: T0 + i * 3000, speed: 8, heading: 90, accuracy: 8 });
  const spike = run([...fixes.slice(0, 8), { ...fixes[8], lat: fixes[8].lat + 300 * M_LAT }, ...fixes.slice(9)]);
  assert.equal(spike[8].skipped, true);
  assert.ok(dist(spike[8], fixes[8]) < 40, 'the spike must not pull the position away');
  assert.equal(spike[9].skipped, false);

  // The bus really is somewhere else from fix 8 on (a long tunnel, a GPS fix after a long drop): follow it.
  const moved = fixes.map((f, i) => (i < 8 ? f : { ...f, lat: f.lat + 400 * M_LAT }));
  const out = run(moved);
  assert.equal(out[8].skipped, true);
  assert.equal(out[9].skipped, true);
  assert.equal(out[10].skipped, false, 'after maxSkips fixes the new position is accepted');
});

test('an old or repeated timestamp never moves the filter backwards', () => {
  const a = smoothFix(null, { lat: 6.9, lng: 79.9, ts: T0, speed: 8, heading: null, accuracy: 10 });
  const b = smoothFix(a.state, { lat: 6.9, lng: 79.9003, ts: T0 + 3000, speed: 8, heading: null, accuracy: 10 });
  const old = smoothFix(b.state, { lat: 6.9, lng: 79.9001, ts: T0 + 1000, speed: 8, heading: null, accuracy: 10 });
  assert.ok(Number.isFinite(old.lat) && Number.isFinite(old.lng));
  assert.ok(old.state.ts >= T0, 'state time stays sane');
});

test('after a long gap the filter starts again from the new fix', () => {
  const a = smoothFix(null, { lat: 6.9, lng: 79.9, ts: T0, speed: 8, heading: null, accuracy: 10 });
  const gap = (SMOOTHING.resetGapSec + 5) * 1000;
  const b = smoothFix(a.state, { lat: 6.95, lng: 79.95, ts: T0 + gap, speed: 8, heading: null, accuracy: 10 });
  assert.equal(b.lat, 6.95);
  assert.equal(b.lng, 79.95);
});

test('with smoothing switched off the fix passes through unchanged', () => {
  const res = smoothFix(null, { lat: 6.9, lng: 79.9, ts: T0, speed: 8, accuracy: 10 }, { ...SMOOTHING, enabled: false });
  assert.deepEqual([res.lat, res.lng], [6.9, 79.9]);
});
