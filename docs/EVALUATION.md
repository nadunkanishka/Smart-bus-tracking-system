# Evaluation guide

How to collect the three quantitative metrics in the proposal, and the user-study data.

## 1. Data propagation latency

Each `bus:update` carries three timestamps: `deviceTs` (phone clock when the fix was captured), `serverRecvTs` and `serverEmitTs`.

| Measure | Where to read it | Caveat |
|---|---|---|
| Server processing (receive to emit) | `GET /api/metrics` → `latencyMs.serverProcessing`, or the Live Monitor page | One clock, exact |
| Device to server | `GET /api/metrics` → `latencyMs.deviceToServer` | Includes the difference between the phone's clock and the server's |
| End to end (device to passenger) | `npm run replay` summary line | Exact when driver, server and passenger run on one machine. Over a real network it adds network time but still uses one clock |

For the report, use the replay figure for controlled end-to-end latency and state the network it ran over. For the pilot, keep phones on automatic network time and report device-to-server latency with the clock caveat. Fixes replayed from the offline buffer are excluded from all latency figures.

```bash
cd backend
npm run replay -- --route RT-001 --buses 10 --duration 300 --quiet
# end-to-end latency (device -> passenger): avg … ms, p95 … ms, peak … ms
```

## 2. ETA prediction accuracy

Every time a bus leaves a stop, the predicted arrival at each later stop is stored. When the bus arrives, an `EtaLog` record is written with `predictedArrival`, `actualArrival`, `horizonSec` and `errorSec`.

- Summary: `GET /api/analytics/eta?routeId=RT-001` returns the mean absolute error, the bias and the worst miss, plus the comparison with the plain baseline below. The Trip Analytics page shows the same.
- Raw data for charts and error-by-horizon analysis:

```bash
mongoexport --uri "$MONGODB_URI" --collection etalogs --type csv \
  --fields routeId,tripId,busId,stopIndex,predictedAt,predictedArrival,actualArrival,horizonSec,errorSec,baselineArrival,baselineErrorSec --out eta-errors.csv
```

### Comparison with a plain estimate

To show the engine is worth its complexity, every prediction is stored next to what a plain estimate said at the same moment: the straight-line distance from the bus to the stop divided by a fixed average speed (5.5 m/s, about 20 km/h; `baselineSpeedMps` in `backend/lib/eta.js`). It uses no road, no live speed, no history and no dwell. Both are scored on the same arrivals (`compared` in the analytics response, and split by how far ahead the prediction was made in `byHorizon`). Report the improvement as engine error against baseline error, never the engine alone.

Arrival is detected when a fix first lands past the stop, so each arrival time has up to 3 seconds of resolution error.

Simulated buses move at a constant speed, so their ETA error says little about real accuracy. Meaningful figures need pilot trips with real traffic. Until a segment has recorded trips the engine uses 20 km/h and a 20 s dwell, so expect larger errors on the first runs of a route and compare first-day error with later days.

## 2b. GPS smoothing

Phones report positions that wander 10-25 m. The server smooths each bus's track before the ETA engine and the passenger map see it (`backend/lib/smooth.js`): a constant-velocity Kalman filter that trusts a fix less when the phone reports a poor accuracy, a spike gate that skips a wild fix but never more than two in a row, and a stop hold so a waiting bus does not wander about its stop. All the settings are in one block at the top of that file. The raw fix is never discarded: `gpslogs` keeps `location` (as reported) and `smoothed` (what was used) side by side. Set `GPS_SMOOTHING=off` to switch it off and compare.

Measure the drift before and after on a track with known truth:

```bash
cd backend
node scripts/smoothing-eval.js 141     # a real road line from the database; 138 is the pilot route
```

Figures from this run (Route 141, 13.2 km, a bus at 8 m/s, a fix every 3 s, a 40 s stop at every third stop; mean error in metres, raw then smoothed; the same noisy fixes go through both):

| GPS noise | Position error | Distance off the road | At a stop |
|---|---|---|---|
| 10 m | 10.7 to 8.8 | 6.2 to 5.2 | 13.5 to 5.4 |
| 15 m | 15.6 to 11.9 | 9.0 to 6.9 | 18.8 to 7.4 |
| 25 m | 25.5 to 17.6 | 15.1 to 10.3 | 29.5 to 11.9 |

At 12 m/s with a fix every second the 15 m case goes from 15.7 to 9.8. The price is lag at sharp turns: a few fixes late after a 90 degree corner, covered by a unit test that caps the worst error. A live check with the replay simulator, which can add noise and reports how far the passenger's bus was from the truth (one bus only), gave 15.1 m with smoothing off and 12.0 m with it on:

```bash
npm run replay -- --route RT-001 --buses 1 --speed 12 --interval 1000 --duration 240 --noise 15 --quiet
GPS_SMOOTHING=off npm start          # for the comparison run, start a second backend with the smoother off on another port
```

These are simulated tracks with added noise. Say so in the report, and repeat the comparison on the pilot's real GPS logs (raw `location` against `smoothed`).

## 3. Load stability

```bash
cd loadtest
ROUTE_ID=RT-001 JWT_SECRET=<backend secret> npx artillery run artillery.yml --output report.json
npx artillery report report.json
```

`artillery.yml` ramps to 15 new virtual users per second for a minute. One in five is a driver sending a fix every 3 seconds, and the rest are passengers subscribed to the route. Report from the output: `socketio.response_time` (acknowledgement latency: min, median, p95, p99, max), `vusers.failed`, `errors.*` and the emit rate. While it runs, watch the Live Monitor page for rejected fixes and server processing time. Change the `phases` block to test other loads, and record the machine or hosting plan used.

## 4. Segment journey times

`GET /api/analytics/segments?routeId=RT-001` returns, per segment, the number of trips, average, median, 90th percentile, fastest and slowest traversal, average dwell, and the raw samples. Export the raw records with:

```bash
mongoexport --uri "$MONGODB_URI" --collection segmentlogs --type csv \
  --fields routeId,segIndex,tripId,busId,traversalSec,dwellSec,at --out segment-times.csv
```

## 5. User study

The apps do not collect questionnaire answers. Use an external form:

1. Build the questionnaire in Google Forms: consent statement, usage context, the ten System Usability Scale items (1–5), and satisfaction questions on arrival-time accuracy and reliability.
2. Share the link with pilot commuters (a QR code at the stops works well).
3. Export responses with **Responses → Download responses (.csv)** and keep the file with the evaluation data.

Do not collect names or phone numbers unless your ethics approval covers it.
