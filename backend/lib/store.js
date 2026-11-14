// Latest-fix cache: one entry per active bus, read by passengers on subscribe so the map is served from memory
// and high-frequency driver writes never touch MongoDB on the read path.
//
// Uses Redis when REDIS_URL is reachable. Without Redis (local dev with no Docker) it falls back to an
// in-process Map with the same interface and logs a warning; that fallback is single-instance only.
// Both implement: setLast(busId, value), getLast(busId), remove(busId), byRoute(routeId), all(), close(), kind.
const { createClient } = require('redis');
const { GONE_AFTER_MS } = require('./contract');

const TTL_SEC = GONE_AFTER_MS / 1000; // a bus that has sent nothing for this long drops off the map
const key = (busId) => `bus:${busId}:last`;
const routeKey = (routeId) => `route:${routeId}:buses`;
const ACTIVE = 'buses:active';

function memoryStore({ ttlSec = TTL_SEC, now = Date.now } = {}) {
  const last = new Map();
  const live = (busId) => {
    const e = last.get(busId);
    if (e && e.expires > now()) return e.value;
    last.delete(busId);
    return null;
  };
  return {
    kind: 'memory',
    async setLast(busId, value) { last.set(busId, { value, expires: now() + ttlSec * 1000 }); },
    async getLast(busId) { return live(busId); },
    async remove(busId) { last.delete(busId); },
    async byRoute(routeId) { return [...last.keys()].map(live).filter((v) => v && v.routeId === routeId); },
    async all() { return [...last.keys()].map(live).filter(Boolean); },
    async close() {},
  };
}

const parse = (raw) => {
  try { return JSON.parse(raw); } catch { return null; }
};

// The index sets (per route, and all active buses) only list ids; the value under key(busId) is the truth. Members
// whose value expired, is unreadable, or (for a route) now belongs to another route are pruned when read, and each
// route set expires with its newest value, so the sets never outlive their keys.
function redisStore(client, { ttlSec = TTL_SEC } = {}) {
  async function read(setKey, belongs = () => true) {
    const ids = await client.sMembers(setKey);
    if (!ids.length) return [];
    const rows = await client.mGet(ids.map(key));
    const out = [];
    const stale = [];
    rows.forEach((raw, i) => {
      const v = raw == null ? null : parse(raw);
      if (v && belongs(v)) out.push(v);
      else stale.push(ids[i]);
    });
    if (stale.length) await client.sRem(setKey, stale);
    return out;
  }
  return {
    kind: 'redis',
    async setLast(busId, value) {
      await client.multi()
        .setEx(key(busId), ttlSec, JSON.stringify(value))
        .sAdd(routeKey(value.routeId), busId)
        .expire(routeKey(value.routeId), ttlSec)
        .sAdd(ACTIVE, busId)
        .exec();
    },
    async getLast(busId) { const r = await client.get(key(busId)); return r == null ? null : parse(r); },
    async remove(busId) {
      const v = await this.getLast(busId);
      const m = client.multi().del(key(busId)).sRem(ACTIVE, busId);
      if (v) m.sRem(routeKey(v.routeId), busId);
      await m.exec();
    },
    async byRoute(routeId) { return read(routeKey(routeId), (v) => v.routeId === routeId); },
    async all() { return read(ACTIVE); },
    async close() { await client.quit(); },
  };
}

async function createStore(url) {
  if (!url) {
    console.warn('[store] REDIS_URL not set: using the in-memory fallback (single instance, dev only).');
    return memoryStore();
  }
  // Give up quickly if Redis is not there at startup; once connected, keep reconnecting with a short backoff.
  let connected = false;
  const client = createClient({ url, socket: { connectTimeout: 2000, reconnectStrategy: (n) => (!connected && n > 3 ? false : Math.min(n * 200, 3000)) } });
  client.on('error', (err) => { if (connected) console.error('[store] Redis error:', err.message); });
  try {
    await client.connect();
    connected = true;
    console.log('[store] Redis connected');
    return redisStore(client);
  } catch (err) {
    console.warn(`[store] Redis unreachable (${err.message}): using the in-memory fallback (dev only).`);
    return memoryStore();
  }
}

module.exports = { createStore, memoryStore, redisStore };
