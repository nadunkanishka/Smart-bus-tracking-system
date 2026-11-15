// API: drivers, buses and the references between them.
// Real server, throwaway MongoDB database (see test/helpers/api.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { createApi } = require('./helpers/api');

const api = createApi('catalog');
const { call, as, guard } = api;
test.before(api.start);
test.after(api.stop);

test('drivers: create, read one, list, update, delete', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
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
  const A = as(api.admin);
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

test('relations: deleting a record never leaves a dangling reference', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const driver = (await A.post('/api/drivers', { name: 'Rel Driver', license: 'L-REL', expiry: '2030-01-01', phone: '0713333333' })).data;
  const bus = (await A.post('/api/buses', { registration: 'NB-REL', capacity: 40, mileage: 1, password: 'pw1234', assignedDriver: driver.driverId })).data;
  const route = (await A.post('/api/routes', { name: 'Rel', start: 'A', end: 'B', distance: 1, busIds: [bus.busId] })).data;
  assert.deepEqual(route.busIds, [bus.busId]);
  assert.equal((await A.get(`/api/buses/${bus.busId}`)).data.routeId, route.routeId);

  // deleting the driver frees the bus
  const delDriver = await A.del(`/api/drivers/${driver.driverId}`);
  assert.equal(delDriver.data.unassignedBuses, 1);
  assert.equal((await A.get(`/api/buses/${bus.busId}`)).data.assignedDriver, '');

  // deleting the route frees its buses
  await A.del(`/api/routes/${route.routeId}`);
  assert.equal((await A.get(`/api/buses/${bus.busId}`)).data.routeId, '');

  // deleting a bus takes it off its route
  const again = (await A.post('/api/routes', { name: 'Rel2', start: 'A', end: 'B', distance: 1, busIds: [bus.busId] })).data;
  await A.del(`/api/buses/${bus.busId}`);
  assert.deepEqual((await A.get(`/api/routes/${again.routeId}`)).data.busIds, []);
  await A.del(`/api/routes/${again.routeId}`);
});

test('new ids skip records that were imported ahead of the counter', async (t) => {
  if (guard(t)) return;
  const A = as(api.admin);
  const first = (await A.post('/api/drivers', { name: 'Ctr A', license: 'L-CTR-A', expiry: '2030-01-01', phone: '0714444441' })).data;
  const n = Number(first.driverId.slice(4));
  // A driver written straight into the database (an import) with the next two ids, so the counter is behind.
  await mongoose.connect(`${api.BASE_URI}/${api.DB}`);
  try {
    const drivers = mongoose.connection.collection('drivers');
    for (const k of [n + 1, n + 2]) await drivers.insertOne({ driverId: `DRV-${String(k).padStart(3, '0')}`, name: `Imported ${k}`, license: `L-IMP-${k}`, expiry: '2030-01-01', phone: `07155500${k}`, status: 'Active' });
  } finally {
    await mongoose.disconnect();
  }
  const made = await A.post('/api/drivers', { name: 'Ctr B', license: 'L-CTR-B', expiry: '2030-01-01', phone: '0714444442' });
  assert.equal(made.status, 201, 'saving works instead of failing with "already in use"');
  assert.equal(made.data.driverId, `DRV-${String(n + 3).padStart(3, '0')}`);
});
