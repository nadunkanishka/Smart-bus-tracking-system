// The Socket.IO layer with real sockets, an in-memory store and no MongoDB (routes have no geometry, history is not kept).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const { createRealtime } = require('../realtime');
const { memoryStore } = require('../lib/store');
const { signToken, driverClaims } = require('../lib/auth');
const { EVENTS } = require('../lib/contract');

const noHistory = { track: async () => {}, recordFix: () => {}, endTrip: async (bus) => { bus.trip = null; } };
const noRoutes = { get: async () => null, invalidate: () => {} };

async function startServer(store = memoryStore()) {
  const server = http.createServer();
  const io = new Server(server);
  createRealtime(io, store, { routeCache: noRoutes, recorder: noHistory, smoothing: false });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  const sockets = [];
  const open = (auth) => {
    const s = connect(url, { transports: ['websocket'], auth, reconnection: false });
    sockets.push(s);
    return new Promise((resolve, reject) => { s.once('connect', () => resolve(s)); s.once('connect_error', reject); });
  };
  const close = async () => { sockets.forEach((s) => s.close()); io.close(); await new Promise((r) => server.close(r)); };
  return { open, close };
}

const driverToken = (routeId) => signToken(driverClaims({ busId: 'BUS-7', registration: 'NB-7' }, routeId ? { routeId } : null));
const ask = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));
// Everything `event` delivers to `socket` from now on.
const record = (socket, event) => { const got = []; socket.on(event, (m) => got.push(m)); return got; };
const settle = () => new Promise((r) => setTimeout(r, 150));
const fix = (ts) => ({ lat: 6.9, lng: 79.86, speed: 8, heading: 0, accuracy: 5, ts });

async function passengerOn(open, routeId) {
  const p = await open({});
  await ask(p, EVENTS.SUBSCRIBE, { routeId });
  return p;
}

test('a bus moved to another route leaves the old route, and its fixes go to the new route only', async () => {
  const { open, close } = await startServer();
  try {
    const onA = await passengerOn(open, 'RT-A');
    const onB = await passengerOn(open, 'RT-B');
    const updatesA = record(onA, EVENTS.UPDATE);
    const offlineA = record(onA, EVENTS.OFFLINE);
    const updatesB = record(onB, EVENTS.UPDATE);

    const first = await open({ token: driverToken('RT-A') });
    assert.equal((await ask(first, EVENTS.FIX, fix(Date.now()))).ok, true);
    await settle();
    assert.equal(updatesA.length, 1);
    first.close();

    // The admin reassigned the bus: its next sign-in carries RT-B.
    const second = await open({ token: driverToken('RT-B') });
    const ack = await ask(second, EVENTS.FIX, fix(Date.now()));
    assert.equal(ack.ok, true);
    await settle();
    assert.deepEqual(offlineA, [{ busId: 'BUS-7' }], 'passengers on the old route are told the bus left');
    assert.equal(updatesA.length, 1, 'nothing more reaches the old route');
    assert.deepEqual(updatesB.map((u) => u.routeId), ['RT-B']);
  } finally {
    await close();
  }
});

test('driver:duty and gps:fix both need an assigned route', async () => {
  const { open, close } = await startServer();
  try {
    const driver = await open({ token: driverToken(null) });
    assert.deepEqual(await ask(driver, EVENTS.DUTY, { onDuty: true }), { ok: false, error: 'No route assigned to this bus' });
    assert.deepEqual(await ask(driver, EVENTS.FIX, fix(Date.now())), { ok: false, error: 'No route assigned to this bus' });
  } finally {
    await close();
  }
});

test('going off duty tells passengers the bus is offline even when the cache cannot be cleared', async () => {
  const store = memoryStore();
  store.remove = async () => { throw new Error('cache down'); };
  const { open, close } = await startServer(store);
  const errors = [];
  const consoleError = console.error;
  console.error = (...a) => errors.push(a.join(' '));
  try {
    const passenger = await passengerOn(open, 'RT-A');
    const offline = record(passenger, EVENTS.OFFLINE);
    const driver = await open({ token: driverToken('RT-A') });
    await ask(driver, EVENTS.FIX, fix(Date.now()));
    assert.deepEqual(await ask(driver, EVENTS.DUTY, { onDuty: false }), { ok: false, error: 'Server error' });
    await settle();
    assert.deepEqual(offline, [{ busId: 'BUS-7' }]);
    assert.ok(errors.some((e) => e.includes('cache down')), 'the failure is logged');
  } finally {
    console.error = consoleError;
    await close();
  }
});

test('a batch with a fix that has no timestamp is still processed and acknowledged', async () => {
  const { open, close } = await startServer();
  try {
    const driver = await open({ token: driverToken('RT-A') });
    const now = Date.now();
    const ack = await ask(driver, EVENTS.BATCH, [fix(now - 2000), { lat: 6.9, lng: 79.86 }, fix(now - 5000)]);
    assert.deepEqual(ack, { ok: true, accepted: 2, duplicate: 0, rejected: 1, lastTs: now - 2000 });
    assert.equal((await ask(driver, EVENTS.BATCH, 'not a list')).ok, false);
  } finally {
    await close();
  }
});
