# Database schema

MongoDB database `smart_bus_tracking` on a local install (the default `MONGODB_URI`). On Atlas the database is named in the connection string, `smartbus` in `docs/SETUP-MONGODB.md`. Models are in `backend/models/`; the default URI is in `backend/config/env.js`. Status values and id formats come from the shared contract (`STATUS`, `formatId` in `backend/lib/contract.js`; the first status is the default), and ids are issued by `nextId` in `backend/lib/sequence.js`. All main collections have `createdAt` and `updatedAt`.

## Collections

### routes

| Field | Type | Notes |
|---|---|---|
| `routeId` | String, unique | `RT-001`, generated |
| `routeNumber` | String | Public number, e.g. `138` |
| `name`, `start`, `end` | String | |
| `distance` | Number | km |
| `path` | GeoJSON `LineString` | Road geometry, coordinates `[lng, lat]`. **2dsphere index** |
| `stopPoints` | Array of `{ name, location: GeoJSON Point }` | Stops in travel order. Consecutive stops define the ETA segments. **2dsphere index** on `stopPoints.location` |
| `stops` | [String] | Stop names, kept in step with `stopPoints` |
| `assignedBus` | String | `"<registration> (<busId>)"` |
| `status` | `Active` / `Inactive` / `Under Construction` | |

### buses

| Field | Type | Notes |
|---|---|---|
| `busId` | String, unique | `BUS-001`, generated |
| `registration` | String, unique | Driver app login name |
| `capacity`, `mileage` | Number | |
| `password` | String | scrypt hash. Never returned by the API |
| `assignedDriver` | String | `driverId` of the assigned driver |
| `status` | `Active` / `Idle` / `Maintenance` | |

### drivers

`driverId` (unique, `DRV-001`), `name`, `license` (unique), `expiry`, `phone`, `status` (`Active` / `Inactive` / `On Leave`).

### admins and passengers

| Collection | Fields |
|---|---|
| `admins` | `username` (unique), `password` (scrypt hash), `name`, `role` |
| `passengers` | `username` (unique, lowercase), `password` (scrypt hash), `name`, `phone` |

### trips

One run of a bus along its route: `tripId` (unique), `busId`, `routeId`, `startedAt`, `endedAt`, `completed` (true only when the bus reached the final stop; false when the trip was closed by going off duty, by a new trip from the first stop, or by a route change). Written by `backend/lib/tripRecorder.js`, like the segment, ETA and GPS logs.

### segmentlogs

One measured crossing of a segment. The averages are the ETA engine's historical baseline.

| Field | Notes |
|---|---|
| `routeId`, `segIndex` | Segment `i` runs from stop `i` to stop `i+1`. Compound index |
| `tripId`, `busId` | |
| `traversalSec` | Moving time across the segment |
| `dwellSec` | Time under 1.5 m/s within 40 m of a stop |
| `at` | When the bus finished the segment |

### etalogs

Predicted versus actual arrival at a stop: `routeId`, `tripId`, `busId`, `stopIndex`, `predictedAt`, `predictedArrival`, `actualArrival`, `horizonSec` (how far ahead the prediction was made), `errorSec` (predicted minus actual), and the plain baseline for the same moment: `baselineArrival`, `baselineErrorSec`.

### gpslogs

Accepted fixes: `busId`, `routeId`, `tripId`, `location` (GeoJSON Point as the phone reported it, **2dsphere index**), `smoothed` (GeoJSON Point after smoothing: what the ETA engine and passengers used), `accuracy` (metres), `speed`, `heading`, `deviceTs`, `serverTs`, `buffered`. A TTL index on `serverTs` deletes records after 14 days.

### counters

`name`, `seq`: sequence numbers for the generated ids.

## Redis keys

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `bus:<busId>:last` | String (JSON `busUpdate`) | 60 s | Latest fix and ETAs for one bus |
| `route:<routeId>:buses` | Set of bus ids | 60 s, renewed by every write | Which buses to read for a route snapshot |
| `buses:active` | Set of bus ids | – | All buses with a cached fix |

The sets are indexes; the `bus:<busId>:last` value is the truth. A read drops set members whose value expired, cannot be parsed, or (for a route set) names another route, so a corrupt value never fails a `route:subscribe`. The store contract is tested against memory always and against Redis when `REDIS_URL` is set (`backend/test/store.test.js`).

Without `REDIS_URL`, or if Redis cannot be reached at startup, the same data is kept in process memory. That fallback is for local development only.

## Relationships

```mermaid
erDiagram
  ROUTE ||--o{ TRIP : "is run as"
  BUS ||--o{ TRIP : "makes"
  DRIVER |o--o| BUS : "assigned to"
  BUS }o--o| ROUTE : "assigned to"
  TRIP ||--o{ SEGMENTLOG : "produces"
  TRIP ||--o{ ETALOG : "produces"
  TRIP ||--o{ GPSLOG : "produces"
```
