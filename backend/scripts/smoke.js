// Calls every REST endpoint in a fixed order and prints one line per call with volatile values masked,
// so two runs can be diffed.  Run against an EMPTY throwaway database, never your real one:
//   PORT=5050 MONGODB_URI=mongodb://127.0.0.1:27017/smartbus_smoke ADMIN_PASSWORD=smoke-pass node index.js
//   node scripts/smoke.js --url http://localhost:5050 --password smoke-pass > out.txt
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const URL = arg('url', 'http://localhost:5050');
const ADMIN_PASSWORD = arg('password', 'smoke-pass');

const VOLATILE = new Set(['_id', 'id', 'token', 'createdAt', 'updatedAt', 'serverTs', 'uptimeSec', 'password']);
const mask = (v, key) => {
  if (Array.isArray(v)) return v.map((x) => mask(x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, mask(v[k], k)]));
  return VOLATILE.has(key) && v !== null && v !== '' ? `<${key}>` : v;
};

async function call(label, method, path, { token, body } = {}) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.replace(/\s+/g, ' ').slice(0, 120); }
  console.log(`${label} | ${method} ${path} | ${res.status} | ${JSON.stringify(mask(data))}`);
  return data;
}

(async () => {
  const path = [[6.9, 79.86], [6.91, 79.87], [6.92, 79.88]];
  const stopPoints = [{ name: 'Fort', lat: 6.9, lng: 79.86 }, { name: 'Town Hall', lat: 6.91, lng: 79.87 }, { name: 'Borella', lat: 6.92, lng: 79.88 }];

  await call('health', 'GET', '/api/health');
  await call('unknown path', 'GET', '/api/nope');

  await call('admin login: empty', 'POST', '/api/auth/login', { body: {} });
  await call('admin login: wrong', 'POST', '/api/auth/login', { body: { username: 'admin', password: 'nope' } });
  const admin = (await call('admin login: ok', 'POST', '/api/auth/login', { body: { username: 'admin', password: ADMIN_PASSWORD } })).token;

  await call('passenger register: bad username', 'POST', '/api/passengers/register', { body: { username: 'x', password: 'secret1', name: 'A' } });
  await call('passenger register: short password', 'POST', '/api/passengers/register', { body: { username: 'smoke.user', password: '123', name: 'A' } });
  await call('passenger register: no name', 'POST', '/api/passengers/register', { body: { username: 'smoke.user', password: 'secret1' } });
  await call('passenger register: ok', 'POST', '/api/passengers/register', { body: { username: 'Smoke.User', password: 'secret1', name: 'Smoke User', phone: '0771234567' } });
  await call('passenger register: duplicate', 'POST', '/api/passengers/register', { body: { username: 'smoke.user', password: 'secret1', name: 'Again' } });
  await call('passenger login: empty', 'POST', '/api/passengers/login', { body: {} });
  await call('passenger login: wrong', 'POST', '/api/passengers/login', { body: { username: 'smoke.user', password: 'nope' } });
  const passenger = (await call('passenger login: ok', 'POST', '/api/passengers/login', { body: { username: 'smoke.user', password: 'secret1' } })).token;

  for (const p of ['/api/dashboard/summary', '/api/drivers', '/api/buses', '/api/live', '/api/metrics', '/api/analytics/eta']) {
    await call('guard: no token', 'GET', p);
    await call('guard: passenger token', 'GET', p, { token: passenger });
  }
  await call('guard: bad token', 'GET', '/api/drivers', { token: 'not-a-token' });
  await call('guard: route write without token', 'POST', '/api/routes', { body: { name: 'x' } });
  await call('guard: route write as passenger', 'DELETE', '/api/routes/RT-001', { token: passenger });

  await call('summary: empty', 'GET', '/api/dashboard/summary', { token: admin });

  await call('drivers: empty', 'GET', '/api/drivers', { token: admin });
  await call('drivers: create invalid', 'POST', '/api/drivers', { token: admin, body: { name: 'No Licence' } });
  const { driverId } = await call('drivers: create', 'POST', '/api/drivers', { token: admin, body: { name: 'Kamal Perera', license: 'B1234567', expiry: '2030-01-01', phone: '0711111111' } });
  await call('drivers: update', 'PUT', `/api/drivers/${driverId}`, { token: admin, body: { status: 'On Leave' } });
  await call('drivers: update bad status', 'PUT', `/api/drivers/${driverId}`, { token: admin, body: { status: 'Flying' } });
  await call('drivers: update unknown', 'PUT', '/api/drivers/DRV-999', { token: admin, body: { status: 'Active' } });
  await call('drivers: list', 'GET', '/api/drivers', { token: admin });

  await call('buses: create invalid', 'POST', '/api/buses', { token: admin, body: { capacity: 40 } });
  const { busId } = await call('buses: create', 'POST', '/api/buses', { token: admin, body: { registration: 'NB-4712', capacity: '52', mileage: '12000', password: 'bus-pass', assignedDriver: driverId } });
  await call('buses: update keeps password', 'PUT', `/api/buses/${busId}`, { token: admin, body: { mileage: '12500', password: '', hasPassword: true } });
  await call('buses: update unknown', 'PUT', '/api/buses/BUS-999', { token: admin, body: { mileage: 1 } });
  await call('buses: list', 'GET', '/api/buses', { token: admin });

  await call('driver login: empty', 'POST', '/api/auth/driver-login', { body: {} });
  await call('driver login: unknown bus', 'POST', '/api/auth/driver-login', { body: { registration: 'ZZ-0000', password: 'x' } });
  await call('driver login: wrong password', 'POST', '/api/auth/driver-login', { body: { registration: 'NB-4712', password: 'x' } });
  await call('driver login: ok, no route', 'POST', '/api/auth/driver-login', { body: { registration: 'NB-4712', password: 'bus-pass' } });

  await call('routes: public list, empty', 'GET', '/api/routes');
  await call('routes: create invalid', 'POST', '/api/routes', { token: admin, body: { name: 'No terminals' } });
  await call('routes: create bad path', 'POST', '/api/routes', { token: admin, body: { name: 'R', start: 'A', end: 'B', distance: 5, path: [[6.9, 79.86]] } });
  await call('routes: create unnamed stop', 'POST', '/api/routes', { token: admin, body: { name: 'R', start: 'A', end: 'B', distance: 5, stopPoints: [{ lat: 6.9, lng: 79.86 }] } });
  const { routeId } = await call('routes: create', 'POST', '/api/routes', { token: admin, body: { name: 'Fort - Borella', start: 'Fort', end: 'Borella', distance: '6.5', routeNumber: '138', assignedBus: 'NB-4712', path, stopPoints } });
  await call('routes: update', 'PUT', `/api/routes/${routeId}`, { token: admin, body: { distance: '7', stops: 'not-an-array' } });
  await call('routes: update unknown', 'PUT', '/api/routes/RT-999', { token: admin, body: { distance: 1 } });
  await call('routes: public list', 'GET', '/api/routes');
  await call('routes: live buses', 'GET', `/api/routes/${routeId}/buses`);
  await call('driver login: ok, with route', 'POST', '/api/auth/driver-login', { body: { busId, password: 'bus-pass' } });

  await call('summary', 'GET', '/api/dashboard/summary', { token: admin });
  await call('live', 'GET', '/api/live', { token: admin });
  await call('metrics', 'GET', '/api/metrics', { token: admin });
  await call('analytics segments: unknown route', 'GET', '/api/analytics/segments?routeId=RT-999', { token: admin });
  await call('analytics segments', 'GET', `/api/analytics/segments?routeId=${routeId}`, { token: admin });
  await call('analytics eta', 'GET', `/api/analytics/eta?routeId=${routeId}`, { token: admin });
  await call('analytics eta: all routes', 'GET', '/api/analytics/eta', { token: admin });

  await call('routes: clear path', 'PUT', `/api/routes/${routeId}`, { token: admin, body: { path: [] } });
  await call('routes: delete', 'DELETE', `/api/routes/${routeId}`, { token: admin });
  await call('routes: delete again', 'DELETE', `/api/routes/${routeId}`, { token: admin });
  await call('buses: delete by registration', 'DELETE', '/api/buses/NB-4712', { token: admin });
  await call('buses: delete again', 'DELETE', `/api/buses/${busId}`, { token: admin });
  await call('drivers: delete', 'DELETE', `/api/drivers/${driverId}`, { token: admin });
  await call('drivers: delete again', 'DELETE', `/api/drivers/${driverId}`, { token: admin });
})().catch((err) => { console.error(err); process.exit(1); });
