// API: the sign-in rate limit and the body size limit.
// Real server, throwaway MongoDB database (see test/helpers/api.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApi } = require('./helpers/api');

const api = createApi('limits');
const { call, guard } = api;
test.before(api.start);
test.after(api.stop);

test('sign-in attempts are limited: after 50 in 15 minutes the server answers 429 with a clear message', async (t) => {
  if (guard(t)) return;
  const attempt = () => call('POST', '/api/auth/login', { body: { username: 'admin', password: 'wrong-password' } });
  let last;
  let firstLimited = null;
  for (let i = 1; i <= 60 && !firstLimited; i += 1) {
    last = await attempt(); // each attempt must count before the next
    if (last.status === 429) firstLimited = i;
  }
  assert.ok(firstLimited, 'a 429 appears within 60 attempts');
  assert.ok(firstLimited > 30, `the limit is not hit early (hit on attempt ${firstLimited})`);
  assert.equal(last.data.error, 'Too many attempts. Try again later.');
});

test('a request body over 1 MB is refused before it reaches a route', async (t) => {
  if (guard(t)) return;
  const res = await call('POST', '/api/passengers/register', { body: { name: 'x'.repeat(1_200_000), username: 'big', password: 'Big@12345' } });
  assert.equal(res.status, 413);
});
