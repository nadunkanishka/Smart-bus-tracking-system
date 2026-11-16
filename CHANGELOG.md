# Changelog

Notable changes, newest first, grouped by milestone. Pull request numbers refer to this repository.

## Unreleased

- Return trips: a bus runs the route in both directions and flips legs at each terminal; passengers can pick a trip from a later stop to an earlier one and see buses that are still on their way out, with the wait to the terminal included; trips and the ETA history are kept per direction

## 1.0.0: first complete, deployed release (November 2026)

### Repository quality
- LICENSE (MIT), CONTRIBUTING, pull request and issue templates, dependabot (#69)
- ESLint for the whole repository with a CI job; the server refuses to start in production without `JWT_SECRET`; helmet; non-root Docker image with a healthcheck; Redis in CI (#69)
- Dead code, unused tokens and about 100 unread CSS variables removed (#70)
- The 762-line UI kit split by concern; one shared profile screen and navigation dock for both apps; one error style across the REST API; the API tests split into focused files (#71)
- Tests for monitoring, rate limits, admin write paths and the passenger's live-bus logic: 195 tests in all (#72)
- Documentation rewritten, with architecture, sequence, ETA, hosting and ER diagrams and design decisions

### Mobile apps
- A flat black-and-orange redesign of both apps: no gradients, borders or shadows, filled grey cards with a black and an orange card for emphasis, pill controls, bold headings, light and dark; the admin dashboard keeps its own look (#101)
- Updates without reinstalling: EAS Update for JavaScript changes, version codes that rise by themselves (#67)
- A short tracking card so the map and the bus stay visible; a Bus button that centres the map (#65)
- Map drag, pinch and zoom buttons (#63); tiles from Esri's gray basemaps (#61)
- The phone map drawn by the app, with no WebView and no map key (#59)
- Map diagnostics, the passenger's usual journey remembered, a tracking card at the top (#57)
- Driver app tracks while open with the screen awake after the Android background service crashed an installed build (#54, #56)
- Distinct icons for the driver and passenger apps (#52)
- The apps' look and motion aligned with the admin dashboard (#24, #25)

### Admin dashboard
- Search and status filters on drivers, buses and routes; many buses per route and one route per bus, enforced by the server (#48)
- Live "on the road" panel, ETA error by horizon, system health on the dashboard (#34 to #36)
- Motion with anime.js (#45) and a design-system audit across all clients (#46)
- Account pages for admins and passengers (#20); add, edit and delete buses (#22)

### Backend
- One shared contract for event names, statuses, ids and timing; the backend split into modules (fix pipeline, accounts, analytics, limits, errors) (#47)
- New record ids skip ids already in use, so imported records no longer block saving (#51)
- Kalman GPS smoothing and a straight-line baseline to measure the ETA engine against (#27)
- The 25 Colombo routes with road geometry; Route 138 (Pettah to Homagama) is the pilot route (#26)
- Complete CRUD with integrity checks and integration tests (#19)

### Deployment
- MongoDB Atlas, the backend on Railway, the admin and passenger web sites on Vercel (moved from Netlify, #49), Android builds with Expo EAS (#30 to #33, #37, #43)

## 0.x: foundations (August to October 2026)

- Peach redesign with clay bus illustrations and one navigation language across the apps (#3)
- Expo SDK 54 to 57 (#4); Android safe areas and hero scenes (#6, #9)
- Workspace reorganised into `backend`, `apps` and `shared` (#11)
- First database-backed UI (#1)
