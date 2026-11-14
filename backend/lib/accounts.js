// Credential rules and the sign-in flow for the three kinds of account: admins, buses (driver phones) and passengers.
// Passwords are checked by lib/auth.js; this file decides what a valid username or password is, how long a token
// lives, and upgrades a legacy plaintext password to a hash on the first successful sign-in.
const { hashPassword, verifyPassword, isHashed, signToken } = require('./auth');

// Passengers pick a short, lowercase username and may use a 6-character password (a phone keyboard, a low-risk
// account); admin accounts allow mixed case and dashes, and need at least 8 characters.
const RULES = {
  admin: {
    username: /^[A-Za-z0-9_.-]{3,30}$/,
    usernameError: 'Username must be 3-30 letters, numbers, dots, dashes or underscores.',
    minPassword: 8,
    tokenLifetime: '12h',
  },
  passenger: {
    username: /^[a-z0-9_.]{3,30}$/,
    usernameError: 'Username must be 3-30 letters, numbers, dots or underscores.',
    minPassword: 6,
    tokenLifetime: '30d',
  },
  driver: { tokenLifetime: '12h' },
};

// null when the value is acceptable, otherwise the message to show.
const usernameError = (kind, username) => (RULES[kind].username.test(String(username || '')) ? null : RULES[kind].usernameError);
const passwordError = (kind, password) => {
  const min = RULES[kind].minPassword;
  return String(password || '').length < min ? `Password must be at least ${min} characters.` : null;
};

// Checks a password against an account document (anything with a `password` field and `save()`).
// A legacy plaintext password that matches is replaced by its hash. Returns false for a missing account.
async function signIn(account, password) {
  if (!account || !verifyPassword(String(password), account.password)) return false;
  if (!isHashed(account.password)) {
    account.password = hashPassword(String(password));
    await account.save();
  }
  return true;
}

const issueToken = (kind, claims) => signToken({ ...claims, role: kind }, RULES[kind].tokenLifetime);

// Creates the first admin account when there is none (a fresh database).
async function ensureFirstAdmin(Admin, { username, password, passwordFromEnv }) {
  if ((await Admin.countDocuments()) > 0) return false;
  await Admin.create({ username, password: hashPassword(password), name: 'Super Admin', role: 'Super Admin' });
  console.log(passwordFromEnv
    ? 'Default admin account created from ADMIN_USERNAME / ADMIN_PASSWORD.'
    : `Default admin account created: ${username} / ${password}. Set ADMIN_PASSWORD before deploying.`);
  return true;
}

module.exports = { RULES, usernameError, passwordError, signIn, issueToken, ensureFirstAdmin };
