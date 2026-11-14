// The mobile apps' backend access (shared/native/api.js): route conversion and request error mapping.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isActiveRoute, request, toRoute } from '../native/api.js';

const doc = {
  routeId: 'RT-007',
  routeNumber: '138',
  name: 'Kottawa - Pettah',
  start: 'Kottawa',
  end: 'Pettah',
  distance: 22.5,
  stopPoints: [
    { name: 'Kottawa', location: { type: 'Point', coordinates: [79.9637, 6.8412] } },
    { name: 'Pettah', location: { type: 'Point', coordinates: [79.8553, 6.9355] } },
  ],
  path: { type: 'LineString', coordinates: [[79.9637, 6.8412], [79.91, 6.88], [79.8553, 6.9355]] },
};

test('toRoute flips GeoJSON [lng, lat] into lat/lng for stops and [lat, lng] for the path', () => {
  const r = toRoute(doc);
  assert.deepEqual(r.stopPoints[0], { name: 'Kottawa', lat: 6.8412, lng: 79.9637 });
  assert.deepEqual(r.path, [[6.8412, 79.9637], [6.88, 79.91], [6.9355, 79.8553]]);
  assert.deepEqual(r.stops, ['Kottawa', 'Pettah']);
  assert.equal(r.id, 'RT-007');
  assert.equal(r.number, '138');
  assert.equal(r.shortName, 'Route 138');
  assert.equal(r.startTerminal, 'Kottawa');
  assert.equal(r.distanceKm, 22.5);
});

test('toRoute: trackable needs at least two stops with positions and a path of at least two points', () => {
  assert.equal(toRoute(doc).trackable, true);
  assert.equal(toRoute({ ...doc, path: { coordinates: [[79.96, 6.84]] } }).trackable, false);
  assert.equal(toRoute({ ...doc, stopPoints: doc.stopPoints.slice(0, 1) }).trackable, false);
  assert.equal(toRoute({ ...doc, path: undefined }).trackable, false);
});

test('toRoute: without a route number the id gives one (RT-007 -> 7), else a dash', () => {
  const noNumber = toRoute({ ...doc, routeNumber: '' });
  assert.equal(noNumber.number, '7');
  assert.equal(noNumber.shortName, 'RT-007');
  assert.equal(toRoute({ ...doc, routeNumber: '', routeId: 'RT-000' }).number, '–');
  assert.equal(toRoute({ ...doc, routeNumber: '', routeId: undefined }).number, '–');
});

test('toRoute: a route without stop positions keeps its plain stop names; no document gives null', () => {
  const r = toRoute({ ...doc, stopPoints: [], stops: ['A', 'B', 'C'] });
  assert.deepEqual(r.stops, ['A', 'B', 'C']);
  assert.equal(r.trackable, false);
  assert.equal(toRoute(null), null);
});

test('isActiveRoute keeps only routes in service', () => {
  assert.equal(isActiveRoute({ status: 'Active' }), true);
  assert.equal(isActiveRoute({ status: 'Inactive' }), false);
  assert.equal(isActiveRoute({ status: 'Under Construction' }), false);
});

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const respond = (status, body) => async () => ({ ok: status < 400, status, json: async () => { if (body === undefined) throw new SyntaxError('no json'); return body; } });

test('request returns the JSON body and sends the token and body', async () => {
  let seen;
  globalThis.fetch = async (url, init) => { seen = { url, init }; return respond(200, { ok: true })(); };
  assert.deepEqual(await request('/routes', { method: 'POST', body: { a: 1 }, token: 'T' }), { ok: true });
  assert.equal(seen.url, 'http://localhost:5000/api/routes');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers.Authorization, 'Bearer T');
  assert.equal(seen.init.body, '{"a":1}');
});

test('request: a server error carries the server message, or the status when there is none', async () => {
  globalThis.fetch = respond(401, { error: 'Invalid username or password' });
  await assert.rejects(request('/passengers/login'), { message: 'Invalid username or password' });
  globalThis.fetch = respond(500, undefined);
  await assert.rejects(request('/routes'), { message: 'Request failed (500)' });
});

test('request: network failures and timeouts become one "cannot reach" message', async () => {
  const offline = 'Cannot reach the server. Check your connection and try again.';
  globalThis.fetch = async () => { throw new TypeError('Network request failed'); };
  await assert.rejects(request('/routes'), { message: offline });
  globalThis.fetch = async () => { throw new Error('Fetch request has been canceled'); };
  await assert.rejects(request('/routes'), { message: offline });
  globalThis.fetch = (url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })));
  });
  await assert.rejects(request('/routes', { timeoutMs: 20 }), { message: offline });
});
