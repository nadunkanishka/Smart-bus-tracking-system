# System plan: from working code to a pilot-ready system that matches the reports

Written against the approved proposal (31 May 2026) and the interim report. Tick the boxes as you go.
Boxes marked **(you)** need your hands, an account, a person or a decision; the rest are things you can run, or ask for help with.

## 0. Where things stand

**Built and checked in this repository**

- Backend: Node/Express, Socket.IO rooms per route, MongoDB (GeoJSON), Redis-or-memory latest-fix cache, JWT roles, the ETA engine (polyline snapping, live speed, historical segment times, dwell), trip and ETA logging, metrics endpoint, 23 automated tests including CRUD against a real database.
- Admin dashboard: drivers, buses, routes with a map editor, live monitor, trip analytics, passenger and administrator accounts, settings, light and dark mode.
- Driver app (Expo, Android): 3-second GPS, offline buffer with sequence numbers, on/off duty, background tracking in an installed build.
- Passenger app (Expo, web and native): live map, ETA per stop, route and stop selection, account screens.
- Tooling: GPS replay simulator, Artillery load test, Render blueprint, EAS profile for the APK, CI on every push.

**Not done or never verified**

- Nothing has run on a phone on a real road, and nothing is deployed. All evidence so far is local or simulated.
- Redis has never been exercised here (this machine has no Docker or WSL), so the Redis path is untested.
- No measured latency, ETA error or load figures exist yet. The report must not claim any until they do.
- The reports describe two things the code does not do (see section 1).

## 1. Decisions (made)

- [x] **D1. GPS smoothing: build it.** Add server-side smoothing before the ETA engine (a distance-threshold filter, and a basic Kalman filter if it measurably helps) so the interim report's claim becomes true. New work items:
  - [ ] Design: where it sits (after validation, before trip tracking and the ETA engine), per-bus state, reset on a new trip or a long gap.
  - [ ] Implement with the thresholds in one config block, and keep the raw fix next to the smoothed one in the log so both can be compared.
  - [ ] Unit tests: a jittery track becomes smoother, a real turn is not cut off, a genuine stop stays a stop, an out-of-order fix is ignored.
  - [ ] Measure drift before and after on a recorded or replayed noisy track (10-25 m noise, as in the report) and keep the figures for the evaluation.
- [x] **D2. Pilot route: Pettah to Homagama (Route 138).** The route data must say this everywhere.
  - [ ] **(you)** Ride the corridor once and note the real stops in order (Pettah, Borella and so on through Nugegoda, Maharagama and Pannipitiya to Homagama; use whatever the real service stops at).
  - [ ] Replace the seed route (`backend/scripts/seed.js`) with these stops and the road path, and update the docs and screenshots that name Maharagama as the terminal.
- [x] **D3. Pilot both passenger apps, say so in the report.**
  - [ ] Build the native passenger app as an installable build (EAS), install it on volunteer phones alongside the web app.
  - [ ] Add a paragraph to the report describing the web app and the React Native companion (one Expo codebase), as the proposal promises.
- [x] **D4. Keep passenger and administrator accounts.**
  - [ ] Add one line to the report: these go beyond the approved proposal (self-service passenger accounts, administrator accounts), included for security and usability.
- [x] **D5. Hosting: free.** Render free web service plus the free Key Value (Redis-compatible) and MongoDB Atlas free tier. Free hosting is enough for the pilot's few buses, with these conditions:
  - [ ] Free Render services sleep after about 15 minutes with no traffic. Keep the API awake before and during every run (a free uptime pinger such as UptimeRobot hitting `/api/health` every 5 minutes), and open the app a minute before each shift so nobody meets a cold start.
  - [ ] Render's free instance is small (512 MB), so the 500-driver and 2,000-passenger stress test must not run against it. Run that test against a temporary instance (a paid instance for a few hours costs very little) or locally, and say in the report where it ran.
  - [ ] Free tiers have no backups: export the database collections before and after every pilot day.
  - [ ] Keep an eye on the free limits (monthly hours, Key Value size, Atlas storage) while the pilot runs.
