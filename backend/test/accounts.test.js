// Account rules and sign-in, without MongoDB (an account is anything with a password field and save()).
const test = require('node:test');
const assert = require('node:assert/strict');
const { usernameError, passwordError, signIn, issueToken } = require('../lib/accounts');
const { isHashed, verifyPassword, readToken, hashPassword } = require('../lib/auth');

const account = (password) => ({ password, saves: 0, async save() { this.saves += 1; } });

test('a legacy plaintext password signs in once and is stored as a hash from then on', async () => {
  const a = account('secret1');
  assert.equal(await signIn(a, 'secret1'), true);
  assert.equal(isHashed(a.password), true);
  assert.equal(a.saves, 1);
  assert.equal(verifyPassword('secret1', a.password), true);
  assert.equal(await signIn(a, 'secret1'), true);
  assert.equal(a.saves, 1, 'an already hashed password is not saved again');
});

test('a wrong password or a missing account does not sign in and changes nothing', async () => {
  const plain = account('secret1');
  assert.equal(await signIn(plain, 'nope'), false);
  assert.equal(plain.password, 'secret1');
  assert.equal(plain.saves, 0);
  assert.equal(await signIn(account(hashPassword('x1')), 'x2'), false);
  assert.equal(await signIn(null, 'x'), false);
});

test('passenger and admin accounts have their own username and password rules', () => {
  assert.equal(passwordError('passenger', '12345'), 'Password must be at least 6 characters.');
  assert.equal(passwordError('passenger', '123456'), null);
  assert.equal(passwordError('admin', '1234567'), 'Password must be at least 8 characters.');
  assert.equal(passwordError('admin', undefined), 'Password must be at least 8 characters.');
  assert.equal(usernameError('passenger', 'nimal.p'), null);
  assert.equal(usernameError('passenger', 'Nimal-P'), 'Username must be 3-30 letters, numbers, dots or underscores.');
  assert.equal(usernameError('admin', 'Second-Admin'), null);
  assert.equal(usernameError('admin', 'ab'), 'Username must be 3-30 letters, numbers, dots, dashes or underscores.');
});

test('a passenger token outlives an admin token', () => {
  const life = (kind) => { const c = readToken(issueToken(kind, { sub: 'x' })); return c.exp - c.iat; };
  assert.equal(readToken(issueToken('passenger', { sub: 'x' })).role, 'passenger');
  assert.ok(life('passenger') > life('admin'));
});
