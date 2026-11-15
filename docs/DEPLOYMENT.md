# Deployment reference

Step-by-step guides, in the order you need them: [SETUP-MONGODB.md](SETUP-MONGODB.md) (database), [SETUP-RAILWAY.md](SETUP-RAILWAY.md) (backend), [SETUP-APKS.md](SETUP-APKS.md) (phone apps). This page holds the rest: running locally, Docker, environment variables, the Vercel sites, free-hosting limits and the post-deploy checks.

## 1. Local development

Requirements: Node.js 22 or newer (`.nvmrc`), MongoDB, and Docker Desktop if you want Redis locally.

```bash
# Redis and MongoDB in containers (MongoDB is published on host port 27018)
docker compose up -d mongo redis

# Backend
cd backend
cp .env.example .env          # set JWT_SECRET and ADMIN_PASSWORD
npm install
npm run seed                  # the Colombo routes with road paths and stops
npm run dev                   # http://localhost:5000
```

If you use the compose MongoDB, set `MONGODB_URI=mongodb://127.0.0.1:27018/smart_bus_tracking` in `.env`. If you leave `REDIS_URL` empty the server uses an in-memory cache and says so at startup.

```bash
# Admin dashboard
cd apps/admin-dashboard && npm install && npm start        # http://localhost:3000

# Passenger and driver apps
cd apps/passenger-app && npm install && npx expo start     # press w for web, or scan with Expo Go
cd apps/driver-app && npm install && npx expo start
```

To use a real phone, both apps need the backend's LAN address. Create `.env` in each app folder:

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:5000
```

### Whole stack in containers

```bash
docker compose up --build       # API on :5000, with MongoDB and Redis
```

### Simulated buses

```bash
cd backend
npm run replay -- --route RT-001 --buses 3 --duration 120
npm run replay -- --route RT-001 --offline 20:50     # bus 1 loses signal, then flushes its buffer
```

The replay signs driver tokens with `JWT_SECRET`, so run it with the same `.env` as the server. Use the id of the route you want in your database (`RT-001` is an example).

### Redis

Without `REDIS_URL` the latest-fix cache lives in the server's memory: fine for one instance, lost on restart, and the Redis path is not exercised. Locally `docker compose up -d redis` starts one. On a host, add a Redis service and set `REDIS_URL` (see [SETUP-RAILWAY.md](SETUP-RAILWAY.md), step 7). `/api/health` shows `cache: redis` or `cache: memory`.

## 2. Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | HTTP and WebSocket port. Default 5000 |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string. Empty = in-memory fallback (development only) |
| `JWT_SECRET` | Signs login tokens. Required in any shared environment |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | First admin account, created only when no admin exists |
| `CORS_ORIGIN` | Comma-separated allowed web origins. Empty = allow all |

The full table, with defaults and the optional variables, is in [STRUCTURE.md](STRUCTURE.md).

### Clients

| App | Variable |
|---|---|
| Admin dashboard | `REACT_APP_API_URL` |
| Driver and passenger apps | `EXPO_PUBLIC_API_URL` |

## 3. Hosting

Database, backend and APKs: follow the three setup guides above. Any Docker host also works for the backend: it needs only the variables in section 2. This project runs on Railway.

## 4. Vercel: admin dashboard and passenger web app

Both are static sites, free on Vercel's Hobby plan. Each has a `vercel.json` in its folder (build command, output folder, the one-page-app rewrite and the security headers), so you only choose the folder and one variable. Do this after the backend is up, because both need its address.

1. Vercel: **Add New, Project**, import this GitHub repository.
2. **Root Directory**: `apps/admin-dashboard`. Leave the build settings as `vercel.json` sets them. Under **Environment Variables** add `REACT_APP_API_URL` = the backend address (for example `https://...up.railway.app`, no trailing slash). Name the project `smartbusadmin`. Deploy.
3. Repeat for the passenger web app: a second project (`smartbuspassenger`) with Root Directory `apps/passenger-app` and the variable `EXPO_PUBLIC_API_URL` (same address).
4. In each project: **Settings, Git, Production Branch** = `main` (the branch this project deploys). **Settings, General, Node.js Version** = 22.x (the lock files are written for npm 10, the same as CI).
5. On the backend host, set `CORS_ORIGIN` to the two Vercel addresses, comma separated and without trailing slashes: `https://smartbusadmin.vercel.app,https://smartbuspassenger.vercel.app` (use the addresses Vercel shows you if the names were taken). The service restarts.
6. Open the admin site, sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`, and check Live Monitor loads.

A variable is baked into the build, so changing it later needs a new build: **Deployments, the latest one, Redeploy** (untick "Use existing Build Cache"). Vercel serves over https, so the backend must also be https. Only `main` and `dev` are built (the `ignoreCommand` in each `vercel.json` skips every other branch), because the free plan allows 100 deployments a day and a preview per pull request used them up. Pull requests get no preview address; if one is ever turned on, a preview is a different origin, so it is not in `CORS_ORIGIN` and its data calls are blocked unless you add it.

To build the passenger web app by hand instead: `cd apps/passenger-app && EXPO_PUBLIC_API_URL=<api url> npx expo export --platform web`, then host the `dist` folder as a static site.

## 5. Free hosting while building and piloting

Everything runs on free plans or a trial: Railway trial, MongoDB Atlas M0, Vercel, Expo/EAS free builds. Because of it:

- Some free web services sleep when idle (an idle service can take up to a minute to wake). Where that applies, add a free uptime monitor (for example UptimeRobot) that requests `<api url>/api/health` every 5 minutes, and open the app a minute before a shift.
- Free tiers have no backups. Export the collections before and after every pilot day (`mongoexport`, see [SETUP-MONGODB.md](SETUP-MONGODB.md)).
- Free instances are small. Do not run the 500-driver, 2,000-passenger stress test (`loadtest/artillery.yml`) against them: run it from a separate machine against a temporary larger instance, or locally, and say in the report where it ran.
- Watch the free limits (monthly hours or credit, Redis size, Atlas storage) while the pilot runs. When the system is ready for real use, move to paid plans; nothing else changes.

## 6. Checks after deploying

- `GET /api/health` returns `status: ok`.
- Sign in to the admin dashboard and open **Live Monitor**: the cache reads Redis if `REDIS_URL` is set, otherwise memory.
- Run `npm run replay -- --url <api url> --route RT-001 --buses 2` and watch the passenger app.
