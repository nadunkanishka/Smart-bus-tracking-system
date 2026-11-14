// Counts events per whole minute, for the dashboard's "positions per minute" chart. Pure, no I/O; old minutes are dropped.
function createRate(keepMinutes = 30) {
  const buckets = new Map(); // minute number -> count
  const minuteOf = (ts) => Math.floor(ts / 60000);

  return {
    hit(ts = Date.now()) {
      const m = minuteOf(ts);
      buckets.set(m, (buckets.get(m) || 0) + 1);
      const oldest = m - keepMinutes;
      buckets.forEach((_, k) => { if (k < oldest) buckets.delete(k); });
    },
    // The last `n` whole minutes up to and including the current one, oldest first: [{ t (ms, start of the minute), n }]
    series(now = Date.now(), n = 12) {
      const end = minuteOf(now);
      return Array.from({ length: n }, (_, i) => {
        const m = end - (n - 1 - i);
        return { t: m * 60000, n: buckets.get(m) || 0 };
      });
    },
  };
}

module.exports = { createRate };
