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
| `App.js` | Root: wires the hooks to the tabs; every screen gets `session` and `duty` |
| `src/hooks/useDriverSession.js` | Login form, sign-in (state is set only once telemetry is connected), sign-out (always clears bus, route, driver and form) |
| `src/hooks/useDuty.js` | Telemetry subscription, the transmission log, the duty switch |
| `src/screens/` | Login, Shift (duty toggle), Route, Diagnostics (telemetry), Profile, Settings (appearance, tracking, this bus, dispatch, about) |
| `src/components/` | DispatchModal, DriverDock |
| `src/services/telemetry.js` | Thin shell: GPS capture, background task, persisted offline queue, socket |
| `src/services/telemetryCore.js` | Pure decisions: speed from two fixes, the fix shape, queue cap, batches; all waits in `TIMING` |
| `src/constants.js`, `src/utils.js` | Dispatch phone, log length, map padding, `TABS`; `formatCoord`, `toKmh` |
| `src/styles/` | Styles shared between screens |
| `src/shared/` | Generated from `/shared` (kit, app shell, API, contract). Do not edit; see its README |

Event names, the fix interval, batch size, queue cap and speed cap come from `src/shared/contract.js`. Tests for `telemetryCore` and `utils` run from the repository root with `npm run test:apps`.

APK builds are described in [docs/SETUP-APKS.md](../../docs/SETUP-APKS.md). The folder layout and naming rules are in [docs/STRUCTURE.md](../../docs/STRUCTURE.md).
