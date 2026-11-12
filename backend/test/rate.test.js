const test = require('node:test');
const assert = require('node:assert/strict');
const { createRate } = require('../lib/rate');

const MIN = 60000;
const T0 = 1_700_000_000_000 - (1_700_000_000_000 % MIN); // the start of a minute

test('counts events in the minute they happened and fills quiet minutes with zero', () => {
  const rate = createRate();
  rate.hit(T0 + 1000);
  rate.hit(T0 + 59000);
  rate.hit(T0 + MIN + 5000);
  rate.hit(T0 + 3 * MIN);
  const s = rate.series(T0 + 3 * MIN + 10, 4);
  assert.deepEqual(s.map((x) => x.n), [2, 1, 0, 1]);
  assert.equal(s[0].t, T0);
  assert.equal(s[3].t, T0 + 3 * MIN);
});

test('the series is always n long, oldest first, even with no events', () => {
  const s = createRate().series(T0, 12);
  assert.equal(s.length, 12);
  assert.ok(s.every((x) => x.n === 0));
  assert.ok(s[0].t < s[11].t);
});

test('minutes older than the window are forgotten', () => {
  const rate = createRate(5);
  rate.hit(T0);
  rate.hit(T0 + 20 * MIN);
  assert.equal(rate.series(T0 + 20 * MIN, 21)[0].n, 0, 'the old minute was dropped');
  assert.equal(rate.series(T0 + 20 * MIN, 1)[0].n, 1);
});
