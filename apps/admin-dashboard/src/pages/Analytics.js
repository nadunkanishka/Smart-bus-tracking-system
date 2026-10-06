import React, { useEffect, useState } from 'react';
import { Vehicle } from '../design/Vehicle';

// Historical trip analytics: the journey-time distribution of each route segment. The averages shown here are
// the same values the ETA engine uses as its historical baseline.
const BINS = 8;
const mmss = (sec) => (sec == null ? '—' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`);

function Histogram({ values }) {
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

export default function Analytics({ api, routes }) {
  const trackable = routes.filter((r) => r.stopPoints.length >= 2);
  const [routeId, setRouteId] = useState(trackable[0]?.id || '');
  const [data, setData] = useState(null);
  const [eta, setEta] = useState(null);
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'error'

  useEffect(() => {
    if (!routeId) return undefined;
    let stop = false;
    setState('loading');
    Promise.all([api(`/analytics/segments?routeId=${encodeURIComponent(routeId)}`), api(`/analytics/eta?routeId=${encodeURIComponent(routeId)}`)])
      .then(async ([a, b]) => {
        if (stop) return;
        if (!a.ok || !b.ok) { setState('error'); return; }
        setData(await a.json());
        setEta(await b.json());
        setState('idle');
      })
      .catch(() => !stop && setState('error'));
    return () => { stop = true; };
  }, [api, routeId]);

  const total = data ? data.segments.reduce((n, s) => n + s.samples, 0) : 0;

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <h1>Trip Analytics</h1>
          <p>Journey time per route segment, from recorded trips. These averages feed the ETA prediction engine.</p>
        </div>
        <label className="field inline-field">
          <span className="form-label">Route</span>
          <select className="form-input" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            {trackable.length === 0 && <option value="">No routes with stops</option>}
            {trackable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><p>Segment samples</p><strong>{total}</strong><span>completed segment crossings</span></div>
        <div className="stat-card"><p>Mean absolute ETA error</p><strong>{eta?.maeSec == null ? '—' : `${eta.maeSec} s`}</strong><span>{eta?.samples || 0} predicted vs actual arrivals</span></div>
        <div className="stat-card"><p>ETA bias</p><strong>{eta?.biasSec == null ? '—' : `${eta.biasSec > 0 ? '+' : ''}${eta.biasSec} s`}</strong><span>positive = bus arrived earlier than predicted</span></div>
        <div className="stat-card"><p>Worst ETA error</p><strong>{eta?.maxAbsSec == null ? '—' : `${eta.maxAbsSec} s`}</strong><span>largest single miss</span></div>
      </div>

      <div className="panel table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Segment</th>
              <th>Trips</th>
              <th>Average</th>
              <th>Median</th>
              <th>90th pct.</th>
              <th>Fastest / slowest</th>
              <th>Avg dwell</th>
              <th>Distribution</th>
            </tr>
          </thead>
          <tbody>
            {state === 'error' ? (
              <tr><td colSpan="9" className="cell-empty"><div className="empty-state">Could not load analytics. Check that the backend is running.</div></td></tr>
            ) : !data || data.segments.length === 0 ? (
              <tr>
                <td colSpan="9" className="cell-empty">
                  <div className="empty-state">
                    <Vehicle name="coach" width={120} label="No analytics yet" />
                    {state === 'loading' ? 'Loading…' : 'Choose a route that has stops on the map to see its segments.'}
                  </div>
                </td>
              </tr>
            ) : data.segments.map((s) => (
              <tr key={s.segIndex}>
                <td className="mono-cell">{s.segIndex + 1}</td>
                <td className="table-strong">{s.from} → {s.to}</td>
                <td>{s.samples}</td>
                <td>{s.traversalSec ? mmss(s.traversalSec.avg) : <span className="cell-muted">Default speed</span>}</td>
                <td>{mmss(s.traversalSec?.p50)}</td>
                <td>{mmss(s.traversalSec?.p90)}</td>
                <td>{s.traversalSec ? `${mmss(s.traversalSec.min)} / ${mmss(s.traversalSec.max)}` : '—'}</td>
                <td>{s.dwellSecAvg == null ? '—' : `${s.dwellSecAvg} s`}</td>
                <td><Histogram values={s.values} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && total === 0 && (
        <p className="cell-hint">No trips have been recorded on this route yet, so the ETA engine is using its default speed (20 km/h) and dwell (20 s). Samples appear after a bus drives a full segment while on duty.</p>
      )}
    </section>
  );
}
