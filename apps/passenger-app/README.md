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
| `App.js` | Root: wires the hooks, holds the active tab and decides what follows a sign-in |
| `src/screens/` | Auth (login and register), Tracking, Home, Routes, Profile, Settings (appearance, usual journey, account, about) |
| `src/components/` | StopSelectorModal (gets the `trip` object from `useRoutes`), StopPicker, ConnectionChip, AccountActions (edit details, password, delete account), BottomDock |
| `src/hooks/` | `useAuth` (session and forms; login and register resolve to the welcome message), `useRoutes` (route list and stops), `useLiveBuses` (socket and live positions, windows from the contract) |
| `src/constants.js`, `src/utils.js` | Session key, map padding, `TABS`, the empty route; `pickBus` and `trackedSummary` |
| `src/styles/` | Boot screen style and styles shared between screens |
| `src/shared/` | Generated from `/shared` (kit, app shell, API, contract). Do not edit; see its README |

The root frame, toast, `ProfileRow`, the Settings page skeleton and `TOP_INSET` come from `src/shared/shell.js` and `ui.js`. Tests for `pickBus`, `trackedSummary` and the API helpers run from the repository root with `npm run test:apps`.

The folder layout and naming rules are in [docs/STRUCTURE.md](../../docs/STRUCTURE.md).
