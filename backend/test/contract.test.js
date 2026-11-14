const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../lib/contract');

test('timing windows keep their order: fix interval, live window, cache lifetime; client batches fit the server limit', () => {
  assert.ok(c.FIX_INTERVAL_MS < c.LIVE_WINDOW_MS && c.LIVE_WINDOW_MS < c.GONE_AFTER_MS);
  assert.ok(c.CLIENT_BATCH <= c.MAX_BATCH);
  assert.ok(c.CLIENT_SPEED_CAP_MPS < c.MAX_SPEED_MPS, 'the phone never reports a speed the server would reject');
});

test('a bus reference survives a round trip and a plain registration has no id', () => {
  const ref = c.formatBusRef({ registration: 'NB-4712', busId: 'BUS-002' });
  assert.equal(ref, 'NB-4712 (BUS-002)');
  assert.deepEqual(c.parseBusRef(ref), { registration: 'NB-4712', busId: 'BUS-002' });
  assert.deepEqual(c.parseBusRef('NB-1'), { registration: 'NB-1', busId: null });
  assert.deepEqual(c.parseBusRef(''), { registration: '', busId: null });
});

test('ids are zero padded to three digits and each kind has a prefix', () => {
  assert.equal(c.formatId('bus', 7), 'BUS-007');
  assert.equal(c.formatId('route', 1234), 'RT-1234');
  assert.deepEqual(Object.keys(c.ID_PREFIX).sort(), Object.keys(c.STATUS).sort());
});

test('every event name is distinct', () => {
  const names = Object.values(c.EVENTS);
  assert.equal(new Set(names).size, names.length);
});
