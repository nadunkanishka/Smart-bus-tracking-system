# Backend

Node.js API for the Smart Bus system: REST (Express), live updates (Socket.IO) and storage (MongoDB, optional Redis).

## Run

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env   then set JWT_SECRET and ADMIN_PASSWORD
npm run seed             # once: adds the demo Route 138
npm start                # http://localhost:5000  (npm run dev restarts on changes)
```

Check it at <http://localhost:5000/api/health>.

## Scripts

| Command | What it does |
|---|---|
| `npm start` / `npm run dev` | Start the server (plain / with auto-restart) |
| `npm test` | Unit tests for the ETA engine, GPS validation, trip tracker, store and auth |
| `npm run seed` | Add the demo route (safe to repeat) |
| `npm run replay -- --route RT-001 --buses 3 --duration 120` | Simulated buses driving a route |
| `npm run clear-sim` | Remove simulated data |
| `npm run smoke` | Call every endpoint and print the responses. **Only against an empty throwaway database**; see the header of `scripts/smoke.js` |

## Key folders

| Path | Contents |
|---|---|
| `index.js` | Server start-up; mounts the route files |
| `routes/` | REST endpoints, one file per resource |
| `middleware/` | Sign-in rate limiter, admin guards |
| `realtime.js` | Socket.IO handlers and the live GPS pipeline |
| `lib/` | ETA engine, validation, trip tracker, geometry, auth, latest-fix store |
| `models/` | Mongoose schemas |
| `scripts/`, `test/` | Tools and unit tests |

Environment variables are listed in [docs/STRUCTURE.md](../docs/STRUCTURE.md#environment-variables). Endpoints and socket events are in [docs/API.md](../docs/API.md).
