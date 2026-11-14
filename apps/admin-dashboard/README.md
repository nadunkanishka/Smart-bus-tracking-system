# Admin dashboard

React web app (Create React App) for the admin: manage drivers, buses and routes, draw route paths and stops on a map, watch live connections, review trip analytics, remove passenger accounts, manage administrators and set the colour mode.

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
| `src/App.js` | Root: the sign-in page until an admin is signed in, then the console shell (sidebar, header, banner, current page, dialogs) |
| `src/api.js` | Sign-in, the saved session (sessionStorage `adminUser`), every request with the token, sign-out on any 401/403 |
| `src/entities.js` | Drivers, buses and routes described once: API collection, labels, status options (from the contract), blank form, API record to row, row to form, form to payload, required fields |
| `src/pages/index.js` | Page registry: key, menu label, title, section, icon and component of every page |
| `src/pages/` | Login, Dashboard, Drivers, Buses, Routes, Live Monitor, Analytics, Passengers, Administrators, Settings |
| `src/components/` | Sidebar, Header, PageHeader, EntityList (the three list pages), TableShell (+ EmptyRow, RowActions), ModalShell, EntityModal with DriverForm, BusForm and RouteForm, ConfirmDialog, StatusBadge (the one status colour rule), RouteMapEditor, small UI pieces |
| `src/hooks/` | `useAdminData` (loads drivers, buses, routes, summary), `useEntityModal` (add, edit, delete) |
| `src/format.js` | Display strings (seats, km, m:ss, the admin's name, initials and role); records keep raw values |
| `src/map.js`, `src/theme.js`, `src/motion.js` | Map centre and tiles; light/dark store; animation timings |
| `src/styles/admin-theme.css` | The admin stylesheet, one rule per selector, breakpoints at the end |
| `src/design/` | Generated from `/shared` (tokens, contract, vehicles). Do not edit; run `node shared/sync.js` from the repository root |

Tests (`*.test.js`, fetch and sessionStorage mocked through `src/test/fetchMock.js`) cover sign-in, sign-out on 401, the entity table, the status badge and the GeoJSON conversion.

The folder layout and naming rules are in [docs/STRUCTURE.md](../../docs/STRUCTURE.md).
