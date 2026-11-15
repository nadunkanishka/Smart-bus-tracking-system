// API: routes, the buses on a route, and driver login.
// Real server, throwaway MongoDB database (see test/helpers/api.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApi } = require('./helpers/api');

const api = createApi('routes');
const { call, as, guard } = api;
test.before(api.start);
test.after(api.stop);

test('routes: create, read one, list, update, delete', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const body = {
    name: 'Fort - Borella', start: 'Fort', end: 'Borella', distance: 6.5, routeNumber: '138',
    path: [[6.9, 79.86], [6.91, 79.87], [6.92, 79.88]],
    stopPoints: [{ name: 'Fort', lat: 6.9, lng: 79.86 }, { name: 'Town Hall', lat: 6.91, lng: 79.87 }, { name: 'Borella', lat: 6.92, lng: 79.88 }],
  };
  assert.equal((await A.post('/api/routes', { name: 'x' })).status, 400);
  assert.equal((await A.post('/api/routes', { ...body, path: [[6.9, 79.86]] })).status, 400);
  assert.equal((await A.post('/api/routes', { ...body, busIds: ['BUS-404'] })).status, 400, 'unknown bus is rejected');

  const made = await A.post('/api/routes', body);
  assert.equal(made.status, 201);
  assert.match(made.data.routeId, /^RT-\d{3}$/);
  assert.equal(made.data.stopPoints.length, 3);

  const one = await A.get(`/api/routes/${made.data.routeId}`);
  assert.equal(one.status, 200);
  assert.equal(one.data.name, 'Fort - Borella');
  assert.equal((await A.get('/api/routes/RT-999')).status, 404);
  assert.ok((await call('GET', '/api/routes')).data.some((r) => r.routeId === made.data.routeId), 'passengers can list routes without signing in');

  const upd = await A.put(`/api/routes/${made.data.routeId}`, { distance: 7, routeId: 'HACKED' });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.distance, 7);
  assert.equal(upd.data.routeId, made.data.routeId);
  assert.equal(upd.data.stopPoints.length, 3, 'a partial update leaves the geometry alone');
  assert.equal((await A.put('/api/routes/RT-999', { distance: 1 })).status, 404);

  assert.equal((await A.del(`/api/routes/${made.data.routeId}`)).status, 200);
  assert.equal((await A.del(`/api/routes/${made.data.routeId}`)).status, 404);
});

test('a route can have many buses, and a bus can run on one route only', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const mk = async (registration) => (await A.post('/api/buses', { registration, capacity: 40, mileage: 1, password: 'pw1234' })).data;
  const [b1, b2, b3] = [await mk('NB-M1'), await mk('NB-M2'), await mk('NB-M3')];
  const r1 = (await A.post('/api/routes', { name: 'Many', start: 'A', end: 'B', distance: 1, busIds: [b1.busId, b2.busId] })).data;
  assert.deepEqual(r1.busIds, [b1.busId, b2.busId]);
  assert.deepEqual(r1.buses.map((b) => b.registration), ['NB-M1', 'NB-M2']);

  // a bus that is already on a route cannot be put on another one
  const clash = await A.post('/api/routes', { name: 'Other', start: 'A', end: 'B', distance: 1, busIds: [b2.busId, b3.busId] });
  assert.equal(clash.status, 409);
  assert.match(clash.data.error, /NB-M2/);
  assert.equal((await A.get(`/api/buses/${b3.busId}`)).data.routeId, '', 'a rejected list changes nothing');

  const r2 = (await A.post('/api/routes', { name: 'Other', start: 'A', end: 'B', distance: 1, busIds: [b3.busId] })).data;
  assert.equal((await A.put(`/api/routes/${r2.routeId}`, { busIds: [b1.busId] })).status, 409);
  assert.equal((await A.put(`/api/buses/${b1.busId}`, { routeId: 'RT-999' })).status, 400, 'unknown route is rejected');

  // changing the list frees the buses that were left out
  const upd = await A.put(`/api/routes/${r1.routeId}`, { busIds: [b1.busId] });
  assert.deepEqual(upd.data.busIds, [b1.busId]);
  assert.equal((await A.get(`/api/buses/${b2.busId}`)).data.routeId, '');
  // moving a bus from the bus side
  assert.equal((await A.put(`/api/buses/${b2.busId}`, { routeId: r2.routeId })).data.routeId, r2.routeId);
  assert.deepEqual((await A.get(`/api/routes/${r2.routeId}`)).data.busIds, [b2.busId, b3.busId]);
  // a plain edit of the route keeps its buses
  assert.deepEqual((await A.put(`/api/routes/${r2.routeId}`, { distance: 3 })).data.busIds, [b2.busId, b3.busId]);

  await A.del(`/api/routes/${r1.routeId}`);
  await A.del(`/api/routes/${r2.routeId}`);
  for (const b of [b1, b2, b3]) await A.del(`/api/buses/${b.busId}`);
});

test('driver login finds the route of exactly that bus, not a bus whose registration contains it', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const b1 = (await A.post('/api/buses', { registration: 'NB-1', capacity: 40, mileage: 1, password: 'pw1234' })).data;
  const b12 = (await A.post('/api/buses', { registration: 'NB-12', capacity: 40, mileage: 1, password: 'pw1234' })).data;
  const route = (await A.post('/api/routes', { name: 'Only NB-12', start: 'A', end: 'B', distance: 1, busIds: [b12.busId] })).data;
  const login = (reg) => call('POST', '/api/auth/driver-login', { body: { registration: reg, password: 'pw1234' } });
  assert.equal((await login('NB-1')).data.assignedRoute, null);
  assert.equal((await login('NB-12')).data.assignedRoute.routeId, route.routeId);
  await A.del(`/api/routes/${route.routeId}`);
  await A.del(`/api/buses/${b1.busId}`);
  await A.del(`/api/buses/${b12.busId}`);
});

test('routes: clearing every stop point also clears the stop names', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const made = (await A.post('/api/routes', {
    name: 'Clear', start: 'A', end: 'B', distance: 1,
    stopPoints: [{ name: 'A', lat: 6.9, lng: 79.86 }, { name: 'B', lat: 6.91, lng: 79.87 }],
  })).data;
  assert.deepEqual(made.stops, ['A', 'B']);
  const cleared = await A.put(`/api/routes/${made.routeId}`, { stopPoints: [] });
  assert.equal(cleared.status, 200);
  assert.deepEqual(cleared.data.stopPoints, []);
  assert.deepEqual(cleared.data.stops, []);
  await A.del(`/api/routes/${made.routeId}`);
});
