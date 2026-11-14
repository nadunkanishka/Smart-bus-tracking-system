// The only place that reads environment variables and their defaults. Load dotenv before requiring this
// (index.js and the scripts do), because the values are read once, when this file is first required.
const e = process.env;

const DEV_JWT_SECRET = 'dev-only-secret-change-me';
const MONGO_HOST = 'mongodb://127.0.0.1:27017'; // local MongoDB, without a database name

let warned = false;
const env = {
  PORT: e.PORT || 5000,
  MONGO_HOST,
  MONGODB_URI: e.MONGODB_URI || `${MONGO_HOST}/smart_bus_tracking`,
  REDIS_URL: e.REDIS_URL || '', // empty: the in-memory latest-fix store (single instance, dev only)
  // CORS_ORIGIN: comma-separated list of allowed origins. Unset = allow all (local development).
  CORS_ORIGIN: e.CORS_ORIGIN ? e.CORS_ORIGIN.split(',').map((o) => o.trim()) : true,
  // The first admin account, created when the database has none.
  ADMIN_USERNAME: e.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: e.ADMIN_PASSWORD || 'admin123',
  ADMIN_PASSWORD_SET: !!e.ADMIN_PASSWORD,
  // GPS smoothing is on unless GPS_SMOOTHING=off (switch it off to compare raw against smoothed on the same route).
  GPS_SMOOTHING: String(e.GPS_SMOOTHING || 'on').toLowerCase() !== 'off',
  OSRM_URL: e.OSRM_URL || 'https://router.project-osrm.org/route/v1/driving',
};

// Read on first use, so a script that never signs a token does not print the warning.
Object.defineProperty(env, 'JWT_SECRET', {
  enumerable: true,
  get() {
    if (e.JWT_SECRET) return e.JWT_SECRET;
    if (!warned) { warned = true; console.warn('[auth] JWT_SECRET not set: using an insecure development secret.'); }
    return DEV_JWT_SECRET;
  },
});

module.exports = env;
