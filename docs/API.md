# API specification

Base URL: `http://localhost:5000` in development. REST paths are under `/api`. Bodies and responses are JSON. Errors are `{ "error": "message" }`.

Protected endpoints need `Authorization: Bearer <token>`. Login endpoints are limited to 50 requests per 15 minutes per IP.

## REST

### Health and auth

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| GET | `/api/health` | open | – | `status`, `mongo`, `cache` (`redis` or `memory`), `sockets` |
| POST | `/api/auth/login` | open | `username`, `password` | `token`, `user` (admin) |
| POST | `/api/auth/driver-login` | open | `registration` (or `busId`), `password` | `token`, `bus`, `driver`, `assignedRoute` (with `path` and `stopPoints`) |
| POST | `/api/passengers/register` | open | `name`, `username` (3–30 chars), `password` (6+), `phone` optional | `token`, `user` |
| POST | `/api/passengers/login` | open | `username`, `password` | `token`, `user` |

### Routes

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/routes` | open | All routes with geometry |
| GET | `/api/routes/:id/buses` | open | Live buses on a route, read from the latest-fix cache |
| POST | `/api/routes` | admin | See body below |
| PUT | `/api/routes/:id` | admin | `:id` is the `routeId` (e.g. `RT-001`) or the Mongo `_id` |
| DELETE | `/api/routes/:id` | admin | |

Route body: `name`, `routeNumber`, `start`, `end`, `distance` (km), `assignedBus`, `status`, plus geometry as plain arrays:

```json
{
  "path": [[6.9344, 79.85], [6.9147, 79.8778]],
  "stopPoints": [{ "name": "Pettah", "lat": 6.9344, "lng": 79.85 }]
}
```

`path` is `[lat, lng]` pairs. The server stores it as GeoJSON (`[lng, lat]`), and responses return the GeoJSON form: `path.coordinates` and `stopPoints[].location.coordinates`.

### Fleet (admin)

| Method | Path | Notes |
|---|---|---|
| GET / POST | `/api/drivers` | `name`, `license`, `expiry`, `phone`, `status` |
| PUT / DELETE | `/api/drivers/:id` | `:id` is `driverId` or `_id` |
| GET / POST | `/api/buses` | `registration`, `capacity`, `mileage`, `password`, `assignedDriver` (a `driverId`), `status` |
| PUT / DELETE | `/api/buses/:id` | A blank `password` keeps the current one |
| GET | `/api/dashboard/summary` | Counts for the dashboard |

Bus responses never include the password. They carry `hasPassword: true/false`.

### Monitoring and analytics (admin)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/live` | Per bus: `connected`, `onDuty`, `lastSeen`, `lat`, `lng`, `speed`, `tripId` |
| GET | `/api/metrics` | Fix counters, open sockets, cache kind, latency (`deviceToServer`, `serverProcessing`: `avg`, `p95`, `max` in ms) |
| GET | `/api/analytics/segments?routeId=RT-001` | Per segment: `samples`, `traversalSec` (`avg`, `min`, `p50`, `p90`, `max`), `dwellSecAvg`, raw `values` |
| GET | `/api/analytics/eta?routeId=RT-001` | `samples`, `maeSec`, `biasSec`, `maxAbsSec` |

## Socket.IO events

Connect to the base URL. Drivers pass their token in the handshake: `io(url, { auth: { token } })`.

### Passenger

| Direction | Event | Payload |
|---|---|---|
| client → server | `route:subscribe` | `{ routeId }`. Leaves any previous route room. Ack: `{ ok, buses }` |
| client → server | `route:unsubscribe` | – |
| server → client | `route:snapshot` | `{ routeId, buses: [busUpdate], serverTs }`, sent once after subscribing |
| server → client | `bus:update` | `busUpdate` (below), on every accepted live fix |
| server → client | `bus:offline` | `{ busId }`, when a driver goes off duty |

`busUpdate`:

```json
{
  "busId": "BUS-001", "registration": "NA-1111", "driverName": "A. Bandara", "routeId": "RT-001",
  "lat": 6.9211, "lng": 79.8702, "speed": 9.4, "heading": 132,
  "deviceTs": 1791306871911, "serverRecvTs": 1791306871950, "serverEmitTs": 1791306871953,
  "segIndex": 0, "offRouteM": 6, "finished": false, "buffered": false,
  "stops": [
    { "index": 0, "name": "Pettah", "status": "passed", "etaSec": null, "etaMin": null },
    { "index": 1, "name": "Borella Junction", "status": "upcoming", "etaSec": 312, "etaMin": 5 }
  ]
}
```

### Driver

| Direction | Event | Payload |
|---|---|---|
| client → server | `driver:duty` | `{ onDuty: true/false }`. Off duty removes the bus from the map |
| client → server | `gps:fix` | `{ lat, lng, speed, heading, accuracy, ts, seq }`. `speed` in m/s, `ts` device epoch ms. Ack: `{ ok, result, nextStopIndex }` where `result` is `accepted`, `duplicate` or a rejection reason |
| client → server | `gps:batch` | Array of up to 1000 fixes from the offline queue. Ack: `{ ok, accepted, duplicate, rejected, lastTs }` |
| client → server | `driver:auth` | `{ token }`. Alternative to the handshake token, used by the load tests |
