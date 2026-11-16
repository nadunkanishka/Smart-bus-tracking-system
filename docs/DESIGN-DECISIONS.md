# Design decisions

The choices that shaped the system, with the reason and what each one costs. Details are in [ARCHITECTURE.md](ARCHITECTURE.md).

## The phone is the only tracking hardware

Sri Lanka's buses have no GPS units, and fitting them is the expensive part of every tracking system. The driver's own phone is the tracker: it needs a bus password, nothing installed in the vehicle. The cost is that tracking depends on the driver keeping the app open (see "Foreground-only tracking" below).

## One contract, written once

`shared/contract.js` holds what the server and its three clients must agree on: Socket.IO event names, status values, id formats, the timing windows (a fix every 3 s, "live" for 15 s, forgotten after 60 s), and the batch and speed limits. `shared/sync.js` copies it into the backend (`backend/lib/contract.js`, as CommonJS) and into each app, and CI fails when a copy is stale or was edited by hand. A renamed event cannot silently break one client, and a test (`backend/test/contract.test.js`) keeps the windows in order.

The same mechanism carries the design system (colours, type, the shared mobile kit). The trade-off is generated files in the repository; they are marked, excluded from lint and from Sonar's duplication check, and verified in CI.

## ETA from segments, not from distance over speed

A route is a road polyline with ordered stops; consecutive stops are segments. The engine projects each fix onto the polyline, divides the road distance left in the current segment by the current speed (or the segment's usual speed when the bus is stopped), and adds each later segment's historical traversal time plus the usual dwell at stops. History comes from the buses' own trips (`SegmentLog`), so the estimate improves as the system is used. A segment with no history falls back to 20 km/h and a 20 s dwell.

Every prediction is stored with what a plain estimate (straight-line distance at a fixed 5.5 m/s) said at the same moment, so the engine's value is measured, not assumed (`/api/analytics/eta`).

## Two skins, one contract

The phone apps and the admin dashboard share the contract and the component logic but not the look. The phone apps are flat: black and orange on white, filled grey cards, pill buttons and chips, large bold headings, no gradients, no glow and no shadows, so a card is separated from the page by colour, not depth (`shared/tokens.js`). The admin keeps its own tokens (`shared/adminTokens.json`) and its glass-on-dark look. Splitting the tokens meant the phone redesign touched no admin file.

## Smooth the GPS before anything uses it

Phones report positions that wander 10 to 25 m. A constant-velocity Kalman filter (`backend/lib/smooth.js`) trusts a fix less when its accuracy is poor, holds position at a stop, skips a one-fix spike but accepts a real jump after two, and restarts after a long gap. The raw fix is kept next to the smoothed one in `GpsLog`, so the comparison can be repeated on real data. The price is a short lag after a sharp corner, capped by a unit test.

## The offline queue is part of the protocol

Mobile signal drops. The driver app queues fixes (persisted, capped at 2000), and on reconnect sends them oldest-first as `gps:batch` in chunks of 500, removing a chunk only after the server acknowledges it. A lost acknowledgement means the chunk is sent again and the server discards repeats by timestamp: at-least-once delivery with idempotent handling. Buffered fixes feed trip history; only the newest reaches passengers.

## A latest-fix store with a fallback

Passengers who subscribe get the latest position of every bus on the route at once (`route:snapshot`). That read model lives in Redis when `REDIS_URL` is set and in process memory otherwise, behind one interface (`backend/lib/store.js`) with one contract test run against both. The in-memory store keeps local development and the free hosting simple; the cost is that more than one API instance needs Redis (and a Socket.IO adapter).

## A bus belongs to one route; a route has many buses

The link is `Bus.routeId`. A bus cannot be on two routes by construction, the server answers 409 when asked to, and the admin form only offers free buses. The earlier model stored the bus as text on the route, allowed duplicates and matched by regex.

## A route is run in both directions

A route is stored once, from its first stop to its last. The return trip is the same road and the same stops read backwards: the server builds a reversed view of the route (`lib/routeCache.js`, key `routeId:direction`), so the ETA engine, which needs stops at increasing distance, runs unchanged. Direction belongs to the bus, not the route: a bus starts on the leg of the terminal it is nearer to and flips legs by itself when it reaches the end, so one bus can run A to B while another, which started its duty at B, runs B to A. Trips, segment logs and ETA logs carry the direction, so the history baseline is per direction. A passenger at B going to A sees a bus that is still coming from A: each update also carries `nextStops`, the stops of the other leg with the rest of this leg plus a turnaround (`TURNAROUND_SEC`, a guess to tune) added, so the wait is honest. Limits: the return uses the same road and stops (one-way streets or different return stops need a route of their own), and a bus that starts duty mid-route is placed by its nearer terminal, not its heading.

## The live path never waits for the database

A fix is validated, smoothed, turned into ETAs, cached and broadcast. The raw record is appended to an in-memory buffer that is written to MongoDB every 5 seconds (`backend/lib/tripRecorder.js`). A slow or failed write costs history, never a late bus. Delivery measured with ten simulated buses was a few milliseconds on one machine (see the results in the README).

## One error path, one role table

Route handlers throw `httpError(status, message)`; one handler turns it, Mongo duplicate-key errors and validation errors into `{ error }` with the right status. Which role may call what is one table (`backend/middleware/access.js`) instead of guards scattered over routes. Both are small enough to read in a minute and are covered by tests.

## Foreground-only tracking, for now

The installed driver app crashed after location permission was granted, with Expo's Android foreground service the suspect. Until it is verified on a phone, the app takes positions while it is open and keeps the screen awake (`BACKGROUND_TRACKING = false`). It costs tracking with the screen off. The switch is one constant, and the background code path is kept.

## The phone map is drawn by the app

The first native map used the Google Maps SDK and showed nothing when the key was restricted. A WebView map showed nothing on the installed builds either. The map is now ordinary images (Esri gray tiles, light and dark) with an SVG layer for the route and stops and marker views for the buses, with drag, pinch and zoom buttons (`shared/native/LiveMap.native.js`, the maths in `mapMath.js` with its own tests). It needs no key and no WebView. OpenStreetMap's own tile server was tried and rejected: it blocks requests an Android image view cannot make acceptable. Esri's free tiles suit a pilot; a launch would use a provider with a key.

## Updates without reinstalling

JavaScript changes reach installed apps with `eas update` (no rebuild); native changes need a build, whose version code rises by itself so it installs over the old app.

## What was left out on purpose

- Return legs: a route is one direction; a bus driving back is modelled as its own route.
- Pagination: lists are searched and filtered in the admin; the data is small.
- Per-admin permissions: every admin can do everything.
- Password reset for passengers: there is no email or SMS channel.
- Redis hosting: the free pilot runs on the in-memory store.

[ARCHITECTURE.md](ARCHITECTURE.md) lists the known limits.
