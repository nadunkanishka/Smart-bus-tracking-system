// One shared limiter for every sign-in and registration endpoint: 50 attempts per 15 minutes per address.
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again later.' } });
