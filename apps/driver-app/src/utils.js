export function formatCoord(val) { return Number(val).toFixed(4); }

// GPS speeds are m/s; the driver sees whole km/h.
const KMH_PER_MPS = 3.6;
export function toKmh(mps) { return Math.round(mps * KMH_PER_MPS); }
