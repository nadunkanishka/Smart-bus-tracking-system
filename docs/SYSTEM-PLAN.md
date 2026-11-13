# System plan: from working code to a pilot-ready system that matches the reports

Written against the approved proposal (E179947, submitted 31 May 2026) and the interim report (6 Aug 2026), and judged from the code, not from the proposal. This one file holds the status and the to-do list (it replaces the old separate project plan). Tick the boxes as you go.
Boxes marked **(you)** need your hands, an account, a person or a decision; the rest are things you can run, or ask for help with.

## 0. Where things stand

**Built and checked in this repository**

- Backend: Node/Express, Socket.IO rooms per route, MongoDB (GeoJSON), Redis-or-memory latest-fix cache, JWT roles, the ETA engine (polyline snapping, live speed, historical segment times, dwell), trip and ETA logging, metrics endpoint, automated backend tests (`npm test`) including CRUD against a real database, the GPS smoother and the baseline.
- Admin dashboard: drivers, buses, routes with a map editor, live monitor, trip analytics, passenger and administrator accounts, settings, light and dark mode.
- Driver app (Expo, Android): 3-second GPS, offline buffer with sequence numbers, on/off duty, background tracking in an installed build.
- Passenger app (Expo, web and native): live map, ETA per stop, route and stop selection, account screens.
- GPS smoothing (Kalman filter with spike gate and stop hold) and a straight-line baseline logged beside every ETA prediction, compared on Trip Analytics.
- The Colombo routes are seeded with road lines; Route 138 is Pettah to Homagama.
- Tooling: GPS replay simulator (with GPS noise), Artillery load test, EAS profiles for both apps, CI on every push.
- **Deployed (13 Nov 2026, free tiers):** MongoDB Atlas, the backend on Railway (`/api/health` says mongo connected, cache memory), the admin dashboard and the passenger web app on Netlify, CORS locked to those two sites. The seeded routes are loaded; bus NA-9001 with its driver is on Route 138.
- Step-by-step guides for the database, the backend and the APK builds: `docs/SETUP-MONGODB.md`, `SETUP-RAILWAY.md`, `SETUP-APKS.md`.

**Not done or never verified**

- Expo Go on two phones against the hosted backend worked (driver on duty, passenger sees the bus and ETAs; reported 13 Nov 2026), and the hosted admin dashboard showed the live bus. No installed APK is in use yet (the first driver APK was built pointing at the emulator address and was thrown away; both apps need a rebuild with the Maps key), nothing has run on a road, and the smoother and baseline are not yet checked on real GPS logs. All accuracy and latency numbers so far are simulated.
- Redis has never been exercised here (this machine has no Docker or WSL), so the Redis path is untested.
- No measured latency, ETA error or load figures exist yet. The report must not claim any until they do.
- The reports describe two things the code does not do (see section 1).

**Status by proposal phase**

