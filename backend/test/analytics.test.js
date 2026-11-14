// Analytics helpers: percentiles, horizon buckets and the response shapes, without MongoDB.
const test = require('node:test');
const assert = require('node:assert/strict');
const { percentile, average } = require('../lib/stats');
const { HORIZONS, horizonBucketStage, byHorizon, segmentDistribution, etaSummary } = require('../lib/analytics');

test('percentile picks the value at that fraction of a sorted list, and an empty list has none', () => {
  const s = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  assert.equal(percentile(s, 0.5), 60);
  assert.equal(percentile(s, 0.9), 100);
  assert.equal(percentile(s, 0.95), 100);
  assert.equal(percentile(s, 0), 10);
  assert.equal(percentile([7], 0.95), 7);
  assert.equal(percentile([], 0.5), null);
});

test('average is rounded and an empty list has none', () => {
  assert.equal(average([1, 2]), 2);
  assert.equal(average([10, 20, 31]), 20);
  assert.equal(average([]), null);
});

test('horizon buckets: ascending boundaries, and the open last bucket is the default', () => {
  const { boundaries, default: fallback } = horizonBucketStage({}).$bucket;
  assert.deepEqual(boundaries, [0, 120, 300, 600, 1200]);
  assert.equal(fallback, 1200);
  assert.equal(HORIZONS.length, boundaries.length);
});

test('horizon rows come out in horizon order with their labels, empty horizons left out', () => {
  const rows = [
    { _id: 1200, samples: 2, engine: 300.4, baseline: 500.6 },
    { _id: 0, samples: 5, engine: 20.2, baseline: 40.5 },
    { _id: 600, samples: 1, engine: 100, baseline: null },
  ];
  assert.deepEqual(byHorizon(rows), [
    { horizon: 'under 2 min', samples: 5, engineMaeSec: 20, baselineMaeSec: 41 },
    { horizon: '10 to 20 min', samples: 1, engineMaeSec: 100, baselineMaeSec: null },
    { horizon: 'over 20 min', samples: 2, engineMaeSec: 300, baselineMaeSec: 501 },
  ]);
});

test('segment distribution: one row per segment between consecutive stops, with spread and raw values', () => {
  const logs = [
    { segIndex: 0, traversalSec: 100, dwellSec: 10 },
    { segIndex: 0, traversalSec: 140, dwellSec: 20 },
    { segIndex: 0, traversalSec: 120, dwellSec: 30 },
    { segIndex: 2, traversalSec: 50, dwellSec: 0 }, // a segment the route no longer has
  ];
  const [first, second] = segmentDistribution(['A', 'B', 'C'], logs);
  assert.deepEqual(first, {
    segIndex: 0, from: 'A', to: 'B', samples: 3,
    traversalSec: { avg: 120, min: 100, p50: 120, p90: 140, max: 140 },
    dwellSecAvg: 20,
    values: [100, 120, 140],
  });
  assert.deepEqual(second, { segIndex: 1, from: 'B', to: 'C', samples: 0, traversalSec: null, dwellSecAvg: null, values: [] });
});

test('ETA summary with no data has the same shape, with nulls', () => {
  assert.deepEqual(etaSummary(undefined, undefined, []), {
    samples: 0, maeSec: null, biasSec: null, maxAbsSec: null,
    compared: { samples: 0, engineMaeSec: null, baselineMaeSec: null, improvementPct: null },
    byHorizon: [],
  });
});

test('ETA summary compares the engine with the baseline on the same arrivals', () => {
  const res = etaSummary({ samples: 4, maeSec: 61.4, biasSec: -9.6, maxAbsSec: 200 }, { samples: 3, engine: 60, baseline: 120 }, []);
  assert.equal(res.maeSec, 61);
  assert.equal(res.biasSec, -10);
  assert.deepEqual(res.compared, { samples: 3, engineMaeSec: 60, baselineMaeSec: 120, improvementPct: 50 });
  assert.equal(etaSummary(null, { samples: 1, engine: 5, baseline: 0 }, []).compared.improvementPct, null, 'no baseline error, no ratio');
});
