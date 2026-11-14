# Refactor decision log

Question asked of every piece of code: **should these pieces change together?** Three ways to get it wrong: hidden links (must change together, code does not show it), needless links (tied together, change for different reasons), surplus (no reason of their own to change). Special cases are listed because each one is a requirement the design never accounted for.

Status: **survey finished, nothing changed yet.** Deletions wait for approval. Evidence: four read-only surveys plus `dead_code_check` (a script that counts a name as used if it appears anywhere as a whole word, so it only reports what is certainly unused).

Baseline to keep identical: backend 39 tests, admin build and 1 test, both apps bundle for Android and web.

---

## A. Deletions (evidence-checked, need approval)

Nothing below is imported, referenced by a class name, or read anywhere.

- **Dead admin CSS** (`apps/admin-dashboard/src/styles/admin-theme.css`, about 100 of 670 lines): `.acc-*`, `.chart-tabs`, `.chip-dark`, `.dashboard-grid`, `.kpi-*`, `.overview-card`, `.tile-*`, `.tone-*`, `.dot`, `.stack-bar`, `.ring*`, `.bar-value`, `.row-end`, `.pill-up`, `.empty-row`, `.login-input`, `.field-error`, `.route-card-big.idle`; plus the unused variables in `design/tokens.css` (`--scrim`, `--map-chrome` are defined but the CSS rebuilds them by hand: use them or delete them).
- **Superseded CSS layers** (same file): the base rule of 73 selectors defined more than once whose later block wins (`.sidebar` ×4, `.section-header h1` ×4, `.stat-card`, `.bar-chart`, `.panel`, `.data-table`, `.form-input`, `.chip`, phone bottom bar at l.342-347, `.donut` transition, three identical re-declarations). `styles/index.css` is overridden entirely.
- **Unused style keys, driver app (16):** `DispatchModal.styles` modalBackdrop, modalDismiss; `DiagnosticsScreen.styles` metricIcon, metricVal; `ProfileScreen.styles` dispatchCard, dispatchCardSpaced, dispatchLeft, dispatchCardAvatar, dispatchCardAvatarText, dispatchCardName, dispatchCardRole, dispatchBtns, profileCardTitle, profileCardTitleFlat, profileCardHeader; `styles/common` headerBus.
- **Unused style keys, passenger app (13):** `ConnectionChip.styles` liveDot, liveDotOff; `StopSelectorModal.styles` modalBackdrop, modalDismissArea; `HomeScreen.styles` homeHeaderBus, homeSheet, sectionTitle; `ProfileScreen.styles` profileCardHeader, profileCardTitle, profileCardTitleFlat; `TrackingScreen.styles` progressTrack, progressDone, progressLeft.
- **Shared kit:** `Avatar` (ui.js), `MapIcon`, `ScanIcon`, `PlusIcon` (icons.js) used by nobody; drop the `export` on `useReducedMotion`, `PRESS_WEB`, `ThemeToggle`, `EyeIcon`, `passwordStrength` (used inside ui.js only). `tokens.js`: `TYPOGRAPHY`, `LAYOUT`, `MOTION`, `TOUCH` and the 28 legacy colour keys made by `withLegacy` (no `COLORS.<legacy>` use anywhere), plus their filters in `shared/sync.js`.
- **Backend:** unused exports `describeError` (crud.js), `TTL_SEC` (store.js), `STOP_RADIUS_M` (tripTracker.js), `handleFix` and `stop` exports of realtime.js, `st.out` in smooth.js, the unused `snapped`/`edge` result fields, `models/Trip.js` `registration` and the unread `completed` (see bug 6), the `seq` field that is parsed and never used.
- **Docs and files:** `docs/design-lab/` (6 files, referenced nowhere); the duplicated plan document (see section D when the contracts survey is in).
- **Driver app wrappers:** `showToast` (one-line pass-through), `openDispatch`.

## B. Structural fixes (the redesign)

Each fix sits above the problems it solves.

- **One owner for "which bus is on which route".** `lib/busRef.js` with `format`, `parse`, `matchQuery`.
  - `routes/auth.js:72`, `routes/buses.js:22,85`, `routes/routes.js:41` parse the `"NB-4712 (BUS-002)"` string with three different regexes.
  - `scripts/seed.js:79` writes the format; `escapeRegex` sits in `lib/crud.js:12` only for this.
