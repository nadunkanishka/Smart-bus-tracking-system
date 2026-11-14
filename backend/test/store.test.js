// The latest-fix store contract. Runs against the in-memory store always, and against Redis when REDIS_URL is set
// (bus and route ids are unique to the run and removed afterwards).
const test = require('node:test');
const assert = require('node:assert/strict');
const { memoryStore, redisStore } = require('../lib/store');

const run = `${process.pid}-${Date.now()}`;
const ids = { a: `T${run}-A`, b: `T${run}-B`, r1: `TR${run}-1`, r2: `TR${run}-2` };
const fix = (busId, routeId, lat) => ({ busId, routeId, lat });

function contract(name, makeStore) {
  test(`${name}: one entry per bus, read by route`, async () => {
    const store = await makeStore();
    await store.setLast(ids.a, fix(ids.a, ids.r1, 1));
    await store.setLast(ids.a, fix(ids.a, ids.r1, 2));
    await store.setLast(ids.b, fix(ids.b, ids.r2, 3));
    assert.deepEqual((await store.byRoute(ids.r1)).map((b) => b.lat), [2]);
    assert.deepEqual((await store.getLast(ids.b)).lat, 3);
    const all = (await store.all()).filter((b) => b.busId === ids.a || b.busId === ids.b);
    assert.equal(all.length, 2);
    await store.remove(ids.a);
    await store.remove(ids.b);
    assert.deepEqual(await store.byRoute(ids.r1), []);
    assert.equal(await store.getLast(ids.a), null);
  });

  test(`${name}: a bus that moves to another route is listed only on the new one`, async () => {
    const store = await makeStore();
    await store.setLast(ids.a, fix(ids.a, ids.r1, 1));
    await store.setLast(ids.a, fix(ids.a, ids.r2, 2));
    assert.deepEqual(await store.byRoute(ids.r1), []);
    assert.deepEqual((await store.byRoute(ids.r2)).map((b) => b.lat), [2]);
    await store.remove(ids.a);
  });
}

contract('memory store', async () => memoryStore());

test('memory store: an entry disappears after its lifetime', async () => {
  let clock = 0;
  const store = memoryStore({ ttlSec: 60, now: () => clock });
  await store.setLast('B', fix('B', 'R', 1));
  clock = 59_000;
  assert.equal((await store.byRoute('R')).length, 1);
  clock = 61_000;
  assert.deepEqual(await store.byRoute('R'), []);
  assert.equal(await store.getLast('B'), null);
});

if (process.env.REDIS_URL) {
  const { createClient } = require('redis');
  let client;
  test.before(async () => { client = createClient({ url: process.env.REDIS_URL }); await client.connect(); });
  test.after(async () => {
    await client.del([`bus:${ids.a}:last`, `bus:${ids.b}:last`, `route:${ids.r1}:buses`, `route:${ids.r2}:buses`]);
    await client.sRem('buses:active', [ids.a, ids.b]);
    await client.quit();
  });

  contract('redis store', async () => redisStore(client));

  test('redis store: route members whose value expired are pruned, and a corrupt value does not break the read', async () => {
    const store = redisStore(client);
    await store.setLast(ids.a, fix(ids.a, ids.r1, 1));
    await client.sAdd(`route:${ids.r1}:buses`, ids.b); // listed, but its value is gone
    await client.set(`bus:${ids.b}:last`, '{not json');
    assert.deepEqual((await store.byRoute(ids.r1)).map((b) => b.busId), [ids.a]);
    assert.deepEqual(await client.sMembers(`route:${ids.r1}:buses`), [ids.a]);
    assert.ok((await client.ttl(`route:${ids.r1}:buses`)) > 0, 'the route set expires with its values');
    await store.remove(ids.a);
  });
} else {
  test('redis store contract', { skip: 'REDIS_URL not set' }, () => {});
}
