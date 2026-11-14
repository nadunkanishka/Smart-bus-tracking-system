// The driver app's telemetry decisions (src/services/telemetryCore.js) and display helpers (src/utils.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFix, deriveSpeed, enqueueFix, metresBetween, removeAcked, takeBatch } from '../../apps/driver-app/src/services/telemetryCore.js';
import { formatCoord, toKmh } from '../../apps/driver-app/src/utils.js';

const near = (actual, expected, eps = 0.01) => assert.ok(Math.abs(actual - expected) < eps, `${actual} is not about ${expected}`);
const PREV = { lat: 6.9, lng: 79.85, ts: 1_000_000 };

test('speed: the device reading is used when it has one', () => {
  assert.equal(deriveSpeed(12.5, PREV, { lat: 6.95, lng: 79.85 }, PREV.ts + 3000), 12.5);
});

test('speed: without a device reading it is distance over time from the previous fix', () => {
  // 0.001 degrees of latitude is 111.32 m; covered in 10 s that is 11.132 m/s.
  near(deriveSpeed(null, PREV, { lat: 6.901, lng: 79.85 }, PREV.ts + 10_000), 11.132);
  near(deriveSpeed(-1, PREV, { lat: 6.901, lng: 79.85 }, PREV.ts + 10_000), 11.132);
});

test('speed: 0 without an earlier fix or when the clock did not move forward', () => {
  assert.equal(deriveSpeed(null, null, { lat: 6.9, lng: 79.85 }, PREV.ts), 0);
  assert.equal(deriveSpeed(null, PREV, { lat: 6.901, lng: 79.85 }, PREV.ts), 0);
});

test('speed: never above the 40 m/s client cap', () => {
  assert.equal(deriveSpeed(55, PREV, PREV, PREV.ts + 1000), 40);
  assert.equal(deriveSpeed(null, PREV, { lat: 7.0, lng: 79.85 }, PREV.ts + 1000), 40);
});

test('distance: east-west metres shrink with the cosine of the latitude', () => {
  near(metresBetween({ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }), 111.32);
  near(metresBetween({ lat: 60, lng: 0 }, { lat: 60, lng: 0.001 }), 55.66);
});

test('fix: the shape the server expects, with no sequence number', () => {
  const fix = buildFix({ latitude: 6.91, longitude: 79.86, speed: 8, heading: 270, accuracy: 5 }, 1_000_003.6, PREV);
  assert.deepEqual(fix, { lat: 6.91, lng: 79.86, speed: 8, heading: 270, accuracy: 5, ts: 1_000_004 });
});

test('fix: missing or negative heading and missing accuracy are null; no timestamp means now', () => {
  const fix = buildFix({ latitude: 6.91, longitude: 79.86, speed: 0, heading: -1 }, undefined, null, 2_000_000);
  assert.equal(fix.heading, null);
  assert.equal(fix.accuracy, null);
  assert.equal(fix.ts, 2_000_000);
});

const fixes = (n, from = 1) => Array.from({ length: n }, (_, i) => ({ ts: from + i }));

test('queue: a fix joins the end; past the cap the oldest go first', () => {
  assert.deepEqual(enqueueFix(fixes(2), { ts: 3 }, 3), fixes(3));
  assert.deepEqual(enqueueFix(fixes(3), { ts: 4 }, 3), [{ ts: 2 }, { ts: 3 }, { ts: 4 }]);
});

test('queue: the default cap is 2000 fixes and the input is not changed', () => {
  const full = fixes(2000);
  const next = enqueueFix(full, { ts: 2001 });
  assert.equal(next.length, 2000);
  assert.deepEqual(next[0], { ts: 2 });
  assert.deepEqual(next[1999], { ts: 2001 });
  assert.equal(full.length, 2000);
});

test('batch: 500 oldest fixes at a time; acknowledged ones leave, ones queued meanwhile stay', () => {
  const queue = fixes(1200);
  const batch = takeBatch(queue);
  assert.equal(batch.length, 500);
  assert.deepEqual([batch[0], batch[499]], [{ ts: 1 }, { ts: 500 }]);
  const grown = [...queue, { ts: 1201 }]; // a fix arrived while the batch was in flight
  const left = removeAcked(grown, batch.length);
  assert.equal(left.length, 701);
  assert.deepEqual([left[0], left[700]], [{ ts: 501 }, { ts: 1201 }]);
});

test('display: coordinates to four decimals, speed in whole km/h', () => {
  assert.equal(formatCoord(6.927123), '6.9271');
  assert.equal(formatCoord('79.86129'), '79.8613');
  assert.equal(toKmh(10), 36);
  assert.equal(toKmh(0), 0);
  assert.equal(toKmh(13.9), 50);
});