- **Split `realtime.js` by reason to change** (it changes for six reasons, 8 recent commits, no tests): route cache, trip recorder, fix pipeline, metrics, socket wiring.
  - `realtime.js:62` `handleFix` options `buffered/broadcast/recvTs` exist for the batch caller; `buffered` flips four behaviours.
  - `realtime.js:84-87` decides "smoothing on" twice.
  - `realtime.js:143,158,175` close a trip three different ways; `realtime.js:160` and `:58` invalidate the route cache two ways.
  - `realtime.js:98-104,153-154` build log documents by hand next to the models; Date conversion is split with `lib/tripTracker.js:46-55`.
  - `lib/tripTracker.js:4,11-16` imports the baseline (evaluation) into trip tracking.
- **One home for every threshold and time window**, with their order written down.
  - `realtime.js:19` (15 s live), `lib/store.js:8` (60 s TTL), `realtime.js:285` (15 min forget), `lib/smooth.js:23` (30 s reset), `lib/tripTracker.js:7` (30 s gap), `lib/validate.js:5` (24 h).
  - `lib/eta.js:16`, `lib/tripTracker.js:6,8`, `realtime.js:141` (40 m, 150 m, 200 m); `lib/eta.js:12,15` (two 5.5s); `lib/validate.js:6` and `realtime.js:73` (speed 45 and a hidden ×1.5).
- **One geometry and random helper set.** `R`, `rad`, flat-earth projection, `pointAt`, GeoJSON/lat-lng conversion and `rng/gauss` live in `lib/geo.js` and `scripts/lib`.
  - `lib/smooth.js:9-27`, `scripts/replay.js:33-39,88`, `scripts/smoothing-eval.js:16-55,101`, `scripts/seed.js:75`, `loadtest/processor.cjs:16`, `test/smooth.test.js:6-20`, `routes/routes.js:15-27`, `realtime.js:51-52`.
- **One account module** for credential rules and login flow.
  - `routes/auth.js:13-42,45-110`, `routes/passengers.js:29-40` repeat verify, upgrade, sign; passenger login lacks the upgrade (bug).
  - Password minimum 6 vs 8, two username regexes, `'30d'` twice, error texts copied.
- **One error path.** An Express error handler replaces 20 identical try/catch blocks and the hand-rolled `500` responses (`routes/auth.js:40,108`, `monitoring.js:38,76,103`, `routes.js:55`).
- **Analytics math leaves the HTTP layer** (`lib/analytics.js`): `routes/monitoring.js:18-73` builds pipelines, buckets, percentiles inline, with three parallel copies of the horizon list and a copy of the segment-history aggregate in `realtime.js:46-50`.
- **Config and services built before routes mount.** `config/env.js` (secret, admin defaults, smoothing flag, OSRM, Mongo URI) and a non-null `services` object replace the mutable `state` (`index.js:28`, `routes/health.js:15`, `monitoring.js:14-15`, `routes.js:53,117,128`) and the six places that default the secret or Mongo address.
- **Admin: one entity description table** (fields, labels, status options, endpoint, record to form, form to payload, validation).
  - `useEntityModal.js:5-7,11,40-69,83-87,131-163,183`, `EntityModal.js:11-38`, `BusForm.js:52-54`, `DriverForm.js:43-45`, list pages' labels, `StatusBadge.js:5-9` vs `DashboardPage.js:43`.
  - Raw values stay raw; display strings are made where displayed (removes the re-parse of `"52 seats"`).
- **Admin: one auth/API module.** Login, token storage, 401 sign-out in `api.js`; `LoginPage` owns its form (`App.js:33-37,87-119`); pages import `api` instead of getting it as a prop.
- **Admin: one page registry** for nav label, title, section, icon, component (`Sidebar.js:5-15,28`, `App.js:136-153,180-193`, three hard-coded `<h1>`s).
- **Admin: one list/confirm/modal shell** for the five CRUD pages and `ConfirmDialog` (`AdminsPage.js:128-166`, `PassengersPage.js:12-39`, `Analytics.js:50-53`, `LiveMonitor.js:72,83`).
- **Admin CSS becomes one layer**, tokens for radius/hero chip move to `shared/tokens.js`, one name per colour, breakpoints and dark-mode selector pairs written once; the `!important`s that only beat older layers go.
- **Apps: the shared app shell moves into `shared/native`** (`AppFrame`, `useToast`, `ProfileRow`, settings appearance block, `type()`, tab ids, one `TOP_INSET`).
  - `driver App.js:41-76,150-160` vs `passenger App.js:73-83` and `hooks/useToast.js`; both `ProfileRow*`, `common.js`, `SettingsScreen` preambles, three inset formulas.
