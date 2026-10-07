// Geometry helpers for the segmented-route ETA engine. Points are [lat, lng] in degrees, distances in metres.

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

function haversine(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Cumulative distance along a polyline: cum[i] = metres from the first vertex to vertex i.
function cumulativeDistances(line) {
  const cum = [0];
  for (let i = 1; i < line.length; i += 1) cum.push(cum[i - 1] + haversine(line[i - 1], line[i]));
  return cum;
}

// Project a point onto the nearest point of the polyline (step (a) of the ETA engine).
// Uses a local flat-earth frame per polyline edge, which is accurate to centimetres at city scale.
// Returns { distAlong (m from route start), offRoute (m from the line), point [lat,lng], edge }.
// `near` (optional metres along the route) limits the search to a window around the last known position, so
// a route that doubles back on itself does not make the bus jump between the two legs.
function projectOntoLine(line, cum, p, near, windowM = 1500) {
  let best = null;
  for (let i = 0; i < line.length - 1; i += 1) {
    if (near != null && (cum[i + 1] < near - windowM || cum[i] > near + windowM)) continue;
    const a = line[i];
    const b = line[i + 1];
    const kx = Math.cos(rad(a[0])) * R * (Math.PI / 180); // metres per degree of longitude here
    const ky = R * (Math.PI / 180); // metres per degree of latitude
    const bx = (b[1] - a[1]) * kx;
    const by = (b[0] - a[0]) * ky;
    const px = (p[1] - a[1]) * kx;
    const py = (p[0] - a[0]) * ky;
    const len2 = bx * bx + by * by;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / len2));
    const off = Math.hypot(px - t * bx, py - t * by);
    if (!best || off < best.offRoute) {
      best = {
        offRoute: off,
        distAlong: cum[i] + t * Math.sqrt(len2),
        point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        edge: i,
      };
    }
  }
  // Nothing inside the window (GPS jump): fall back to a full search.
  return best || (near != null ? projectOntoLine(line, cum, p) : null);
}

module.exports = { haversine, cumulativeDistances, projectOntoLine };