- [x] **D6. Compare the ETA engine with a plain Haversine baseline.**
  - [ ] Log the baseline estimate (straight-line distance divided by the bus's speed) next to the engine's prediction for each stop, using the same inputs.
  - [ ] Extend the analytics (`/api/analytics/eta`) and the Trip Analytics page to show both errors side by side.
  - [ ] Unit tests for the baseline calculation.

## 2. Make it run end to end (locally, first)

- [ ] `npm run install:all`, then `npm test` passes (backend 23 tests, admin test).
- [ ] Start MongoDB, copy `backend/.env.example` to `backend/.env`, set a real `JWT_SECRET` and `ADMIN_PASSWORD`.
- [ ] `npm run seed`, start backend, admin, passenger and driver apps (`docs/DEPLOYMENT.md`, section 1).
- [ ] `npm run replay -- --route RT-001 --buses 3 --duration 120`: buses move on the passenger map, ETAs update, Live Monitor shows drivers, Trip Analytics fills after trips.
- [ ] **(you) Redis.** Without Docker, use a free cloud Redis (Redis Cloud or Upstash) or install Memurai; set `REDIS_URL`; confirm `/api/health` shows `"cache": "redis"` and Live Monitor says Redis. Until then the Redis claim in the report is untested.
- [ ] Read `docs/CRUD-REPORT.md` known limits and decide which matter for the pilot (no passenger password reset, deleted admin tokens valid until expiry).

## 3. Real data for the pilot corridor

- [ ] **(you)** Ride or drive the route once and note the real stops, in order, in both directions if buses run both ways.
- [ ] In the admin Routes page: draw the road path (use "Build path through stops", then correct it on the map) and place every stop. The ETA engine's accuracy depends on this path; a straight line between stops will not do.
- [ ] Register the pilot buses and drivers; set a bus password for each; assign each bus to the route.
- [ ] Run a few slow test drives (or replay) so each segment has recorded trips. Until a segment has trips the engine uses a default speed, and the baseline is not yet real.
- [ ] Check the route on a phone-sized screen: stop names readable, no duplicate stops, terminals correct.

## 4. Deploy

- [ ] **(you)** Create a MongoDB Atlas cluster (free tier), allow Render's addresses, copy the connection string.
- [ ] **(you)** Render: New, Blueprint, this repository. Fill `MONGODB_URI`, `ADMIN_PASSWORD`, `CORS_ORIGIN`. Free instance for the pilot (D5): set up the uptime pinger straight away.
- [ ] `/api/health` reports `mongo: connected` and `cache: redis`.
- [ ] Seed or recreate the route on the cloud database (`MONGODB_URI=<atlas> npm run seed`, then edit in the admin).
- [ ] Deploy the admin as a static site with `REACT_APP_API_URL`; deploy the passenger web export with `EXPO_PUBLIC_API_URL`.
- [ ] Set `CORS_ORIGIN` to the admin and passenger web addresses only.
- [ ] Change the default admin password, remove any test accounts and test buses from the cloud database.
- [ ] Hold the database backup in mind: Atlas free tier has none; export the collections before and after the pilot.
- [ ] Run section 2's replay against the cloud URL and watch the hosted passenger app.

## 5. Driver app on real phones

- [ ] **(you)** Expo account; `eas build --platform android --profile preview` with `EXPO_PUBLIC_API_URL` set to the cloud API; install the APK on each volunteer's Android 10+ phone (`docs/DEPLOYMENT.md`, section 4).
- [ ] On each phone: grant location "all the time" and disable battery optimisation for the app, or background tracking stops.
- [ ] Test on a bench: sign in, go on duty, screen off for 10 minutes, positions keep arriving.
- [ ] Test offline: airplane mode for 2 minutes while moving, then reconnect; the buffered positions arrive in order and the bus does not jump.
- [ ] Test a 1-hour drive, then a 4-hour shift (the interim report names 4 hours): note battery drain, dropouts, cell handovers.
- [ ] Give drivers one page: how to sign in, go on duty, what to do if it stops. Keep the dispatch contact number current.

## 6. Integration and stress testing (proposal phase 8)

- [ ] Edge cases, each written up as pass or fail: bus joins mid-route, bus stops short of the last stop, GPS jump, duplicate and out-of-order fixes, driver disconnects and returns, passenger reconnects, two buses on one route, a bus with no route.
- [ ] Load test to the figures the interim report promises: up to 500 simulated drivers and 2,000 passenger sockets. The shipped `loadtest/artillery.yml` peaks at 15 new users per second, so raise the phases and run it from a separate machine against the deployed API, not localhost.
- [ ] Record Redis memory, Node event-loop lag and socket stability during the peak (Render metrics, and `/api/metrics`). The free tier cannot carry this load (D5): run it against a temporary paid instance or locally, and say which in the report.
- [ ] Keep the Artillery report files; they are evidence for the report.
- [ ] Fix what the test finds before the pilot, not after.

## 7. Pilot (proposal phase 9)

- [ ] **(you)** Written permission from the operator and each volunteer driver; a short consent note saying location is shared only while on duty and what is stored.
- [ ] Decide how long positions (`GpsLog`) are kept and write it down; delete or anonymise after the study.
- [ ] Pilot days and hours agreed; a person checking Live Monitor during each run.
- [ ] Each run logs: date, bus, driver, signal problems, battery level at start and end, anything odd.
- [ ] Use the 2-week contingency the interim report names, and write the dates down as they happen.
- [ ] Take screenshots and screen recordings of the live passenger app during real trips (the report needs them).

## 8. Performance evaluation (proposal phase 10)

All three measures are explained in `docs/EVALUATION.md`.

- [ ] **Latency.** Controlled end to end: `npm run replay` on one machine, once on Wi-Fi, once over 4G, once over 3G (throttle on the phone or router); keep avg, p95 and peak. Pilot: device-to-server from `/api/metrics`, with phones on automatic network time.
- [ ] **ETA accuracy.** From pilot trips, export `etalogs` and report mean absolute error, bias, worst miss, and error by horizon. The shipped analytics give MAE; the interim report also names RMSE, so compute it from the CSV export. Report simulated-bus errors separately or not at all; they say little.
- [ ] **Baseline.** If D6 is yes, compute the Haversine-only estimate for the same arrivals and compare errors.
- [ ] **Throughput.** Packets per second and memory stability from section 6.
- [ ] Put every figure in one table with how it was measured, on what network, over how many trips. Do not round in your favour.
- [ ] Say plainly what the numbers do not show (one route, a few days, a few drivers).

## 9. User study (proposal phase 11)

- [ ] **(you)** Write the questionnaire (Likert scale: ease of use, trust in ETAs, usefulness, would you use it daily; plus two open questions). The app does not collect answers; use an external form (`docs/EVALUATION.md`, section 5).
- [ ] Recruit passengers and drivers who actually used the system; aim for a number you can defend and say how many.
- [ ] Anonymous responses; keep the consent line on the form.
- [ ] Analyse: counts, mean and spread per question, the open answers grouped by theme.
- [ ] Write the User Study Report as its own short document (the proposal lists it as a deliverable).

## 10. Documentation and submission (proposal phase 12)

- [ ] Architecture diagram (three tiers, Socket.IO rooms, Redis, MongoDB) and the ETA data flow. `docs/ARCHITECTURE.md` has the text; draw the figures.
- [ ] REST and WebSocket API specification: `docs/API.md` (check it against the final code once more).
- [ ] MongoDB schema guide: `docs/DATABASE.md` (include the 2dsphere index and the log collections).
- [ ] Deployment runbooks for Render and Railway: `docs/DEPLOYMENT.md`; run it once from a clean checkout and fix anything that is wrong.
- [ ] Driver APK delivered (file plus the build profile), passenger web and admin deployed with working links, a demo video of one live trip.
- [ ] Final report in the London Met / ESOFT format, using the corrections in section 11.
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

## 12. Done means

Check each proposal deliverable against evidence you can show:

- [ ] Driver APK installed and used on real phones.
- [ ] Passenger web and mobile app working against the cloud API.
- [ ] Admin dashboard managing the pilot route, buses and drivers.
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
