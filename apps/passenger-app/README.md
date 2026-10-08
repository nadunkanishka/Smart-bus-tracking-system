# Passenger app

Expo (React Native) app for passengers: pick a route and stops, watch the bus move on the map and see an arrival time for every stop.

## Run

```bash
npm install
npx expo start --port 8082      # press w for the browser, or scan the QR code with Expo Go
```

The backend must be running. If the driver app is also starting, wait for it to print its QR code first. For a real phone, set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`) and restart with `-c`.

## Key folders

| Path | Contents |
|---|---|
| `App.js` | Root: navigation state and the tab switch |
| `src/screens/` | Auth (login and register), Tracking, Home, Routes, Profile |
| `src/components/` | StopSelectorModal, StopPicker, ConnectionChip, ProfileRow, BottomDock |
| `src/hooks/` | `useAuth` (session and forms), `useRoutes` (route list and stops), `useLiveBuses` (socket and live positions), `useToast` |
| `src/constants.js`, `src/utils.js` | Constants; `pickBus` and `trackedSummary` |
| `src/styles/` | Root styles and styles shared between screens |
| `src/shared/` | Generated from `/shared`. Do not edit; see its README |

The folder layout and naming rules are in [docs/STRUCTURE.md](../../docs/STRUCTURE.md).