| # | Proposal phase | Status | Basis in the code |
|---|---|---|---|
| 1 | Literature review and requirements | Not checkable from code | An interim report exists (referenced in `backend/lib/smooth.js`). Confirm the final report has the review chapter. |
| 2 | System design and architecture | **Done** | `docs/ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `STRUCTURE.md` |
| 3 | Backend, real-time pipeline | **Done** (about 95%) | Socket.IO rooms per route, `gps:fix` and `gps:batch`, Redis latest-fix cache with in-memory fallback, GeoJSON `2dsphere` indexes, JWT auth, CRUD routes, validation, rate limiting |
| 4 | Driver app | **Done** (about 90%) | 3 s GPS capture, offline queue with batch flush and ack, duty toggle, diagnostics screen. Works in Expo Go on real phones (reported). No installed APK in use yet. |
| 5 | Passenger app | **Done** (about 90%) | Route list, per-route subscription, live map with gliding markers, per-stop ETAs. The web build uses Leaflet and OpenStreetMap, the native build `react-native-maps`. |
| 6 | ETA engine | **Built, not tuned** (about 70%) | `lib/eta.js` follows steps (a) to (d); `tripTracker` logs segment times, dwell and predicted-vs-actual into `SegmentLog` and `EtaLog`. Smoothing and the straight-line baseline are built and measured on simulated tracks. Tuning needs real trip data, which does not exist yet. |
| 7 | Admin dashboard | **Done** (about 95%) | Routes with a map editor, stops, buses, drivers, passengers, admins, live monitor, trip analytics, settings, dark mode |
| 8 | Integration and system testing | **Partly done** (about 50%) | Backend tests cover the ETA engine, GPS pipeline, CRUD, route data, smoothing and baseline. A simulator (`npm run replay`) and a smoke script exist. A two-phone Expo Go run worked (reported); no installed-build run on a road; the driver and passenger apps have no tests. |
| 9 | Live pilot deployment | **Deployed, pilot not started** | Backend on Railway, database on Atlas, admin and passenger web on Netlify (13 Nov 2026, free tiers). No installed APK yet, no real trips. Route 138 is chosen and seeded. |
| 10 | Performance evaluation | **Tooling ready, no results** | `/api/metrics`, replay latency summary, `loadtest/artillery.yml`, `docs/EVALUATION.md`. No run recorded. |
| 11 | User study | **Not started** | `EVALUATION.md` plans Google Forms with SUS. No questionnaire, no ethics or consent text yet. |
| 12 | Documentation and report | **Technical docs done, report not started** | Docs cover architecture, API, schema, deployment. The ESOFT / London Met final report is not in the repo. |

**Deliverables check**

| Deliverable | State |
|---|---|
| Driver app, Android APK | Code done. **APK not built** (rebuild with the Maps key). |
| Passenger web and mobile app | Code done. Web deployed (Netlify). Phone app: build the APK with the Maps key. |
| Admin dashboard | Done and deployed (Netlify). |
| Deployed backend with Redis and MongoDB, load tested | Backend on Railway, MongoDB on Atlas. **No Redis yet, not load tested.** |
| Performance evaluation report | **Not started** (tooling only) |
| User study report | **Not started** |
| Technical documentation | Done. Needs a final accuracy pass and diagrams for the report. |
| Final project report | **Not started** |

## 1. Decisions (made)

- [x] **D1. GPS smoothing: build it.** Add server-side smoothing before the ETA engine (a distance-threshold filter, and a basic Kalman filter if it measurably helps) so the interim report's claim becomes true. New work items:
  - [x] Design: where it sits (after validation, before trip tracking and the ETA engine), per-bus state, reset on a new trip or a long gap. Done: after validation and the jump checks, before trip tracking and the ETA engine; state per bus in `bus.smooth`, reset on going off duty or a gap over 30 s.
  - [x] Implement with the thresholds in one config block, and keep the raw fix next to the smoothed one in the log so both can be compared. Done: `backend/lib/smooth.js`; `gpslogs` keep `location` (raw) and `smoothed`.
  - [x] Unit tests: a jittery track becomes smoother, a real turn is not cut off, a genuine stop stays a stop, an out-of-order fix is ignored. Done: `backend/test/smooth.test.js`.
  - [x] Measure drift before and after on a recorded or replayed noisy track (10-25 m noise, as in the report) and keep the figures for the evaluation. Done on simulated tracks: see `docs/EVALUATION.md` section 2b (15 m noise: 15.6 m to 11.9 m). Repeat on the pilot logs.
- [x] **D2. Pilot route: Pettah to Homagama (Route 138).** The route data must say this everywhere.
  - [ ] **(you)** Ride the corridor once and note the real stops in order (Pettah, Borella and so on through Nugegoda, Maharagama and Pannipitiya to Homagama; use whatever the real service stops at).
  - [x] Seed data replaced (branch `pilot-routes`): the seed now loads the Colombo routes from the owner's list, Route 138 being Pettah to Homagama via the High Level Road, with road lines from OSRM. Stops are provisional until the ride; replace them in `backend/scripts/data/routes.js` and run `node scripts/geocode-places.js` then `npm run seed`.
  - [ ] Update the screenshots and report text that still name Maharagama as the terminal.
  - [ ] Check the points marked approximate in `backend/scripts/data/places.json` (Kanatta Junction, Technical College Junction, Thummulla, Makumbura Multimodal Centre) and the three stops left out for lack of a reliable point (Bellanthota, Old Kelani Bridge, Ayurveda Junction).
- [x] **D3. Pilot both passenger apps, say so in the report.**
  - [ ] Build the native passenger app as an installable build (EAS), install it on volunteer phones alongside the web app. Config is ready (EAS project, package name, backend address and Maps key setup in `docs/SETUP-APKS.md`); the build itself is still to do.
  - [ ] Add a paragraph to the report describing the web app and the React Native companion (one Expo codebase), as the proposal promises.
- [x] **D4. Keep passenger and administrator accounts.**
  - [ ] Add one line to the report: these go beyond the approved proposal (self-service passenger accounts, administrator accounts), included for security and usability.
- [x] **D5. Hosting: free for now.** The backend runs on a Railway trial (about 30 days of credit, no sleeping; Render asked for a card even for its free plan). Netlify serves the two websites, Atlas the database. Decided: stay on free hosting while building and piloting, and move to a paid plan when the system is ready to deploy for real. Free hosting is enough for the pilot's few buses, with these conditions:
  - [ ] If the host ever sleeps when idle (Render's free plan does), keep the API awake before and during every run (a free uptime pinger such as UptimeRobot hitting `/api/health` every 5 minutes), and open the app a minute before each shift so nobody meets a cold start.
  - [ ] Free instances are small, so the 500-driver and 2,000-passenger stress test must not run against it. Run that test against a temporary instance (a paid instance for a few hours costs very little) or locally, and say in the report where it ran.
  - [ ] Free tiers have no backups: export the database collections before and after every pilot day.
  - [ ] Keep an eye on the free limits (Railway credit, Redis size, Atlas storage) while the pilot runs.
- [x] **D6. Compare the ETA engine with a plain Haversine baseline.**
  - [x] Log the baseline estimate (straight-line distance divided by the bus's speed) next to the engine's prediction for each stop, using the same inputs. Done: straight-line distance / 20 km/h, stored in `etalogs`.
  - [x] Extend the analytics (`/api/analytics/eta`) and the Trip Analytics page to show both errors side by side. Done: `compared` and `byHorizon`, and a table on Trip Analytics.
  - [x] Unit tests for the baseline calculation. Done in `backend/test/engine.test.js`.

## 2. Make it run end to end (locally, first)

- [x] `npm run install:all`, then `npm test` passes (backend and admin). Checked 12 Nov 2026.
- [x] MongoDB running, `backend/.env` exists with `JWT_SECRET` and `ADMIN_PASSWORD` set.
- [x] `npm run seed` (run on the main database 12 Nov 2026), start backend, admin, passenger and driver apps (`docs/DEPLOYMENT.md`, section 1).
- [x] Replay on Route 138 (3 buses, 90 s, isolated test database): 135 fixes sent, 135 received by the passenger socket, ETAs update per stop, `/api/metrics` counts them, and the ETA and segment analytics fill. Latency device to passenger: avg 2 ms. Not yet looked at in the browser, and Trip Analytics needs full trips (longer runs). Note the route id is not RT-001 any more: use the id of Route 138 in your database.
- [ ] **(you) Redis.** Without Docker, use a free cloud Redis (Redis Cloud or Upstash) or install Memurai; set `REDIS_URL`; confirm `/api/health` shows `"cache": "redis"` and Live Monitor says Redis. Until then the Redis claim in the report is untested.
- [ ] Read the Known limits in `docs/ARCHITECTURE.md` and decide which matter for the pilot (no passenger password reset, deleted admin tokens valid until expiry).
- [ ] Add a few tests for the driver telemetry queue and the passenger live-bus hook, or document manual test cases instead. Fix whatever the phone tests break.

## 3. Real data for the pilot corridor

- [ ] **(you)** Ride or drive the route once and note the real stops, in order, in both directions if buses run both ways.
- [ ] In the admin Routes page: draw the road path (use "Build path through stops", then correct it on the map) and place every stop. The ETA engine's accuracy depends on this path; a straight line between stops will not do. The seeded routes have road lines from OSRM (Pettah was removed from Route 138 in the admin); correct them after the ride.
- [x] Register the pilot buses and drivers; set a bus password for each; assign each bus to the route. Done on the cloud admin: bus NA-9001 with a password, a driver, assigned to Route 138.
- [ ] Run a few slow test drives (or replay) so each segment has recorded trips. Until a segment has trips the engine uses a default speed, and the baseline is not yet real.
- [ ] Check the route on a phone-sized screen: stop names readable, no duplicate stops, terminals correct.

## 4. Deploy

- [x] **(you)** Create a MongoDB Atlas cluster (free tier), allow connections, copy the connection string. Done (cluster created, network access open, user created).
- [x] **(you)** Deploy the backend on Railway (`docs/SETUP-RAILWAY.md`). Done: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, root `/backend`, branch `dev`.
- [ ] `/api/health` reports `mongo: connected` and `cache: redis`. Mongo is connected; the cache is memory until a Redis is added (`REDIS_URL`).
- [x] Seed or recreate the route on the cloud database (`MONGODB_URI=<atlas> npm run seed`, then edit in the admin). Done: every route seeded.
- [x] Deploy the admin as a static site with `REACT_APP_API_URL`; deploy the passenger web export with `EXPO_PUBLIC_API_URL`. Done on Netlify (`smartbusadmin`, `smartbuspassenger`), both built from `dev`.
- [x] Set `CORS_ORIGIN` to the admin and passenger web addresses only. Done and checked from outside: the two sites are allowed, an unknown origin is blocked.
- [ ] Change the default admin password, remove any test accounts and test buses from the cloud database. The admin was recreated from the real `ADMIN_PASSWORD` and the login page no longer prints the default; still to do: remove any test accounts and test buses.
- [ ] Hold the database backup in mind: Atlas free tier has none; export the collections before and after the pilot.
- [ ] Run section 2's replay against the cloud URL and watch the hosted passenger app. The hosted system was exercised with two phones in Expo Go instead; the replay needs the Railway `JWT_SECRET` in your own terminal.

## 5. Driver app on real phones

- [ ] **(you)** Expo account; `eas build --platform android --profile preview` with `EXPO_PUBLIC_API_URL` set to the cloud API; install the APK on each volunteer's Android 10+ phone (`docs/SETUP-APKS.md`). Accounts and both EAS projects exist. The backend address now lives in each `eas.json` (a terminal variable never reaches EAS) and a build stops without the Maps key. Rebuild both apps.
- [ ] On each phone: grant location "all the time" and disable battery optimisation for the app, or background tracking stops.
- [ ] Test on a bench: sign in, go on duty, screen off for 10 minutes, positions keep arriving.
- [ ] Test offline: airplane mode for 2 minutes while moving, then reconnect; the buffered positions arrive in order and the bus does not jump.
- [ ] Test a 1-hour drive, then a 4-hour shift (the interim report names 4 hours): note battery drain, dropouts, cell handovers.
- [ ] Give drivers one page: how to sign in, go on duty, what to do if it stops. Keep the dispatch contact number current.

## 6. Integration and stress testing (proposal phase 8)

- [ ] Edge cases, each written up as pass or fail: bus joins mid-route, bus stops short of the last stop, GPS jump, duplicate and out-of-order fixes, driver disconnects and returns, passenger reconnects, two buses on one route, a bus with no route.
- [ ] Load test to the figures the interim report promises: up to 500 simulated drivers and 2,000 passenger sockets. The shipped `loadtest/artillery.yml` peaks at 15 new users per second, so raise the phases and run it from a separate machine against the deployed API, not localhost.
- [ ] Record Redis memory, Node event-loop lag and socket stability during the peak (host metrics, and `/api/metrics`). The free tier cannot carry this load (D5): run it against a temporary paid instance or locally, and say which in the report.
- [ ] Latency scaling: `npm run replay -- --route <id> --buses 10 --duration 300 --quiet` against the deployed server; record average, p95, peak, and repeat with 1, 5, 10 and 25 buses. Optional, strengthens the report: the same load with and without Redis.
- [ ] Keep the Artillery report files and all raw outputs in a new `evaluation/` folder; they are evidence for the report.
- [ ] Fix what the test finds before the pilot, not after.

## 7. Pilot (proposal phase 9)

- [ ] **(you)** Written permission from the operator and each volunteer driver; a short consent note saying location is shared only while on duty and what is stored.
- [x] Decide how long positions (`GpsLog`) are kept and write it down; delete or anonymise after the study. Decided: 14 days (TTL index), written in `docs/DATABASE.md`. Delete the study copy afterwards.
- [ ] Get permission from a bus owner or driver, and ethics or consent wording from your supervisor. Put the phone in a holder with a charger and a data plan (budget LKR 500 to 1,000 per month).
- [ ] Pilot days and hours agreed; a person checking Live Monitor during each run.
- [ ] Run at least 10 to 15 real trips across morning, midday and evening. Real trips are what fill `SegmentLog` and `EtaLog`; plan many trips on one route rather than a few on many.
- [ ] After the first week, compare first-day ETA error with later days (the engine starts from 20 km/h and 20 s dwell defaults).
- [ ] Each run logs: date, bus, driver, signal problems, battery level at start and end, anything odd.
- [ ] Use the 2-week contingency the interim report names, and write the dates down as they happen.
- [ ] Take screenshots and screen recordings of the live passenger app during real trips (the report needs them).

## 8. Performance evaluation (proposal phase 10)

All three measures are explained in `docs/EVALUATION.md`.

- [ ] **Latency.** Controlled end to end: `npm run replay` on one machine, once on Wi-Fi, once over 4G, once over 3G (throttle on the phone or router); keep avg, p95 and peak. Pilot: device-to-server from `/api/metrics`, with phones on automatic network time.
- [ ] **ETA tuning.** With real data, tune dwell handling, the stopped-bus speed fallback, and rush-hour versus off-peak history. Keep before and after numbers.
- [ ] **ETA accuracy.** From pilot trips, export `etalogs` and report mean absolute error, bias, worst miss, and error by horizon. The shipped analytics give MAE; the interim report also names RMSE, so compute it from the CSV export. Report simulated-bus errors separately or not at all; they say little.
- [ ] **Baseline.** Compute the Haversine-only estimate for the same arrivals and compare errors (logging and the comparison table are built; the result needs pilot trips). This is the strongest single result in the report.
- [ ] **Throughput.** Packets per second and memory stability from section 6.
- [ ] Put every figure in one table with how it was measured, on what network, over how many trips. Do not round in your favour.
- [ ] Say plainly what the numbers do not show (one route, a few days, a few drivers).

## 9. User study (proposal phase 11)

- [ ] **(you)** Write the questionnaire (Likert scale: ease of use, trust in ETAs, usefulness, would you use it daily; plus two open questions). The app does not collect answers; use an external form (`docs/EVALUATION.md`, section 5).
- [ ] Recruit passengers and drivers who actually used the system; aim for at least 20 to 30 responses and say how many. A QR code poster at the pilot stops and on the bus helps. Export CSV, compute the SUS score and satisfaction summaries.
- [ ] Anonymous responses; keep the consent line on the form.
- [ ] Analyse: counts, mean and spread per question, the open answers grouped by theme.
- [ ] Write the User Study Report as its own short document (the proposal lists it as a deliverable).

## 10. Documentation and submission (proposal phase 12)

- [ ] Architecture diagram (three tiers, Socket.IO rooms, Redis, MongoDB) and the ETA data flow. `docs/ARCHITECTURE.md` has the text; draw the figures (architecture, sequence, ER and ETA flow).
- [ ] REST and WebSocket API specification: `docs/API.md` (check it against the final code once more).
- [ ] MongoDB schema guide: `docs/DATABASE.md` (include the 2dsphere index and the log collections).
- [x] Deployment runbooks: `docs/DEPLOYMENT.md` (reference); run it once from a clean checkout and fix anything that is wrong. Done from a real deployment: `docs/SETUP-MONGODB.md`, `docs/SETUP-RAILWAY.md`, `docs/SETUP-APKS.md`, linked from the README.
- [ ] Driver APK delivered (file plus the build profile), passenger web and admin deployed with working links, a demo video of one live trip.
- [ ] Final report in the London Met / ESOFT format, using the corrections in section 11. Ask your supervisor for the template and word limit; outline now. Chapters: literature review and technology comparison (objectives 1 and 2), design, implementation (with screenshots from real phones), the performance evaluation and user study reports, reflection, limitations (single route, one bus, phone clock differences) and future work. Then a supervisor review round, then submit.
- [ ] Merge `dev` into `main` once CI is green (your call). The old local `fix/ci-admin-install` was left unmerged on purpose.
- [ ] Git history tidy: merged branches deleted, tags for the pilot build and the submission build, CI green on `main`.

## 11. Fix these in the report so it matches the system

| Report says | Reality | What to do |
|---|---|---|
| Kalman filter and distance-threshold smoothing | Only server-side validation of impossible fixes; no smoothing | D1: implement, or reword |
| Phase 6 "In Progress" (status table) and "Completed" (milestones) | Same phase, two statuses | Use one status and one date |
| Phase 6 extension: "+2 weeks", "Ext. 2 wks" and "roughly 1.5 weeks" | Three different figures | Pick the true one |
| Phase 8 "Next (In Progress)" and "Pending" | Two statuses | One status |
| Project "on target" (abstract) and a 2-week slip (variance table) | Contradictory | State the slip and the new dates |
| "Validated locally" | Only simulated and local checks; no pilot, no measurements | Say "validated in simulation" until section 8 is done |
| Passenger app is Leaflet web only | The Expo project also builds a native app | D3 |
| Route 138 is Colombo-Homagama | Seed data is Pettah-Maharagama | D2 |
| Redis stores the latest fix | Verified only against the in-memory fallback | Do section 2's Redis step before claiming it |
| Proposal says Leaflet on the passenger map | The web build uses Leaflet, the native build `react-native-maps` with OSM tiles | Say so in the report |
| Objectives name "Leaflet.js / Google Maps API" and "React Native / Flutter" as options evaluated | The chosen stack is in the code | Add the comparison that justifies it |
| Admin "register bus stops" | Stops are managed inside the route form | Name it that way in the report |
| Kalman delay given as 1.5 weeks, 2 weeks and "Ext. 2 wks"; Phase 6 month given as Month 6 to 7 and Month 7 to 8 | Contradictory | Use one figure and one month range |
| In-text citation years (Avvenuti 2012, Vigneshwaran 2023) differ from the reference list; several references are "Anon." | Inconsistent | Fix the references |
| Declaration lists "Module Leader: Nadun Kanishka" and the signature line is an email address | Your own name; wrong field | Correct it |
| Pilot route named `route:138-colombo-homagama` | The code uses ids like `RT-001` | Say which is a display name |

## 12. Done means

Check each proposal deliverable against evidence you can show:

- [ ] Driver APK installed and used on real phones.
- [ ] Passenger web and mobile app working against the cloud API. The web app and Expo Go work against it; the installed phone app is still to do.
- [x] Admin dashboard managing the pilot route, buses and drivers. Done on the hosted admin.
- [ ] Backend deployed with Redis and MongoDB, tested under simulated load (reports saved).
- [ ] Performance evaluation report: latency, ETA error, throughput, each with method and network.
- [ ] User study report from the questionnaire.
- [ ] Technical documentation (diagrams, API, schema, deployment guide).
- [ ] Final report and submission.

## Suggested order

1. Decisions D1-D6 (an hour of thinking, saves weeks).
2. Sections 2 and 3 (run it properly, with real data).
3. Section 4 (deploy) and 5 (APK on phones), then a one-day dry run with a friend driving.
4. Section 6 (stress) while fixing what it finds.
5. Section 7 (pilot), with section 8 data collected as you go.
6. Section 9 (study) in the last pilot days.
7. Sections 10 and 11 (write-up), starting the diagrams early.

## Timing

The proposal gives 12 months from May 2026, so the end date is about May 2027; ask your supervisor for the real submission date, since the pilot, not the code, decides whether you finish on time. Rough effort: system testing about 1 week, controlled evaluation about 1 week (while the pilot collects data), pilot 2 to 4 weeks, ETA tuning about 1 week after that, user study about 2 weeks beside the pilot, documents 3 to 4 weeks (start the outline now).

## Biggest risks

1. **Pilot access.** You need a real bus and driver on Route 138. Line this up first; the pilot, the ETA results and the study all wait on it.
2. **Not enough ETA data.** A few trips give weak error figures. Plan for many trips on one route.
3. **Free-tier hosting.** The Railway trial lasts about a month and free tiers may sleep or have no backups; note the plan in the load test.
