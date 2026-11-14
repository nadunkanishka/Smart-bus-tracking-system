// Summary statistics used by the analytics and the live metrics.

// Value at fraction p (0..1) of an ascending list; null for an empty list.
const percentile = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null);

// Rounded mean; null for an empty list.
const average = (list) => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null);

module.exports = { percentile, average };
