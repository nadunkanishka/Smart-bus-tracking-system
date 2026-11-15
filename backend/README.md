# Backend

Node.js API for the Smart Bus system: REST (Express), live updates (Socket.IO) and storage (MongoDB, optional Redis).

## Run

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env   then set JWT_SECRET and ADMIN_PASSWORD
npm run seed             # once: adds the Colombo routes (npm run seed -- 138 for one)
npm start                # http://localhost:5000  (npm run dev restarts on changes)
```

Check it at <http://localhost:5000/api/health>.

## Scripts

| Command | What it does |
|---|---|
| `npm start` / `npm run dev` | Start the server (plain / with auto-restart) |
| `npm test` | Unit tests (ETA engine, GPS pipeline, smoothing, trip tracker, store, auth) and API tests that start the real server on a throwaway MongoDB database. MongoDB must be running; set `REDIS_URL` to also run the Redis store test |
| `npm run seed` | Add the Colombo routes from `scripts/data/` (safe to repeat; list route numbers to add only those) |
| `npm run replay -- --route RT-001 --buses 3 --duration 120` | Simulated buses driving a route |
| `npm run clear-sim` | Remove simulated data |
| `npm run smoke` | Call every endpoint and print the responses. **Only against an empty throwaway database**; see the header of `scripts/smoke.js` |

## Key folders

| Path | Contents |
|---|---|
| `index.js` | Server start-up; mounts the route files |
| `routes/` | REST endpoints, one file per resource |
| `middleware/` | The role table (`access.js`), the one error handler, the sign-in rate limiter |
| `realtime.js` | Socket.IO handlers and per-bus live state (the fix pipeline itself is `lib/fixPipeline.js`) |
| `lib/` | Fix pipeline, ETA engine, Kalman smoothing, validation, trip tracker and recorder, geometry, auth, accounts, latest-fix store |
| `models/` | Mongoose schemas |
| `scripts/`, `test/` | Seed, replay and smoke tools; unit and API tests |

Environment variables are listed in [docs/STRUCTURE.md](../docs/STRUCTURE.md#environment-variables). Endpoints and socket events are in [docs/API.md](../docs/API.md).
