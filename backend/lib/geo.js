// Geometry helpers. Points are [lat, lng] in degrees, distances in metres.
// MongoDB stores geometry as GeoJSON, which is [lng, lat]: convert with the helpers at the bottom, nowhere else.

const R = 6371000; // mean Earth radius, metres
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function haversine(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Local flat-earth frame around an origin { lat0, lng0 }: x metres east, y metres north. Accurate to centimetres at city scale.
const toXY = (o, lat, lng) => [rad(lng - o.lng0) * R * Math.cos(rad(o.lat0)), rad(lat - o.lat0) * R];
const toLatLng = (o, x, y) => [o.lat0 + deg(y / R), o.lng0 + deg(x / (R * Math.cos(rad(o.lat0))))];
// The point `east` and `north` metres away from [lat, lng].
const offset = (lat, lng, east, north) => toLatLng({ lat0: lat, lng0: lng }, east, north);

// Cumulative distance along a polyline: cum[i] = metres from the first vertex to vertex i.
function cumulativeDistances(line) {
  const cum = [0];
  for (let i = 1; i < line.length; i += 1) cum.push(cum[i - 1] + haversine(line[i - 1], line[i]));
  return cum;
}

// The point `d` metres along a polyline (clamped to its ends). `cum` is cumulativeDistances(line).
function pointAt(line, cum, d) {
  const dist = Math.max(0, Math.min(d, cum[cum.length - 1]));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < dist) i += 1;
  const t = Math.min(1, Math.max(0, (dist - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
  return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t];
}

// Project a point onto the nearest point of the polyline (step (a) of the ETA engine), in a flat frame per edge.
// Returns { distAlong (m from route start), offRoute (m from the line), point [lat,lng] }.
// `near` (optional metres along the route) limits the search to a window around the last known position, so
// a route that doubles back on itself does not make the bus jump between the two legs.
function projectOntoLine(line, cum, p, near, windowM = 1500) {
  let best = null;
  for (let i = 0; i < line.length - 1; i += 1) {
    if (near != null && (cum[i + 1] < near - windowM || cum[i] > near + windowM)) continue;
    const a = line[i];
    const b = line[i + 1];
    const origin = { lat0: a[0], lng0: a[1] };
    const [bx, by] = toXY(origin, b[0], b[1]);
    const [px, py] = toXY(origin, p[0], p[1]);
    const len2 = bx * bx + by * by;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / len2));
    const off = Math.hypot(px - t * bx, py - t * by);
    if (!best || off < best.offRoute) {
      best = {
        offRoute: off,
        distAlong: cum[i] + t * Math.sqrt(len2),
        point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
      };
    }
  }
  // Nothing inside the window (GPS jump): fall back to a full search.
  return best || (near != null ? projectOntoLine(line, cum, p) : null);
}

// GeoJSON <-> [lat, lng].
const toPoint = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const fromPoint = (point) => ({ lat: point.coordinates[1], lng: point.coordinates[0] });
const toLineString = (points) => ({ type: 'LineString', coordinates: points.map(([lat, lng]) => [lng, lat]) });
const fromLineString = (coordinates) => coordinates.map(([lng, lat]) => [lat, lng]);

module.exports = {
  R, rad, haversine, toXY, toLatLng, offset, cumulativeDistances, pointAt, projectOntoLine,
  toPoint, fromPoint, toLineString, fromLineString,
};
