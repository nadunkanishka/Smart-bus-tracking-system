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
npm run seed                  # the 25 Colombo routes with road paths and stops
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
5. Seed the routes once from your machine: `MONGODB_URI=<atlas uri> npm run seed`.

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

## 3b. Netlify for the admin dashboard and the passenger web app

Both are static sites, free on Netlify. Each has a `netlify.toml` in its folder, so you only choose the folder and one variable. Do this after the backend is up (section 3), because both need its address.

1. Netlify: **Add new site, Import an existing project**, pick this GitHub repository.
2. **Base directory** `apps/admin-dashboard`. Leave the build command and publish directory as the file sets them. Under **Environment variables** add `REACT_APP_API_URL` = the backend address, `https://...onrender.com`, no trailing slash. Deploy.
3. Repeat for the passenger web app: a second site with base directory `apps/passenger-app` and the variable `EXPO_PUBLIC_API_URL` (same address).
4. Back in Render, set the backend's `CORS_ORIGIN` to the two Netlify addresses, comma separated and without trailing slashes, for example `https://smartbus-admin.netlify.app,https://smartbus-passenger.netlify.app`. Render restarts the service.
5. Open the admin site, sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`, and check Live Monitor loads.

A variable is baked into the build, so changing it later needs **Deploys, Trigger deploy, Clear cache and deploy**. The first build can take a few minutes. Netlify serves over https, so the backend must also be https (Render is).

## 4b. Passenger APK

The passenger app builds the same way (it has its own `eas.json`, package `lk.smartbus.passenger`):

```bash
cd apps/passenger-app
eas build:configure            # once, links the project to your Expo account
EXPO_PUBLIC_API_URL=<api url> GOOGLE_MAPS_API_KEY=<key> eas build --platform android --profile preview
```

The native map uses Google Maps on Android, so the build needs a Maps SDK for Android key (free; create it in Google Cloud and restrict it to the package name). Without a real key an installed build shows a blank map; Expo Go does not need one. For a build on EAS, set both values as EAS environment variables (`eas env:create`) instead of typing them each time, so they are not committed.

## 4c. Free hosting while building and piloting

Everything above runs on free plans (`render.yaml` already asks for `free`): Render web service and Key Value, MongoDB Atlas M0, Expo/EAS free builds. Two things to do because of it:

- Render's free web service sleeps after about 15 minutes without traffic and takes up to a minute to wake. Add a free uptime monitor (for example UptimeRobot) that requests `<api url>/api/health` every 5 minutes, and open the app a minute before a shift.
- Free tiers have no backups. Export the collections before and after every pilot day (`mongoexport`), and do not run the 500-driver stress test against the free instance. When the system is ready for real use, change `plan: free` to a paid plan in `render.yaml` and move MongoDB to a paid tier; nothing else changes.

## 5. Checks after deploying

- `GET /api/health` returns `status: ok`.
- Sign in to the admin dashboard and open **Live Monitor**: the cache should read Redis.
- Run `npm run replay -- --url <api url> --route RT-001 --buses 2` and watch the passenger app.
