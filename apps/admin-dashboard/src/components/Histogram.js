import React from 'react';
import { mmss } from '../utils';

const BINS = 8;

export default function Histogram({ values }) {
  if (values.length < 2) return <span className="cell-muted">Needs 2+ trips</span>;
  const min = values[0];
  const span = Math.max(1, values[values.length - 1] - min);
  const counts = Array(BINS).fill(0);
  values.forEach((v) => { counts[Math.min(BINS - 1, Math.floor(((v - min) / span) * BINS))] += 1; });
  const top = Math.max(...counts);
  return (
    <div className="histogram" role="img" aria-label={`Journey times from ${mmss(min)} to ${mmss(values[values.length - 1])} across ${values.length} trips`}>
      {counts.map((c, i) => <span key={i} style={{ height: `${Math.max(6, (c / top) * 100)}%` }} className={c ? '' : 'empty'} />)}
    </div>
  );
}
