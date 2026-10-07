# Deployment guide

## 1. Local development

Requirements: Node.js 20 or newer, MongoDB, and Docker Desktop if you want Redis locally.

```bash
# Redis and MongoDB in containers (MongoDB is published on host port 27018)
docker compose up -d mongo redis

# Backend
cd backend
cp .env.example .env          # set JWT_SECRET and ADMIN_PASSWORD
npm install
npm run seed                  # demo Route 138 with road path and stops
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

The replay signs driver tokens with `JWT_SECRET`, so run it with the same `.env` as the server.

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

### Clients

| App | Variable |
|---|---|
| Admin dashboard | `REACT_APP_API_URL` |
| Driver and passenger apps | `EXPO_PUBLIC_API_URL` |

## 3. Cloud deployment (Render)

`render.yaml` describes the backend web service and a Key Value (Redis-compatible) instance.

1. Create a free MongoDB Atlas cluster. Allow access from anywhere (`0.0.0.0/0`) or Render's addresses, and copy the connection string.
2. In Render choose **New → Blueprint** and select this repository.
3. Fill in `MONGODB_URI`, `ADMIN_PASSWORD` and `CORS_ORIGIN` (the admin dashboard's URL). `JWT_SECRET` is generated and `REDIS_URL` is wired to the Key Value instance.
4. After the first deploy, open `/api/health`. It should report `"mongo": "connected"` and `"cache": "redis"`.
5. Seed the demo route once from your machine: `MONGODB_URI=<atlas uri> npm run seed`.

Admin dashboard: deploy `apps/admin-dashboard` as a Render Static Site (build `npm ci && npm run build`, publish `build`) with `REACT_APP_API_URL` set to the API's URL.

Passenger web: `cd apps/passenger-app && EXPO_PUBLIC_API_URL=<api url> npx expo export --platform web`, then host the `dist` folder as a static site.

Free web services sleep when idle and take up to a minute to wake. Use a paid instance for the pilot so drivers are not disconnected.

Railway works the same way: one service from `backend/` (it detects the Dockerfile), plus the Redis plugin, with the same variables.

## 4. Driver APK

```bash
npm install -g eas-cli
cd apps/driver-app
eas login
eas build:configure            # once, links the project to your Expo account
EXPO_PUBLIC_API_URL=<api url> eas build --platform android --profile preview
```

The `preview` profile in `eas.json` produces an installable `.apk`. Background GPS, which keeps tracking with the screen off, only works in this installed build, not in Expo Go. On first use the driver must choose **Allow all the time** for location.

## 5. Checks after deploying

- `GET /api/health` returns `status: ok`.
- Sign in to the admin dashboard and open **Live Monitor**: the cache should read Redis.
- Run `npm run replay -- --url <api url> --route RT-001 --buses 2` and watch the passenger app.
