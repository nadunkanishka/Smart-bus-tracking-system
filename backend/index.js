// Server bootstrap: builds the services (latest-fix store, route cache, real-time layer), then mounts the access
// table, the route files in ./routes and the error handler, then listens.
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config(); // must run before config/env.js reads process.env

const env = require('./config/env');
const connectDB = require('./config/db');
const { createStore } = require('./lib/store');
const { createRouteCache } = require('./lib/routeCache');
const { createRealtime } = require('./realtime');
const { ensureFirstAdmin } = require('./lib/accounts');
const { accessGuard } = require('./middleware/access');
const errorHandler = require('./middleware/errorHandler');
const Admin = require('./models/Admin');

void env.JWT_SECRET; // warns at startup when the development secret is in use

connectDB().then(async (connected) => {
  if (!connected) return;
  try {
    await ensureFirstAdmin(Admin, { username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD, passwordFromEnv: env.ADMIN_PASSWORD_SET });
  } catch (err) {
    console.error('Admin seeding error:', err.message);
  }
});

async function start() {
  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));

  const server = http.createServer(app);
  // Short heartbeat so a dropped mobile connection is noticed within ~15 s.
  const io = new Server(server, { cors: { origin: env.CORS_ORIGIN }, pingInterval: 8000, pingTimeout: 7000 });

  const store = await createStore(env.REDIS_URL);
  const routeCache = createRouteCache();
  const realtime = createRealtime(io, store, { routeCache });
  const services = { io, store, routeCache, realtime };

  app.use(accessGuard());
  app.use(require('./routes/health')(services));
  app.use(require('./routes/auth'));
  app.use(require('./routes/passengers'));
  app.use(require('./routes/monitoring')(services));
  app.use(require('./routes/admins'));
  app.use(require('./routes/drivers'));
  app.use(require('./routes/buses'));
  app.use(require('./routes/routes')(services));
  app.use(errorHandler);

  server.listen(env.PORT, () => {
    console.log(`Backend server listening on port ${env.PORT} (Socket.IO enabled, cache: ${store.kind})`);
  });
}

start();
