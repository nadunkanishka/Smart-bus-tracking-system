// Historical analytics: per-segment journey times (the ETA engine's baseline) and ETA accuracy against the plain
// baseline. The MongoDB pipelines live here, next to the statistics that read their results; route handlers stay thin.
const EtaLog = require('../models/EtaLog');
const SegmentLog = require('../models/SegmentLog');
const { percentile, average } = require('./stats');

const round = (n) => (n == null ? null : Math.round(n));

// How far ahead a prediction was made, in seconds. Each bucket runs from its `from` to the next one's; the last is open.
const HORIZONS = [
  { from: 0, label: 'under 2 min' },
  { from: 120, label: '2 to 5 min' },
  { from: 300, label: '5 to 10 min' },
  { from: 600, label: '10 to 20 min' },
  { from: 1200, label: 'over 20 min' },
];
const LAST = HORIZONS[HORIZONS.length - 1].from;
// $bucket puts [from, next from) in the bucket named `from`; the open last bucket (and anything negative) is the default.
const horizonBucketStage = (output) => ({ $bucket: { groupBy: '$horizonSec', boundaries: HORIZONS.map((h) => h.from), default: LAST, output } });

// Rows from horizonBucketStage, in horizon order, labelled; empty horizons are left out.
const byHorizon = (rows) => HORIZONS
  .map((h) => ({ h, row: rows.find((r) => r._id === h.from) }))
  .filter(({ row }) => row)
  .map(({ h, row }) => ({ horizon: h.label, samples: row.samples, engineMaeSec: round(row.engine), baselineMaeSec: round(row.baseline) }));

// Average traversal and dwell per segment of a route: what the ETA engine uses as history.
async function segmentHistory(routeId) {
  const rows = await SegmentLog.aggregate([
    { $match: { routeId } },
    { $group: { _id: '$segIndex', traversalSec: { $avg: '$traversalSec' }, dwellSec: { $avg: '$dwellSec' }, samples: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r]));
}

// Journey-time distribution per segment: names are the route's stop names, logs are { segIndex, traversalSec, dwellSec }.
function segmentDistribution(names, logs) {
  return names.slice(0, -1).map((from, i) => {
    const rows = logs.filter((l) => l.segIndex === i);
    const t = rows.map((l) => l.traversalSec).sort((a, b) => a - b);
    return {
      segIndex: i, from, to: names[i + 1], samples: rows.length,
      traversalSec: t.length ? { avg: average(t), min: t[0], p50: percentile(t, 0.5), p90: percentile(t, 0.9), max: t[t.length - 1] } : null,
      dwellSecAvg: average(rows.map((l) => l.dwellSec)),
      values: t, // raw samples for the distribution chart
    };
  });
}

async function segmentAnalytics(route) {
  const logs = await SegmentLog.find({ routeId: route.routeId }).select('segIndex traversalSec dwellSec -_id').lean();
  return { routeId: route.routeId, name: route.name, segments: segmentDistribution((route.stopPoints || []).map((s) => s.name), logs) };
}

// The summary rows of etaAccuracy, turned into the response shape. Pure, so it is tested without MongoDB.
function etaSummary(all, compared, horizons) {
  return {
    ...(all
      ? { samples: all.samples, maeSec: Math.round(all.maeSec), biasSec: Math.round(all.biasSec), maxAbsSec: all.maxAbsSec }
      : { samples: 0, maeSec: null, biasSec: null, maxAbsSec: null }),
    compared: compared
      ? {
          samples: compared.samples,
          engineMaeSec: round(compared.engine),
          baselineMaeSec: round(compared.baseline),
          improvementPct: compared.baseline > 0 ? Math.round(((compared.baseline - compared.engine) / compared.baseline) * 100) : null,
        }
      : { samples: 0, engineMaeSec: null, baselineMaeSec: null, improvementPct: null },
    byHorizon: byHorizon(horizons),
  };
}

// ETA accuracy: mean absolute error of predicted vs actual stop arrivals, and the same arrivals predicted by the plain
// baseline (straight-line distance at a fixed average speed). `compared` uses only predictions that have both, so the
// two errors are measured on exactly the same arrivals; `byHorizon` splits them by how far ahead the prediction was made.
// routeId: one route, or every route when empty.
async function etaAccuracy(routeId) {
  const match = routeId ? { routeId } : {};
  const withBaseline = { ...match, baselineErrorSec: { $type: 'number' } };
  const engineVsBaseline = { samples: { $sum: 1 }, engine: { $avg: { $abs: '$errorSec' } }, baseline: { $avg: { $abs: '$baselineErrorSec' } } };
  const [[all], [compared], horizons] = await Promise.all([
    EtaLog.aggregate([
      { $match: match },
      { $group: { _id: null, samples: { $sum: 1 }, maeSec: { $avg: { $abs: '$errorSec' } }, biasSec: { $avg: '$errorSec' }, maxAbsSec: { $max: { $abs: '$errorSec' } } } },
    ]),
    EtaLog.aggregate([{ $match: withBaseline }, { $group: { _id: null, ...engineVsBaseline } }]),
    EtaLog.aggregate([{ $match: withBaseline }, horizonBucketStage(engineVsBaseline)]),
  ]);
  return etaSummary(all, compared, horizons);
}

module.exports = {
  HORIZONS, horizonBucketStage, byHorizon,
  segmentHistory, segmentDistribution, segmentAnalytics, etaSummary, etaAccuracy,
};
