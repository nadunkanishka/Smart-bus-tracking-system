# Driver app

Expo (React Native) app a driver signs into with a bus registration and password. While on duty it sends the phone's GPS position to the backend every 3 seconds and keeps a queue when the signal drops.

## Run

```bash
npm install
npx expo start --port 8081      # press w for the browser, or scan the QR code with Expo Go
```

The backend must be running, and a bus must exist and be assigned to a route (create both in the admin dashboard). For a real phone, set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`) and restart with `-c`.

## Key folders

| Path | Contents |
|---|---|
| `App.js` | Root: sign-in and duty handlers, tab switch |
| `src/screens/` | Login, Shift (duty toggle), Route, Diagnostics, Profile |
| `src/components/` | DispatchModal, ProfileRow, DriverDock |
| `src/services/telemetry.js` | GPS capture, background task, offline queue, socket |
| `src/constants.js`, `src/utils.js` | Constants and small helpers |
| `src/styles/` | Root styles and styles shared between screens |
| `src/shared/` | Generated from `/shared`. Do not edit; see its README |

APK builds are described in [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md). The folder layout and naming rules are in [docs/STRUCTURE.md](../../docs/STRUCTURE.md).
