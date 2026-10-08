// Server bootstrap: Express + Socket.IO, middleware, and the route files in ./routes.
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config(); // must run before modules that read process.env

const connectDB = require('./config/db');
const { createStore } = require('./lib/store');
const { createRealtime } = require('./realtime');
const { hashPassword } = require('./lib/auth');
const { adminOnly, adminWrites } = require('./middleware/adminOnly');
const Admin = require('./models/Admin');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS_ORIGIN: comma-separated list of allowed origins. Unset = allow all (local development).
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
// Short heartbeat so a dropped mobile connection is noticed within ~15 s.
const io = new Server(server, { cors: { origin: corsOrigin }, pingInterval: 8000, pingTimeout: 7000 });
const state = { store: null, realtime: null }; // set once the latest-fix store is ready

// Connect to MongoDB and seed default admin
connectDB().then(async (connected) => {
  if (connected) {
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const initial = process.env.ADMIN_PASSWORD || 'admin123';
        await Admin.create({
          username: process.env.ADMIN_USERNAME || 'admin',
          password: hashPassword(initial),
          name: 'Super Admin',
          role: 'Super Admin',
        });
        console.log(process.env.ADMIN_PASSWORD
          ? 'Default admin account created from ADMIN_USERNAME / ADMIN_PASSWORD.'
          : 'Default admin account created: admin / admin123. Set ADMIN_PASSWORD before deploying.');
      }
    } catch (err) {
      console.error('Admin seeding error:', err.message);
    }
  }
});

// --- API ROUTES ---  (order matters: the public routes are mounted before the admin guards)
app.use(require('./routes/health')(state, io));
app.use(require('./routes/auth'));
app.use(require('./routes/passengers'));

// Everything below is admin-only, except reading routes (passengers need the route list and geometry).
app.use(['/api/dashboard', '/api/drivers', '/api/buses', '/api/live', '/api/metrics', '/api/analytics'], adminOnly);
app.use('/api/routes', adminWrites);

app.use(require('./routes/monitoring')(state));
app.use(require('./routes/drivers'));
app.use(require('./routes/buses'));
app.use(require('./routes/routes')(state));

createStore().then((s) => {
  state.store = s;
  state.realtime = createRealtime(io, state.store);
  server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT} (Socket.IO enabled, cache: ${state.store.kind})`);
  });
});