- **Apps: driver session and duty state leave `App.js`** (`useDriverSession`, `useDuty`) and `telemetry.js` splits into pure functions plus a thin socket shell with named timings.
- **One wire contract** (event names, REST paths, fix fields, speed cap, stale thresholds) exported once and copied by `shared/sync.js` into backend, apps and admin.
- **Replace the generated-copy step for the mobile apps with Metro `watchFolders`**: possible, but only a real EAS build confirms it, so it is the last and optional step.

## C. Bugs found by the survey (fixed along the way, each with a test)

1. `driver App.js:115-121` logout leaves the previous bus, route and driver in state; a throw in `telemetry.disconnect()` makes logout fail silently.
2. `driver constants.js:11` `TOP_INSET` has no 24 dp floor (the passenger app and `ui.js` do).
3. `routes/passengers.js:35` passenger login never upgrades a plaintext password.
4. `realtime.js:172-182` `goOffline`: a failing `store.remove` skips the `bus:offline` emit.
5. `realtime.js:264` a batch fix without a timestamp gives NaN in the sort.
6. `realtime.js:158 vs 175` a trip closed at duty-off is not marked `completed`; the field is read nowhere in the backend.
7. `lib/store.js` Redis route sets never expire, so `read()` returns fewer rows than members; corrupt JSON fails `route:subscribe`.
8. `admin Analytics.js:10` route select stays empty if routes arrive after mount.
9. Same status shows an amber badge on the dashboard, a gray one in the Drivers table.
10. A 401 on any admin write or secondary page never signs out.
11. `routes/monitoring.js:20` analytics by route 404s without an id, while `/analytics/eta` treats it as "all".
12. `scripts/smoke.js` exits 0 when a create fails (undefined ids cascade).

## D. Comments and tests

- **Comments to remove (restate the code or are change-log notes):** every `CHANGED (visual only)` / `CHANGED:` marker (admin `App.js:2,37`, `EntityModal.js:12`, `Field.js:4`, `LoginPage.js:9` which is also stale; apps `App.js`, `DriverDock.js:5`, `BottomDock.js:5`, `ShiftScreen.js:51`, `common.js:5-6`), section banners ("AUTH ROUTES", "Auth State", "Data Collections"...), "names are kept for existing callers", "Legacy exports". Comments about things outside the code stay (Redis/ack/dedup rules, Android inset notes, `/buss` pluralisation, GeoJSON order).
- **Tests:**
  - `engine.test.js:136,204` recompute the implementation's own arithmetic; `:205` `notEqual` can pass for the wrong reason; `:178` re-requires an imported module.
  - `smooth.test.js:98-104` can barely fail; `:79` and `:106-112` are tied to internal fields.
  - `routes-data.test.js` title promises a terminal check the body does not do.
  - `crud.test.js` is skipped, not failed, when Mongo is down, with child stderr ignored.
  - Admin `App.test.js` only checks the login form renders.
  - `scripts/smoke.js` asserts nothing.
  - No tests for `realtime.js`, the Redis store, analytics, `pickBus`, `toRoute`, `telemetry`. Add behaviour tests for these.

## E. Contracts, docs and config (from the fourth survey)

