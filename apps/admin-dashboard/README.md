# Admin dashboard

React web app (Create React App) for the admin: manage drivers, buses and routes, draw route paths and stops on a map, watch live connections and review trip analytics.

## Run

```bash
npm install
npm start                        # http://localhost:3000
```

Sign in with the admin username and the `ADMIN_PASSWORD` set in `backend/.env`. To use a backend that is not on `http://localhost:5000`, copy `.env.example` to `.env.local` and set `REACT_APP_API_URL`.

| Command | What it does |
|---|---|
| `npm start` | Development server |
| `npm test -- --watchAll=false` | Run the tests once |
| `npm run build` | Production build in `build/` |

## Key folders

| Path | Contents |
|---|---|
| `src/App.js` | Root: sign-in state, shell, page switch |
| `src/pages/` | Login, Dashboard, Drivers, Buses, Routes, LiveMonitor, Analytics |
| `src/components/` | Sidebar, Header, EntityModal with DriverForm, BusForm and RouteForm, ConfirmDialog, RouteMapEditor, small UI pieces |
| `src/hooks/` | `useAdminData` (loads everything), `useEntityModal` (add, edit, delete) |
| `src/api.js` | fetch wrapper that adds the admin token |
| `src/styles/` | `admin-theme.css`, `index.css` |
| `src/design/` | Generated from `/shared`. Do not edit; run `node shared/sync.js` from the repository root |

The folder layout and naming rules are in [docs/STRUCTURE.md](../../docs/STRUCTURE.md).
