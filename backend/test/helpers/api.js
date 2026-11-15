// Starts the real server against a throwaway MongoDB database for the API tests (test/api.*.test.js).
// Needs MongoDB (MONGODB_TEST_URI, default the local MongoDB in config/env.js). The tests are skipped when it is unreachable,
// except when the CI environment variable is set: then they fail.
const net = require('node:net');
const { spawn } = require('node:child_process');
const path = require('node:path');
const mongoose = require('mongoose');
const { MONGO_HOST } = require('../../config/env');

const BASE_URI = process.env.MONGODB_TEST_URI || MONGO_HOST;
const ADMIN_PW = 'crud-admin-pass';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mongoUp = () => new Promise((resolve) => {
  const u = new (require('node:url').URL)(BASE_URI);
  const s = net.connect({ host: u.hostname, port: Number(u.port || 27017) }, () => { s.destroy(); resolve(true); });
  s.on('error', () => resolve(false));
  s.setTimeout(1500, () => { s.destroy(); resolve(false); });
});

const anyFreePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Test files run in parallel, each starting its own server. A port taken from the operating system and released before the
// server starts can be handed to two files at once, so each file tries a port derived from its own process id first.
const freePort = async () => {
  const wanted = 20000 + (process.pid % 30000);
  const free = await new Promise((resolve) => {
    const s = net.createServer().once('error', () => resolve(false)).listen(wanted, () => s.close(() => resolve(true)));
  });
  return free ? wanted : anyFreePort();
};

// One harness per test file: its own server process and its own database (named after the file and the process).
function createApi(label) {
  const DB = `smartbus_${label}_${process.pid}`;
  let proc;
  let URL;
  let skipReason = '';
  const api = { BASE_URI, DB, admin: null };

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
  api.call = call;
  api.as = (token) => ({
    get: (p) => call('GET', p, { token }),
    post: (p, body) => call('POST', p, { token, body }),
    put: (p, body) => call('PUT', p, { token, body }),
    del: (p, body) => call('DELETE', p, { token, body }),
  });

  // Waits until the server answers and the first admin account exists (it is created just after MongoDB connects).
  // Sign-in attempts share one rate limit with the tests, so the polling is gentle.
  async function waitForAdmin() {
    for (let i = 0; i < 80 && proc.exitCode === null; i += 1) {
      try { if ((await fetch(`${URL}/api/health`)).ok) break; } catch { /* not listening yet */ }
      await sleep(250);
    }
    for (let i = 0; i < 15 && proc.exitCode === null; i += 1) {
      try {
        const login = await call('POST', '/api/auth/login', { body: { username: 'admin', password: ADMIN_PW } });
        if (login.status === 200) return login.data.token;
      } catch { /* not listening yet */ }
      await sleep(400);
    }
    return null;
  }

  api.start = async () => {
    if (!(await mongoUp())) {
      // On CI a missing database is a broken setup, not a reason to skip.
      if (process.env.CI) throw new Error(`MongoDB not reachable at ${BASE_URI} (CI is set, so this fails instead of skipping)`);
      skipReason = `MongoDB not reachable at ${BASE_URI}`;
      return;
    }
    // A database left behind by an interrupted run (process ids get reused) must not leak into this one.
    await mongoose.connect(`${BASE_URI}/${DB}`);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    const port = await freePort();
    URL = `http://127.0.0.1:${port}`;
    let stderr = '';
    proc = spawn(process.execPath, ['index.js'], {
      cwd: path.join(__dirname, '..', '..'),
      env: { ...process.env, PORT: String(port), MONGODB_URI: `${BASE_URI}/${DB}`, REDIS_URL: '', JWT_SECRET: 'crud-test-secret', ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: ADMIN_PW, CORS_ORIGIN: '' },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    proc.stderr.on('data', (d) => { stderr += d; });
    api.admin = await waitForAdmin();
    if (!api.admin) throw new Error(`The server did not start or never created the admin account.\n--- server stderr ---\n${stderr || '(empty)'}`);
  };

  api.stop = async () => {
    if (proc) proc.kill();
    if (skipReason) return;
    await mongoose.connect(`${BASE_URI}/${DB}`);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  };

  api.guard = (t) => { if (skipReason) { t.skip(skipReason); return true; } return false; };
  return api;
}

module.exports = { createApi };