**Contract duplicated across tiers** (fix: one `shared/contract.js` that `shared/sync.js` copies into the apps, the admin and, as a CommonJS copy, `backend/lib/contract.js`; CI's existing sync check then covers it too):
- Live window: `backend/realtime.js:19` 15 s and passenger `constants.js:6` 15 s; removal window `backend/lib/store.js:8` 60 s and passenger `constants.js:8` 60 s.
- Fix interval 3 s in `telemetry.js:13`, `loadtest/artillery.yml:43`, `realtime.js:21` and four docs; batch size 500 must stay at or below the server's 1000 (`realtime.js:254`); `MAX_QUEUE` restated in ARCHITECTURE.md.
- Status enums by hand in three models, four route files, six admin files, passenger `useRoutes.js:52` and DATABASE.md; `RouteForm.js` has no status select, so two route statuses cannot be set from the UI.
- ID formats `BUS-`/`DRV-`/`RT-` built in four places; `shared/native/api.js:37` strips digits back out.
- GeoJSON to `[lat,lng]` coded in admin `useAdminData.js:96-97` and `shared/native/api.js:35,45`, reverse in `routes/routes.js:12-32`.
- Driver token claims built in `routes/auth.js:77`, `scripts/replay.js:72`, `loadtest/processor.cjs:21`; dev secret in `lib/auth.js:5` and `processor.cjs:5`; `processor.cjs:3` reaches into `backend/node_modules`.
- Backend URL has five names (`REACT_APP_API_URL`, `EXPO_PUBLIC_API_URL`, `API_URL`, `TARGET`, a literal); OSRM has two names and its default URL four times; OSM tile URL three times.
- `route:subscribe` ack says `buses` is a count, `route:snapshot` says it is an array; `route:unsubscribe` is handled and documented but no client sends it; `seq` is sent and parsed, never used.
- Node version: docs say "20 or newer", CI, Dockerfile and Netlify use 22 (fix: `.nvmrc`).

**Docs that drifted** (stale fact, then the true fact):
- "36" / "27" / "15" tests in PROJECT-PLAN, SYSTEM-PLAN, CRUD-REPORT: it is 39.
- CRUD-REPORT says the fixes are unmerged: merged.
- README points to `shared/navIcons.js`: it is `shared/native/icons.js`.
- STRUCTURE.md omits `routes/admins.js`, says `ADMIN_PASSWORD` is required (it defaults to `admin123`), and its env table omits `GPS_SMOOTHING`, `GOOGLE_MAPS_API_KEY`, `API_URL`, `OSRM_*`, `EXPO_PUBLIC_DISPATCH_PHONE`.
- DEPLOYMENT.md and PROJECT-PLAN treat Render as the deployment: it runs on Railway; Netlify site names are `smartbusadmin` / `smartbuspassenger`, not `smartbus-admin`; section order 1, 2, 3, 4, 3b, 4a, 4b, 4c, 5.
- DATABASE.md says the database is `smart_bus_tracking`: that is local only; Atlas uses `smartbus`.
- API.md `gps:fix` ack lacks `ts`; ARCHITECTURE.md omits the smoothing step and says the passenger map is Leaflet (web only).
- `realtime.js:204` comment says the admin map subscribes: it polls REST.
- App READMEs omit Settings, Admins, Passengers, AccountActions; the driver README points to DEPLOYMENT.md instead of SETUP-APKS.md; README says every folder has a README (`docs/`, `loadtest/` do not). The "25 routes" count is written in nine places.

**Dead or duplicate files** (all `git ls-files` verified):
- `docs/design-lab/` (6 files, about 50 KB), unreferenced.
- Four tracked copies of the bus images (`shared/buses/out`, both apps' `assets/buses`, admin `design/buses`), 52 files each, about 960 KB each; 14 per copy are unreachable through `pick()` (mint/navy/red/teal buses, mint coach).
- `render.yaml` (Railway is used), `docs/CRUD-REPORT.md` (one-off audit), `.gitignore:16 .uploads`, the stock Expo `LICENSE` in both apps, `splash-icon.png` (unreferenced), the CRA sample `manifest.json` and stock icons, CRA `eject` script, the driver's stock `babel.config.js`/`metro.config.js`.
- Two overlapping status plans: `PROJECT-PLAN.md` and `SYSTEM-PLAN.md` (merge into one). `DEPLOYMENT.md` sections 3b, 4, 4a, 4b repeat the SETUP guides.
- **Ask first:** per-app `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` may be kept on purpose; `.vscode/settings.json` is tracked and picks up personal settings.

**Special cases:** both `eas.json` hard-code the Railway host (fix: EAS environment variable like the Maps key); `admin123` default in `index.js:36,45`, `docker-compose.yml:22`, `LoginPage.js:72`; `lib/auth.js:20` accepts a stored plaintext password; the driver `constants.js:4` fallback phone; production deploys from `dev`; `realtime.js:218-226` `driver:auth` exists for the load test only. Keep `seed.js:83` sleep (courtesy delay to a public server).

**Bugs:** `realtime.js:232-236` `attachDriver` reuses in-memory bus state, so a changed `routeId` in the token is ignored and the bus keeps publishing to the old room for up to 15 minutes; `realtime.js:240` `driver:duty` does not check `bus.routeId` while `gps:fix` does.

## Stage 1 done (backend, docs, files)

Deleted files: `docs/design-lab/` (6 files), `render.yaml`, `docs/CRUD-REPORT.md` (its known limits moved to `docs/ARCHITECTURE.md`), `docs/PROJECT-PLAN.md` (merged into `docs/SYSTEM-PLAN.md`), the `.uploads` line in `.gitignore`.
Removed backend dead code: exports `describeError`, `TTL_SEC`, `STOP_RADIUS_M`; `handleFix` and `stop` from the `createRealtime` return value; `st.out` in `lib/smooth.js`; the `snapped` result field (`lib/eta.js`) and `edge` (`lib/geo.js`); `registration` on `models/Trip.js` and its write in `realtime.js`. Kept: `remainingInSegment` (read by `engine.test.js`), `completed` on Trip, the `seq` validation.
Removed backend comments: section banners in `routes/*`, `index.js`, `lib/auth.js`, `lib/store.js`, `lib/eta.js`, and restating comments in `realtime.js`; the wrong "(and the admin map)" in the `route:subscribe` comment.
Added: `.nvmrc` (22). Rewrote `docs/DEPLOYMENT.md` as a short reference; stale facts fixed in README, STRUCTURE, DATABASE, API, ARCHITECTURE.

## Stage 2 apps done (driver app, passenger app, shared kit)

- New shared parts: `shared/native/shell.js` (`AppFrame`, `AppColumn`, `useToast`, `ProfileRow` with the accent as a prop, `SettingsPage`, `COMMON_STYLES`); `TOP_INSET` and `type()` live in `ui.js`; `EASE_OUT` in `tokens.js` feeds the kit, the web map and the admin `--ease-out`.
- Driver: `src/hooks/useDriverSession.js` and `src/hooks/useDuty.js` out of `App.js` (250 -> 90 lines); screens get `session` and `duty`. `telemetry.js` split into `telemetryCore.js` (pure) and the socket/GPS shell; contract constants replace `'gps:fix'`, 3000, 500, 2000, 40; `seq` no longer sent; the notification colour is passed in.
- Passenger: hooks use `EVENTS`, `LIVE_WINDOW_MS`, `GONE_AFTER_MS` and `isActiveRoute` (`STATUS`); `useAuth` no longer navigates; `StopSelectorModal` takes `{ visible, onClose, trip, tracked }` and owns its picker state; `App.js` 193 -> 172 lines.
- Fixed: C1 (logout clears bus, route, driver, registration; a throwing `disconnect()` still signs out and closes the socket; login sets state only after `telemetry.connect`), C2 (one `TOP_INSET` with the 24 dp floor). All `eslint-disable` dependency suppressions removed (one remains: `no-await-in-loop` for the deliberate one-batch-at-a-time flush).
- Kit: 25 bare `useTheme();` calls replaced by `themed()` around every exported component (rule enforced by `shared/test/kit.test.mjs`); `AuthLayout` has no default brand; the redundant `localStorage` writes in `themeRuntime.js` removed (the synchronous web read stays for the first paint).
- Deleted: both `ProfileRow*` copies, both `SettingsScreen.styles.js`, driver `styles/app.js`, passenger `hooks/useToast.js`, driver `babel.config.js` and `metro.config.js` (stock; exports pass without them).
- Tooling: both apps pin `@react-native-async-storage/async-storage` 2.2.0 and `react-native-web` ^0.21.2 (lockfiles not refreshed). Tests: `npm run test:apps` (30 `node:test` cases), also run at the end of `npm test`.
- Not done: Metro `watchFolders` (would let the apps import `/shared` directly and drop the copies; needs `watchFolders` plus `resolver.nodeModulesPaths` in a `metro.config.js` per app, a check that `react-native` resolves once, and a real EAS build).

## Stage 2 admin done

- New modules: `src/entities.js` (one entity table), `src/format.js` (display strings; `utils.js` deleted), `src/map.js` (centre, one tile URL, route colour), `src/pages/index.js` (page registry), `components/EntityList.js`, `ModalShell.js`, `PageHeader.js`; `TableShell.js` gains `EmptyRow` and `RowActions`.
- `api.js` owns login, the session, sign-out and 401/403 handling; `LoginPage` owns its form; `App.js` 209 -> 100 lines; pages import `api` themselves.
- Fixed: C8 (Analytics route select follows routes that arrive late), C9 (one `statusBadgeClass`: Active green, Maintenance / Under Construction amber, the rest gray), C10 (a rejected token on any request signs out; `PUT /admins/me/password` opts out because its 401 means a wrong current password).
- CSS: 31 repeated blocks folded into the last one, breakpoints written once at the end, the unreachable `prefers-color-scheme` halves, unused aliases, `.badge-red` and `.dash .kv li` removed, `--orange` is the one accent name, radii use the role variables. A cascade comparison (old vs new winner per context, selector and property, with var() resolved in both modes, plus an order-flip check) shows only these intended removals.
- Tests: 1 -> 32 (sign-in, 401 sign-out, entity table, status badge, GeoJSON conversion, bus round trip).

## Stage 2 backend done

- New modules: `config/env.js` (every env default; the dev JWT secret once, warning on first use), `middleware/access.js` (one role table, replaces `adminOnly.js` and the `requireRole` calls in `routes/passengers.js`), `middleware/errorHandler.js` (one error path: the try/catch blocks and hand-rolled 500s are gone), `lib/limits.js` (server thresholds and how they relate), `lib/busRef.js`, `lib/accounts.js`, `lib/analytics.js` + `lib/stats.js`, `lib/routeCache.js`, `lib/tripRecorder.js`, `lib/fixPipeline.js`, `lib/metrics.js`, `scripts/lib/rand.js`. `lib/geo.js` gains the flat-earth frame, `offset`, `pointAt` and the GeoJSON helpers; `lib/sequence.js` gains `nextId`; `lib/auth.js` gains `driverClaims`.
- `realtime.js` 301 -> 150 lines (socket wiring and per-bus state only); `routes/*.js` 758 -> 538. `index.js` builds store, route cache and realtime before mounting routes; the mutable `state` object is gone. `loadtest/processor.cjs` signs with `backend/lib/auth`.
- Fixed: C3 (passenger login upgrades a plaintext password), C4 (`bus:offline` is sent even when `store.remove` or ending the trip fails; the ack still reports the error), C5 (a batch fix without a numeric `ts` is a counted rejection, `lastTs` is never NaN), C6 (one `endTrip(bus, completed)`: `completed` is written every time, true only at the final stop), C7 (Redis route sets expire with their values and stale, foreign or corrupt members are pruned on read), C12 (`scripts/smoke.js` checks every status and exits 1), the `attachDriver` route bug (a new `routeId` in the token takes the bus off the old route first) and `driver:duty` without a route, negative device-to-server latency no longer sampled, clearing all stop points clears `stops`.
- Behaviour changes worth knowing: the ETA horizon buckets now match their labels (600-1200 s was reported as "over 20 min", now "10 to 20 min"); an unexpected non-validation error in a handler that used to answer 400 now answers 500; a blank `status` on create still means the default.
- Tests added: fix pipeline, store contract (Redis part runs only with `REDIS_URL`), analytics, accounts, trip recorder, Socket.IO layer (route change, duty without route, failing store, batch). `crud.test.js` waits for the admin account, shows the server's stderr when it fails to start, and fails instead of skipping when MongoDB is down and `CI` is set.
- Left: `lib/tripTracker.js` still imports the evaluation baseline from `lib/eta.js` (moving it means injecting the baseline into the tracker; small, but it touches the evaluation numbers' code path); C11 (`/api/analytics/segments` 404s without a `routeId`) is unchanged, it was not in this stage's list; `admin123` still appears in `docker-compose.yml` and the admin `LoginPage` (outside the backend).

## Final pass (re-survey)

Fixed: one `IS_WEB` switch in the UI kit; iOS bundle id for the driver app; load-test token signing now reads `backend/.env`; `realtime.test.js` waits for the broadcast instead of a fixed 150 ms sleep (the likely cause of the one-off flake); CI runs `test:apps` and reads the Node version from `.nvmrc`; the unused `seq` field is gone from `validate.js` and API.md.

Left for later (small, no behaviour change, not worth the risk now): stop statuses `passed`/`upcoming` into the contract; one SIM/LOAD id prefix module; `describeError`/`httpError` moved next to the error handler and the hand-written 4xx responses converted to throws; one `changePassword` and one set of admin defaults in `lib/accounts.js`; `dwellSec` and `windowM` into `lib/limits.js`; unused exports; a Redis service in CI; admin `StatusBadge` tones derived from `STATUS`; admin `@testing-library/*` to devDependencies (npm 11 rewrites the lockfile).
