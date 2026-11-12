// CRUD integration tests: start the real server against a throwaway MongoDB database and call every endpoint.
// Needs MongoDB (MONGODB_TEST_URI, default mongodb://127.0.0.1:27017). Skipped, not failed, when it is unreachable.
const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');
const path = require('node:path');
const mongoose = require('mongoose');

const BASE_URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017';
const DB = `smartbus_crud_${process.pid}`;
const ADMIN_PW = 'crud-admin-pass';
let proc;
let URL;
let admin; // admin token
let skipReason = '';

const mongoUp = () => new Promise((resolve) => {
  const u = new (require('node:url').URL)(BASE_URI);
  const s = net.connect({ host: u.hostname, port: Number(u.port || 27017) }, () => { s.destroy(); resolve(true); });
  s.on('error', () => resolve(false));
  s.setTimeout(1500, () => { s.destroy(); resolve(false); });
});

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

async function call(method, p, { token, body } = {}) {
  const res = await fetch(`${URL}${p}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const as = (token) => ({
  get: (p) => call('GET', p, { token }),
  post: (p, body) => call('POST', p, { token, body }),
  put: (p, body) => call('PUT', p, { token, body }),
  del: (p, body) => call('DELETE', p, { token, body }),
});

test.before(async () => {
  if (!(await mongoUp())) { skipReason = `MongoDB not reachable at ${BASE_URI}`; return; }
  const port = await freePort();
  URL = `http://127.0.0.1:${port}`;
  proc = spawn(process.execPath, ['index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), MONGODB_URI: `${BASE_URI}/${DB}`, REDIS_URL: '', JWT_SECRET: 'crud-test-secret', ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: ADMIN_PW, CORS_ORIGIN: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i += 1) {
    try { const r = await fetch(`${URL}/api/health`); if (r.ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250)); // eslint-disable-line no-await-in-loop
  }
  const login = await call('POST', '/api/auth/login', { body: { username: 'admin', password: ADMIN_PW } });
  admin = login.data.token;
});

test.after(async () => {
  if (proc) proc.kill();
  if (skipReason) return;
  await mongoose.connect(`${BASE_URI}/${DB}`);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const guard = (t) => { if (skipReason) { t.skip(skipReason); return true; } return false; };

test('drivers: create, read one, list, update, delete', async (t) => {
  if (guard(t)) return;
  const A = as(admin);
  const bad = await A.post('/api/drivers', { name: 'No License' });
  assert.equal(bad.status, 400);

  const made = await A.post('/api/drivers', { name: 'Kamal Perera', license: 'L-1', expiry: '2030-01-01', phone: '0711111111' });
  assert.equal(made.status, 201);
  assert.match(made.data.driverId, /^DRV-\d{3}$/);
  assert.equal(made.data.status, 'Active');

  const dup = await A.post('/api/drivers', { name: 'Other', license: 'L-1', expiry: '2030-01-01', phone: '0712222222' });
  assert.equal(dup.status, 409);
  assert.match(dup.data.error, /license number \(L-1\) is already in use/);

  const one = await A.get(`/api/drivers/${made.data.driverId}`);
  assert.equal(one.status, 200);
  assert.equal(one.data.name, 'Kamal Perera');
  assert.equal((await A.get('/api/drivers/DRV-999')).status, 404);

  assert.ok((await A.get('/api/drivers')).data.some((d) => d.driverId === made.data.driverId));

  // A body cannot rewrite the identifier; allowed fields do change.
  const upd = await A.put(`/api/drivers/${made.data.driverId}`, { phone: '0770000000', status: 'On Leave', driverId: 'HACKED' });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.phone, '0770000000');
  assert.equal(upd.data.status, 'On Leave');
  assert.equal(upd.data.driverId, made.data.driverId);
  assert.equal((await A.put(`/api/drivers/${made.data.driverId}`, { status: 'Flying' })).status, 400);
  assert.equal((await A.put('/api/drivers/DRV-999', { name: 'x' })).status, 404);

  assert.equal((await A.del(`/api/drivers/${made.data.driverId}`)).status, 200);
  assert.equal((await A.del(`/api/drivers/${made.data.driverId}`)).status, 404);
  assert.equal((await A.get(`/api/drivers/${made.data.driverId}`)).status, 404);
});

test('buses: create, read one, list, update (keeps password), delete', async (t) => {
  if (guard(t)) return;
  const A = as(admin);
  assert.equal((await A.post('/api/buses', { capacity: 52 })).status, 400);
  assert.equal((await A.post('/api/buses', { registration: 'NB-1', capacity: 52, mileage: 10, password: 'pw', assignedDriver: 'DRV-404' })).status, 400, 'unknown driver is rejected');

  const made = await A.post('/api/buses', { registration: 'NB-1', capacity: 52, mileage: 1000, password: 'busPass1' });
  assert.equal(made.status, 201);
  assert.equal(made.data.hasPassword, true);
  assert.equal(made.data.password, undefined, 'password hash is never returned');
  assert.equal((await A.post('/api/buses', { registration: 'NB-1', capacity: 40, mileage: 5, password: 'x' })).status, 409);

  const one = await A.get(`/api/buses/${made.data.busId}`);
  assert.equal(one.status, 200);
  assert.equal(one.data.registration, 'NB-1');
  assert.equal((await A.get('/api/buses/BUS-999')).status, 404);
  assert.ok((await A.get('/api/buses')).data.some((b) => b.busId === made.data.busId));

  const upd = await A.put(`/api/buses/${made.data.busId}`, { mileage: 1500, status: 'Maintenance', busId: 'HACKED', password: '' });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.mileage, 1500);
  assert.equal(upd.data.status, 'Maintenance');
  assert.equal(upd.data.busId, made.data.busId);
  assert.equal(upd.data.hasPassword, true, 'blank password keeps the old one');
  assert.equal((await A.put('/api/buses/BUS-999', { mileage: 1 })).status, 404);
  assert.equal((await A.put(`/api/buses/${made.data.busId}`, { capacity: 0 })).status, 400, 'capacity 0 is rejected, not ignored');

  // the bus can still sign in with its original password after an update without one
  const login = await call('POST', '/api/auth/driver-login', { body: { registration: 'NB-1', password: 'busPass1' } });
  assert.equal(login.status, 200);

  assert.equal((await A.del(`/api/buses/${made.data.busId}`)).status, 200);
  assert.equal((await A.del(`/api/buses/${made.data.busId}`)).status, 404);
});

test('routes: create, read one, list, update, delete', async (t) => {
  if (guard(t)) return;
  const A = as(admin);
  const body = {
    name: 'Fort - Borella', start: 'Fort', end: 'Borella', distance: 6.5, routeNumber: '138',
    path: [[6.9, 79.86], [6.91, 79.87], [6.92, 79.88]],
    stopPoints: [{ name: 'Fort', lat: 6.9, lng: 79.86 }, { name: 'Town Hall', lat: 6.91, lng: 79.87 }, { name: 'Borella', lat: 6.92, lng: 79.88 }],
  };
  assert.equal((await A.post('/api/routes', { name: 'x' })).status, 400);
  assert.equal((await A.post('/api/routes', { ...body, path: [[6.9, 79.86]] })).status, 400);
  assert.equal((await A.post('/api/routes', { ...body, assignedBus: 'GHOST (BUS-404)' })).status, 400, 'unknown bus is rejected');

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

test('relations: deleting or renaming a record never leaves a dangling reference', async (t) => {
  if (guard(t)) return;
  const A = as(admin);
  const driver = (await A.post('/api/drivers', { name: 'Rel Driver', license: 'L-REL', expiry: '2030-01-01', phone: '0713333333' })).data;
  const bus = (await A.post('/api/buses', { registration: 'NB-REL', capacity: 40, mileage: 1, password: 'pw1234', assignedDriver: driver.driverId })).data;
  const route = (await A.post('/api/routes', { name: 'Rel', start: 'A', end: 'B', distance: 1, assignedBus: `${bus.registration} (${bus.busId})` })).data;
  assert.equal(route.assignedBus, 'NB-REL (' + bus.busId + ')');

  // renaming the bus updates the route that points at it
  const renamed = await A.put(`/api/buses/${bus.busId}`, { registration: 'NB-NEW' });
  assert.equal(renamed.status, 200);
  assert.equal((await A.get(`/api/routes/${route.routeId}`)).data.assignedBus, `NB-NEW (${bus.busId})`);

  // deleting the driver frees the bus
  const delDriver = await A.del(`/api/drivers/${driver.driverId}`);
  assert.equal(delDriver.data.unassignedBuses, 1);
  assert.equal((await A.get(`/api/buses/${bus.busId}`)).data.assignedDriver, '');

  // deleting the bus frees the route
  const delBus = await A.del(`/api/buses/${bus.busId}`);
  assert.equal(delBus.data.unassignedRoutes, 1);
  assert.equal((await A.get(`/api/routes/${route.routeId}`)).data.assignedBus, '');

  await A.del(`/api/routes/${route.routeId}`);
});

test('driver login finds the route of exactly that bus, not a bus whose registration contains it', async (t) => {
  if (guard(t)) return;
  const A = as(admin);
  const b1 = (await A.post('/api/buses', { registration: 'NB-1', capacity: 40, mileage: 1, password: 'pw1234' })).data;
  const b12 = (await A.post('/api/buses', { registration: 'NB-12', capacity: 40, mileage: 1, password: 'pw1234' })).data;
  const route = (await A.post('/api/routes', { name: 'Only NB-12', start: 'A', end: 'B', distance: 1, assignedBus: `NB-12 (${b12.busId})` })).data;
  const login = (reg) => call('POST', '/api/auth/driver-login', { body: { registration: reg, password: 'pw1234' } });
  assert.equal((await login('NB-1')).data.assignedRoute, null);
  assert.equal((await login('NB-12')).data.assignedRoute.routeId, route.routeId);
  await A.del(`/api/routes/${route.routeId}`);
  await A.del(`/api/buses/${b1.busId}`);
  await A.del(`/api/buses/${b12.busId}`);
});

test('passengers: register, read, update, change password, delete own account', async (t) => {
  if (guard(t)) return;
  const reg = await call('POST', '/api/passengers/register', { body: { username: 'Nimal.P', password: 'secret1', name: 'Nimal P', phone: '0770001111' } });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.user.username, 'nimal.p');
  assert.equal((await call('POST', '/api/passengers/register', { body: { username: 'nimal.p', password: 'secret1', name: 'Dup' } })).status, 409);
  const P = as(reg.data.token);

  const me = await P.get('/api/passengers/me');
  assert.equal(me.status, 200);
  assert.equal(me.data.user.name, 'Nimal P');
  assert.equal(me.data.user.password, undefined);
  assert.equal((await call('GET', '/api/passengers/me')).status, 401);
  assert.equal((await as(admin).get('/api/passengers/me')).status, 403);

  const upd = await P.put('/api/passengers/me', { name: 'Nimal Perera', phone: '0771112222', username: 'hacker' });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.user.name, 'Nimal Perera');
  assert.equal(upd.data.user.phone, '0771112222');
  assert.equal(upd.data.user.username, 'nimal.p', 'username cannot be changed');
  assert.equal((await P.put('/api/passengers/me', { name: '  ' })).status, 400);

  assert.equal((await P.put('/api/passengers/me/password', { currentPassword: 'wrong', newPassword: 'newsecret' })).status, 401);
  assert.equal((await P.put('/api/passengers/me/password', { currentPassword: 'secret1', newPassword: '123' })).status, 400);
  assert.equal((await P.put('/api/passengers/me/password', { currentPassword: 'secret1', newPassword: 'newsecret' })).status, 200);
  assert.equal((await call('POST', '/api/passengers/login', { body: { username: 'nimal.p', password: 'secret1' } })).status, 401);
  assert.equal((await call('POST', '/api/passengers/login', { body: { username: 'nimal.p', password: 'newsecret' } })).status, 200);

  assert.equal((await P.del('/api/passengers/me', { password: 'wrong' })).status, 401);
  assert.equal((await P.del('/api/passengers/me', { password: 'newsecret' })).status, 200);
  assert.equal((await call('POST', '/api/passengers/login', { body: { username: 'nimal.p', password: 'newsecret' } })).status, 401);
  assert.equal((await P.get('/api/passengers/me')).status, 404, 'a token for a deleted account is refused');
});

test('passengers: admin can list and delete accounts, passengers cannot', async (t) => {
  if (guard(t)) return;
  const reg = await call('POST', '/api/passengers/register', { body: { username: 'listed.user', password: 'secret1', name: 'Listed User' } });
  const A = as(admin);
  assert.equal((await as(reg.data.token).get('/api/passengers')).status, 403);
  assert.equal((await call('GET', '/api/passengers')).status, 401);
  const list = await A.get('/api/passengers');
  assert.equal(list.status, 200);
  const row = list.data.find((p) => p.username === 'listed.user');
  assert.ok(row);
  assert.equal(row.password, undefined);
  assert.equal((await as(reg.data.token).del(`/api/passengers/${row.id}`)).status, 403);
  assert.equal((await A.del(`/api/passengers/${row.id}`)).status, 200);
  assert.equal((await A.del(`/api/passengers/${row.id}`)).status, 404);
});

test('admins: create, list, read, update, change password, delete, with safety guards', async (t) => {
  if (guard(t)) return;
  const A = as(admin);
  assert.equal((await A.post('/api/admins', { username: 'ab', password: 'longenough1' })).status, 400);
  assert.equal((await A.post('/api/admins', { username: 'second.admin', password: 'short' })).status, 400);
  const made = await A.post('/api/admins', { username: 'second.admin', password: 'longenough1', name: 'Second Admin' });
  assert.equal(made.status, 201);
  assert.equal(made.data.password, undefined);
  assert.equal((await A.post('/api/admins', { username: 'second.admin', password: 'longenough1' })).status, 409);

  assert.ok((await A.get('/api/admins')).data.length >= 2);
  assert.equal((await A.get(`/api/admins/${made.data.id}`)).data.username, 'second.admin');
  assert.equal((await A.get('/api/admins/000000000000000000000000')).status, 404);

  const upd = await A.put(`/api/admins/${made.data.id}`, { name: 'Renamed', username: 'hacker' });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.name, 'Renamed');
  assert.equal(upd.data.username, 'second.admin');

  // the new admin signs in, changes their own password, and the old one stops working
  const login = await call('POST', '/api/auth/login', { body: { username: 'second.admin', password: 'longenough1' } });
  assert.equal(login.status, 200);
  const B = as(login.data.token);
  assert.equal((await B.put('/api/admins/me/password', { currentPassword: 'nope', newPassword: 'anotherpass1' })).status, 401);
  assert.equal((await B.put('/api/admins/me/password', { currentPassword: 'longenough1', newPassword: 'short' })).status, 400);
  assert.equal((await B.put('/api/admins/me/password', { currentPassword: 'longenough1', newPassword: 'anotherpass1' })).status, 200);
  assert.equal((await call('POST', '/api/auth/login', { body: { username: 'second.admin', password: 'longenough1' } })).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { body: { username: 'second.admin', password: 'anotherpass1' } })).status, 200);

  // passengers and anonymous callers cannot touch admin accounts
  const pax = await call('POST', '/api/passengers/register', { body: { username: 'not.admin', password: 'secret1', name: 'Not Admin' } });
  assert.equal((await as(pax.data.token).get('/api/admins')).status, 403);
  assert.equal((await call('GET', '/api/admins')).status, 401);

  // safety: cannot delete yourself
  assert.equal((await B.del(`/api/admins/${made.data.id}`)).status, 400);
  assert.equal((await A.del(`/api/admins/${made.data.id}`)).status, 200);
  assert.equal((await A.del(`/api/admins/${made.data.id}`)).status, 404);
  // safety: the last admin stays (the only remaining one is the signed-in main admin, so deleting yourself is refused first)
  const rest = (await A.get('/api/admins')).data;
  assert.equal(rest.length, 1);
  assert.equal((await A.del(`/api/admins/${rest[0].id}`)).status, 400);
});
