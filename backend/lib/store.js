// Latest-fix cache: one entry per active bus, read by passengers on subscribe so the map is served from memory
// and high-frequency driver writes never touch MongoDB on the read path.
//
// Uses Redis when REDIS_URL is reachable. Without Redis (local dev with no Docker) it falls back to an
// in-process Map with the same interface and logs a warning; that fallback is single-instance only.
const { createClient } = require('redis');

const TTL_SEC = 60; // a bus that has sent nothing for a minute drops off the map
const key = (busId) => `bus:${busId}:last`;
const routeKey = (routeId) => `route:${routeId}:buses`;

function memoryStore() {
  const last = new Map(); // busId -> { value, expires }
  const live = (busId) => {
    const e = last.get(busId);
    if (e && e.expires > Date.now()) return e.value;
    last.delete(busId);
    return null;
  };
  return {
    kind: 'memory',
    async setLast(busId, value) { last.set(busId, { value, expires: Date.now() + TTL_SEC * 1000 }); },
    async getLast(busId) { return live(busId); },
    async remove(busId) { last.delete(busId); },
    async byRoute(routeId) { return [...last.keys()].map(live).filter((v) => v && v.routeId === routeId); },
    async all() { return [...last.keys()].map(live).filter(Boolean); },
    async close() {},
  };
}

function redisStore(client) {
  const read = async (ids) => {
    if (!ids.length) return [];
    const rows = await client.mGet(ids.map(key));
    return rows.filter(Boolean).map((r) => JSON.parse(r));
  };
  return {
    kind: 'redis',
    async setLast(busId, value) {
      await client.multi()
        .set(key(busId), JSON.stringify(value), { EX: TTL_SEC })
        .sAdd(routeKey(value.routeId), busId)
        .sAdd('buses:active', busId)
        .exec();
    },
    async getLast(busId) { const r = await client.get(key(busId)); return r ? JSON.parse(r) : null; },
    async remove(busId) {
      const v = await this.getLast(busId);
      const m = client.multi().del(key(busId)).sRem('buses:active', busId);
      if (v) m.sRem(routeKey(v.routeId), busId);
      await m.exec();
    },
    async byRoute(routeId) { return read(await client.sMembers(routeKey(routeId))); },
    async all() { return read(await client.sMembers('buses:active')); },
    async close() { await client.quit(); },
  };
}

async function createStore(url = process.env.REDIS_URL) {
  if (!url) {
    console.warn('[store] REDIS_URL not set: using the in-memory fallback (single instance, dev only).');
    return memoryStore();
  }
  const client = createClient({ url, socket: { connectTimeout: 2000, reconnectStrategy: (n) => (n > 3 ? false : 300) } });
  client.on('error', () => {}); // connection errors are handled by the connect() rejection below
  try {
    await client.connect();
    console.log('[store] Redis connected');
    return redisStore(client);
  } catch (err) {
    console.warn(`[store] Redis unreachable (${err.message}): using the in-memory fallback (dev only).`);
    return memoryStore();
  }
}

module.exports = { createStore, memoryStore, TTL_SEC };
