# Project plan and to-do list

Written 2026-11-12 from the proposal (E179947, submitted 31 May 2026) and a read of the code on branch `pilot-prep`.
Status is judged from the code and the 36 passing backend tests (and 1 admin test), not from the proposal. Updated 2026-11-12 after the smoother, baseline comparison and Colombo routes were merged to `dev`.

## Where you are

The software is built. What is left is mostly **evidence**: deploy it, run the pilot, collect the numbers, write the reports.

| # | Proposal phase | Status | Basis in the code |
|---|---|---|---|
| 1 | Literature review and requirements | Not checkable from code | An interim report exists (referenced in `backend/lib/smooth.js`). Confirm the final report has the review chapter. |
| 2 | System design and architecture | **Done** | `docs/ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `STRUCTURE.md` |
| 3 | Backend, real-time pipeline | **Done** (about 95%) | Socket.IO rooms per route, `gps:fix` and `gps:batch`, Redis latest-fix cache with in-memory fallback, GeoJSON `2dsphere` indexes, JWT auth, CRUD routes, validation, rate limiting |
| 4 | Driver app | **Done** (about 90%) | 3 s GPS capture, offline queue with batch flush and ack, duty toggle, diagnostics screen. Works in Expo Go on a real phone (reported). Never built as an APK (only `eas.json` exists). |
| 5 | Passenger app | **Done** (about 90%) | Route list, per-route subscription, live map with gliding markers, per-stop ETAs. Web build uses Leaflet and OpenStreetMap. |
| 6 | ETA engine | **Built, not tuned** (about 70%) | `lib/eta.js` follows steps (a) to (d); `tripTracker` logs segment times, dwell and predicted-vs-actual into `SegmentLog` and `EtaLog`. Kalman GPS smoothing (`lib/smooth.js`) is built, tested, measured on simulated tracks and merged, and a straight-line baseline is logged beside every prediction. Tuning the ETA needs real trip data, which does not exist yet. |
| 7 | Admin dashboard | **Done** (about 95%) | Routes with a map editor, stops, buses, drivers, passengers, admins, live monitor, trip analytics, settings, dark mode |
| 8 | Integration and system testing | **Partly done** (about 50%) | 36 backend tests pass (ETA, GPS pipeline, CRUD, route data, smoothing, baseline). A simulator (`npm run replay`) and a smoke script exist. A two-phone run in Expo Go worked (reported), but no installed-build run on a road; the driver and passenger apps have no tests. |
| 9 | Live pilot deployment | **Not started** | No deployed URL anywhere. `render.yaml` and `docs/DEPLOYMENT.md` are ready. Route 138 (Pettah to Homagama) is chosen and seeded. |
| 10 | Performance evaluation | **Tooling ready, no results** | `/api/metrics`, replay latency summary, `loadtest/artillery.yml`, `docs/EVALUATION.md`. No run recorded. |
| 11 | User study | **Not started** | `EVALUATION.md` plans Google Forms with SUS. No questionnaire, no ethics or consent text yet. |
| 12 | Documentation and report | **Technical docs done, report not started** | Docs cover architecture, API, schema, deployment. The ESOFT / London Met final report is not in the repo. |

## Deliverables check

| Deliverable | State |
|---|---|
| Driver app, Android APK | Code done. **APK not built.** |
| Passenger web and mobile app | Code done. Web build not deployed. |
| Admin dashboard | Done. Not deployed. |
| Deployed backend with Redis and MongoDB, load tested | Code and config done. **Not deployed, not load tested.** |
| Performance evaluation report | **Not started** (tooling only) |
| User study report | **Not started** |
| Technical documentation | Done. Needs a final accuracy pass and diagrams for the report. |
| Final project report | **Not started** |

## Promises in the interim report (dated 6 Aug 2026) that the final report must keep

The interim report is stricter than the proposal. The final report will be marked against these.

| Interim report says | Code today | To-do |
|---|---|---|
| **Kalman filter** and distance-threshold smoothing (named only under challenges) | `lib/smooth.js` is merged (PR 27), tested, and measured on simulated tracks (`docs/EVALUATION.md` 2b). | Add a short Kalman paragraph to the implementation section of the final report; repeat the raw-vs-smoothed comparison on pilot logs. |
| Commuter survey on a **Likert scale** | Not built. | Covered in group G below (the SUS items are Likert). |
| Phase 8 shifted one week and run **in parallel with Phase 9** | Matches the plan below (testing and pilot start together). | Keep this ordering. |

Interim report slips to fix in the final report (not code):
- Phase 6 is "In Progress" in Table 2 and "Completed (core logic built)" in Table 3. It becomes "Completed" only after tuning on pilot data.
- The Kalman delay is given as 1.5 weeks, 2 weeks and "Ext. 2 wks". Use one figure.
- The Phase 6 month is given as Month 6 to 7 in one place and Month 7 to 8 in another.
- Citations: in-text years (Avvenuti 2012, Vigneshwaran 2023) do not match the reference list (both 2026). Several references are "Anon." with no author.
- The declaration lists "Module Leader: Nadun Kanishka", which is your own name, and the signature line is an email address.
- The interim report says the pilot route is named `route:138-colombo-homagama`; the code uses ids like `RT-001`. Say which is a display name.

## Gaps against the proposal wording

- **Redis**: the code uses it when `REDIS_URL` is set and falls back to memory otherwise. Your machine has no Docker or Redis. The report should show a run with real Redis (Render Key Value), or say plainly that the fallback was used.
- **Leaflet in the mobile app**: the proposal says Leaflet on the passenger map. The web build uses Leaflet, the native build uses `react-native-maps` with OSM tiles. Say so in the report.
- **Objectives mention "Leaflet.js / Google Maps API" and "React Native / Flutter"** as options evaluated. Your chosen stack is in the code, so the report needs the comparison that justifies it.
- **Admin "register bus stops"**: stops are managed inside the route form. Fine, but name it that way in the report.

## To-do list

Do these in order. Each group ends in something you can show.

### A. Finish the code in flight (about 2 days)
- [x] Finish GPS smoothing: wire it in, review the uncommitted changes to `eta.js`, `tripTracker.js`, `realtime.js`, `EtaLog`, `GpsLog`, `Analytics.js`, run `npm test`, commit on a branch from `dev`. Done: PR 27, 36 backend tests.
- [x] Run `smoothing-eval.js` and keep the raw-vs-smoothed numbers for the report. Done: figures in `docs/EVALUATION.md` 2b.
- [x] Merge the open branches (`pilot-prep`, `pilot-routes` is merged; check `database`, `ui`, `docs`) into `dev`, then `dev` into `main` once CI is green. Done: `database`, `ui`, `docs`, `pilot-routes`, `pilot-prep`, `docs-system-plan` are all in `dev`. Only `dev` into `main` remains (your call), and the old local `fix/ci-admin-install` was left unmerged on purpose.

### B. Deploy (about 2 days)
- [ ] Create MongoDB Atlas free cluster; put the URI in Render.
- [ ] Deploy the backend with `render.yaml`, including the Render Key Value (Redis). Check `/api/health` shows mongo connected and `kind: redis`.
- [ ] Deploy the admin dashboard (static site) and the passenger web build; set CORS.
- [ ] Build the driver APK with EAS (`preview` profile) and install it on a real Android 10+ phone.
- [ ] Point both mobile apps at the deployed API and test sign-in, GPS stream, and ETA display on real phones.

### C. System testing (about 1 week)
- [ ] Walk the full flow on real phones: register, assign bus, go on duty, watch from the passenger app, go offline mid-trip and reconnect (offline buffer), end the trip.
- [ ] Record a short test log (date, device, result) for the report's testing chapter.
- [ ] Add a few tests for the driver telemetry queue and the passenger live-bus hook, or document manual test cases instead.
- [ ] Fix whatever the phone tests break.

### D. Controlled evaluation (about 1 week)
- [ ] **Latency**: `npm run replay -- --route RT-001 --buses 10 --duration 300 --quiet` against the deployed server; record average, p95, peak. Repeat with 1, 5, 10, 25 buses.
- [ ] **Load**: `artillery run` with the deployed URL, record the hosting plan; keep `report.json` and the HTML report.
- [ ] **Redis effect** (optional, strengthens the report): same load with and without Redis.
- [ ] Save all raw outputs under a new `evaluation/` folder so the report can cite them.

### E. Pilot on Route 138 (2 to 4 weeks, the long pole)
- [ ] Get permission from a bus owner or driver; get ethics or consent wording from your supervisor.
- [ ] Register the bus and driver in admin; put the phone in a holder with a charger and a data plan (budget LKR 500 to 1,000 per month).
- [ ] Run at least 10 to 15 real trips across morning, midday and evening. Real trips are needed to fill `SegmentLog` and `EtaLog`.
- [ ] Check the 25-route stop coordinates for 138 against the real stops; fix any that are off.
- [ ] After the first week, compare first-day ETA error with later days (the engine starts from 20 km/h and 20 s dwell defaults).

### F. ETA tuning and accuracy results (about 1 week, after E has data)
- [ ] Export `etalogs` and `segmentlogs`; compute mean absolute error, bias, error by horizon (1, 5, 10, 20 minutes ahead).
- [ ] Tune with real data (dwell handling, stopped-bus speed fallback, rush-hour vs off-peak history). Keep before and after numbers.
- [ ] Compare against a plain Haversine-at-average-speed baseline to prove the proposal's claim that segmenting is better. This is the strongest single result in the report. Logging and the comparison table are built (Trip Analytics, `/api/analytics/eta`); the result needs pilot trips.

### G. User study (about 2 weeks, runs beside E)
- [ ] Build the Google Form: consent, usage context, 10 SUS items, ETA accuracy and reliability questions.
- [ ] Make a QR code poster for the pilot stops and for the bus.
- [ ] Target at least 20 to 30 responses. Export CSV, compute the SUS score and satisfaction summaries.

### H. Documents (about 3 to 4 weeks, start the outline now)
- [ ] Final report outline matching the ESOFT / London Met template; ask your supervisor for the template and word limit.
- [ ] Literature review and technology comparison chapters (objectives 1 and 2).
- [ ] Design chapter: reuse `ARCHITECTURE.md`, draw the architecture, sequence, ER and ETA flow diagrams.
- [ ] Implementation chapter with screenshots from the real phones.
- [ ] Performance Evaluation Report (latency, ETA error, load), with charts.
- [ ] User Study Report.
- [ ] Update `docs/` so API, schema and deployment guide match the deployed system.
- [ ] Reflection, limitations (single route, one bus, phone clock differences), future work.
- [ ] Supervisor review round, then submit.

## Suggested order and timing

```
Now        A  finish smoothing, merge
+1 week    B  deploy, build APK
+2 weeks   C  system testing    -> start E (pilot) and G (survey) straight away
+3 weeks   D  controlled latency and load runs (while pilot collects data)
+4 to 7    E  pilot trips continue; H drafting in parallel
+8 weeks   F  ETA tuning and accuracy results
+9 to 10   H  finish report, supervisor review
```

The proposal gives 12 months from May 2026, so the end date is about May 2027. The bar chart on page 6 of the PDF shows which month each phase was meant to fall in; I could only read the phase names, not the bars. Compare the table above with it, and ask your supervisor for the real submission date, since the pilot, not the code, decides whether you finish on time.

## Biggest risks

1. **Pilot access.** You need a real bus and driver on Route 138. Line this up first; everything in E, F and G waits on it.
2. **Not enough ETA data.** A few trips give weak error figures. Plan for many trips on one route rather than a few on many.
3. **Free-tier hosting sleeps** (Render free spins down). Use a paid hour-by-hour plan or ping the server before pilot runs, and note the plan in the load test.
4. **Unmerged work.** Several branches are not in `main`. Merge before deploying so the deployed code is the tested code.
