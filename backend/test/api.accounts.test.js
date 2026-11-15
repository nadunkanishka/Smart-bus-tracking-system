// API: passenger and admin accounts.
// Real server, throwaway MongoDB database (see test/helpers/api.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { createApi } = require('./helpers/api');

const api = createApi('accounts');
const { call, as, guard } = api;
test.before(api.start);
test.after(api.stop);

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
  assert.equal((await as(api.admin).get('/api/passengers/me')).status, 403);

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
  const A = as(api.admin);
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
  const A = as(api.admin);
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

test('passengers: a legacy plaintext password signs in and is stored hashed from then on', async (t) => {
  if (guard(t)) return;
  await mongoose.connect(`${api.BASE_URI}/${api.DB}`);
  try {
    const passengers = mongoose.connection.collection('passengers');
    await passengers.insertOne({ username: 'legacy.user', password: 'plain12', name: 'Legacy User', phone: '' });
    const login = await call('POST', '/api/passengers/login', { body: { username: 'legacy.user', password: 'plain12' } });
    assert.equal(login.status, 200);
    const stored = (await passengers.findOne({ username: 'legacy.user' })).password;
    assert.notEqual(stored, 'plain12');
    assert.equal((await call('POST', '/api/passengers/login', { body: { username: 'legacy.user', password: 'plain12' } })).status, 200, 'the hash verifies');
  } finally {
    await mongoose.disconnect();
  }
});
