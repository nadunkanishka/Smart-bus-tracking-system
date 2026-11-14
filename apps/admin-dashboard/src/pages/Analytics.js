import React, { useEffect, useState } from 'react';
import { Vehicle } from '../design/Vehicle';
import Histogram from '../components/Histogram';
import PageHeader from '../components/PageHeader';
import Stat from '../components/Stat';
import TableShell, { EmptyRow } from '../components/TableShell';
import { api } from '../api';
import { mmss } from '../format';

// The ETA engine's fallbacks, for the explanatory text only. They mirror DEFAULTS in backend/lib/eta.js; the API does
// not report them, so keep the two in step by hand.
const ETA_DEFAULTS = { speedKmh: 20, dwellSec: 20 };

// Historical trip analytics: the journey-time distribution of each route segment. The averages shown here are
// the same values the ETA engine uses as its historical baseline.
export default function Analytics({ routes }) {
  const trackable = routes.filter((r) => r.stopPoints.length >= 2);
  // The chosen route, or the first trackable one (also when routes arrive after this page opened).
  const [picked, setPicked] = useState('');
  const routeId = trackable.some((r) => r.id === picked) ? picked : trackable[0]?.id || '';
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
  }, [routeId]);

  const total = data ? data.segments.reduce((n, s) => n + s.samples, 0) : 0;

  return (
    <section className="page-section" data-page="analytics">
      <PageHeader subtitle="Journey time per route segment, from recorded trips. These averages feed the ETA prediction engine.">
        <label className="field inline-field">
          <span className="form-label">Route</span>
          <select className="form-input" value={routeId} onChange={(e) => setPicked(e.target.value)}>
            {trackable.length === 0 && <option value="">No routes with stops</option>}
            {trackable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      </PageHeader>

      <div className="stat-grid">
        <Stat label="Segment samples" value={total} hint="completed segment crossings" />
        <Stat label="Mean absolute ETA error" value={eta?.maeSec == null ? '—' : `${eta.maeSec} s`} hint={`${eta?.samples || 0} predicted vs actual arrivals`} />
        <Stat label="ETA bias" value={eta?.biasSec == null ? '—' : `${eta.biasSec > 0 ? '+' : ''}${eta.biasSec} s`} hint="positive = bus arrived earlier than predicted" />
        <Stat label="Worst ETA error" value={eta?.maxAbsSec == null ? '—' : `${eta.maxAbsSec} s`} hint="largest single miss" />
      </div>

      <TableShell>
        <div className="panel-head">
          <div>
            <h2>ETA engine vs a plain estimate</h2>
            <p>The plain estimate is the straight-line distance to the stop at a fixed {ETA_DEFAULTS.speedKmh} km/h. Both are scored on the same arrivals.</p>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Predicted ahead</th><th>Arrivals</th><th>Engine error</th><th>Plain estimate error</th></tr>
          </thead>
          <tbody>
            {!eta?.compared?.samples ? (
              <EmptyRow colSpan="4">No arrivals recorded yet. Drive a bus on duty past a stop to see the comparison.</EmptyRow>
            ) : (
              <>
                {eta.byHorizon.map((h) => (
                  <tr key={h.horizon}>
                    <td className="table-strong">{h.horizon}</td>
                    <td>{h.samples}</td>
                    <td>{h.engineMaeSec} s</td>
                    <td>{h.baselineMaeSec} s</td>
                  </tr>
                ))}
                <tr>
                  <td className="table-strong">All</td>
                  <td>{eta.compared.samples}</td>
                  <td className="table-strong">{eta.compared.engineMaeSec} s</td>
                  <td className="table-strong">{eta.compared.baselineMaeSec} s{eta.compared.improvementPct != null ? ` (engine ${eta.compared.improvementPct >= 0 ? `${eta.compared.improvementPct}% better` : `${-eta.compared.improvementPct}% worse`})` : ''}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </TableShell>

      <TableShell>
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
              <EmptyRow colSpan="9">Could not load analytics. Check that the backend is running.</EmptyRow>
            ) : !data || data.segments.length === 0 ? (
              <EmptyRow colSpan="9" art={<Vehicle name="decker" width={124} label="No analytics yet" />}>
                {state === 'loading' ? 'Loading…' : 'Choose a route that has stops on the map to see its segments.'}
              </EmptyRow>
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
      </TableShell>
      {data && total === 0 && (
        <p className="cell-hint">No trips have been recorded on this route yet, so the ETA engine is using its default speed ({ETA_DEFAULTS.speedKmh} km/h) and dwell ({ETA_DEFAULTS.dwellSec} s). Samples appear after a bus drives a full segment while on duty.</p>
      )}
    </section>
  );
}
