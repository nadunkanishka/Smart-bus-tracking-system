const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

// config/env.js read in a fresh process, so each case starts from a known environment.
const readSecret = (extra) => spawnSync(process.execPath, ['-e', "console.log(require('./config/env').JWT_SECRET)"], {
  cwd: path.join(__dirname, '..'),
  env: { PATH: process.env.PATH, ...extra },
  encoding: 'utf8',
});

test('a production server without JWT_SECRET refuses to start', () => {
  const res = readSecret({ NODE_ENV: 'production' });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /JWT_SECRET must be set/);
});

test('a production server with JWT_SECRET uses it', () => {
  const res = readSecret({ NODE_ENV: 'production', JWT_SECRET: 'a-real-secret' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), 'a-real-secret');
});

test('development still falls back to the insecure secret, with a warning', () => {
  const res = readSecret({});
  assert.equal(res.status, 0);
  assert.match(res.stderr, /JWT_SECRET not set/);
});
