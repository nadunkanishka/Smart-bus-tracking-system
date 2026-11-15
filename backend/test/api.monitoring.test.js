// API: health, the admin's read-only monitoring endpoints, and who may call them.
// Real server, throwaway MongoDB database (see test/helpers/api.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApi } = require('./helpers/api');

const api = createApi('monitoring');
const { call, as, guard } = api;
test.before(api.start);
test.after(api.stop);

test('health says the API is up, MongoDB is connected and which latest-fix store is in use', async (t) => {
  if (guard(t)) return;
  const res = await call('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual([res.data.status, res.data.mongo, res.data.cache], ['ok', 'connected', 'memory']);
  assert.equal(typeof res.data.sockets, 'number');
});

test('the monitoring endpoints are admin-only', async (t) => {
  if (guard(t)) return;
  for (const path of ['/api/live', '/api/metrics', '/api/dashboard/summary', '/api/analytics/eta', '/api/analytics/segments?routeId=RT-001']) {
    assert.equal((await call('GET', path)).status, 401, `${path} without a token`);
  }
  const reg = await call('POST', '/api/passengers/register', { body: { name: 'Watcher', username: 'watcher1', password: 'Watcher@123' } });
  const passenger = as(reg.data.token);
  assert.equal((await passenger.get('/api/live')).status, 403, 'a passenger is not an admin');
});

test('live and metrics start empty and well formed', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const live = await A.get('/api/live');
  assert.equal(live.status, 200);
  assert.deepEqual(live.data.buses, []);
  assert.equal(typeof live.data.serverTs, 'number');

  const metrics = await A.get('/api/metrics');
  assert.equal(metrics.status, 200);
  assert.equal(metrics.data.store, 'memory');
  assert.equal(metrics.data.fixes.accepted, 0);
  assert.ok(Array.isArray(metrics.data.fixesPerMinute));
  assert.equal(metrics.data.latencyMs.deviceToServer.count, 0);
});

test('the dashboard summary counts active drivers and routes, the fleet registered and its split by status', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  await A.post('/api/drivers', { name: 'Sum One', license: 'L-SUM-1', expiry: '2030-01-01', phone: '0710000001', status: 'Active' });
  await A.post('/api/drivers', { name: 'Sum Two', license: 'L-SUM-2', expiry: '2030-01-01', phone: '0710000002', status: 'On Leave' });
  for (const [registration, status] of [['NB-S1', 'Active'], ['NB-S2', 'Active'], ['NB-S3', 'Maintenance']]) {
    await A.post('/api/buses', { registration, capacity: 40, mileage: 1, password: 'pw1234', status });
  }
  const route = { name: 'Sum', start: 'A', end: 'B', distance: 1, status: 'Active' };
  await A.post('/api/routes', route);

  const { status, data } = await A.get('/api/dashboard/summary');
  assert.equal(status, 200);
  assert.equal(data.activeDrivers, 1, 'only the driver whose status is Active');
  assert.equal(data.registeredBuses, 3);
  assert.equal(data.activeRoutes, 1);
  assert.deepEqual(data.fleetDistribution, { active: 2, idle: 0, maintenance: 1 });
});

test('analytics: a route that does not exist is a 404, a real one has one segment per pair of stops, ETA accuracy starts empty', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  assert.equal((await A.get('/api/analytics/segments?routeId=RT-404')).status, 404);

  const made = await A.post('/api/routes', {
    name: 'Seg', start: 'A', end: 'C', distance: 2, routeNumber: '7',
    path: [[6.9, 79.86], [6.91, 79.87], [6.92, 79.88]],
    stopPoints: [{ name: 'A', lat: 6.9, lng: 79.86 }, { name: 'B', lat: 6.91, lng: 79.87 }, { name: 'C', lat: 6.92, lng: 79.88 }],
  });
  const seg = await A.get(`/api/analytics/segments?routeId=${made.data.routeId}`);
  assert.equal(seg.status, 200);
  assert.equal(seg.data.routeId, made.data.routeId);
  assert.equal(seg.data.segments.length, 2);

  const eta = await A.get('/api/analytics/eta');
  assert.equal(eta.status, 200);
  assert.equal(eta.data.samples, 0);
  assert.equal(eta.data.compared.improvementPct, null);
  assert.deepEqual(eta.data.byHorizon, []);
});

test('the buses of a route are public and empty until a driver is on duty', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const route = (await A.post('/api/routes', { name: 'Live', start: 'A', end: 'B', distance: 1 })).data;
  const res = await call('GET', `/api/routes/${route.routeId}/buses`);
  assert.equal(res.status, 200);
  assert.equal(res.data.routeId, route.routeId);
  assert.deepEqual(res.data.buses, []);
});
