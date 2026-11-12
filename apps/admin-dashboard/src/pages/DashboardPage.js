import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';

const LIVE_MS = 5000; // how often the live panel asks the backend
const QUALITY_MS = 30000; // ETA accuracy changes slowly
const MAX_LIVE_ROWS = 3;
const MAX_FLEET_ROWS = 3;
const MAX_DRIVER_ROWS = 1;

export default function DashboardPage({ api, user, summary, drivers, buses, routes, fetchBackendData, showNotification, openModal, setActivePage }) {
  const [driverFilter, setDriverFilter] = useState('Active'); // 'Active' | 'On Leave'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  // What is happening on the road right now, and how well the system is doing: refreshed from the backend.
  const [live, setLive] = useState(null); // { buses, serverTs }
  const [metrics, setMetrics] = useState(null);
  const [eta, setEta] = useState(null);
  useEffect(() => {
    if (!api) return undefined;
    let stop = false;
    const load = async () => {
      try {
        const [a, b] = await Promise.all([api('/live'), api('/metrics')]);
        if (stop) return;
        if (a.ok) setLive(await a.json());
        if (b.ok) setMetrics(await b.json());
      } catch (err) { /* the panel keeps the last values */ }
    };
    const loadQuality = async () => {
      try {
        const r = await api('/analytics/eta');
        if (!stop && r.ok) setEta(await r.json());
      } catch (err) { /* ignore */ }
    };
    load();
    loadQuality();
    const t1 = setInterval(load, LIVE_MS);
    const t2 = setInterval(loadQuality, QUALITY_MS);
    return () => { stop = true; clearInterval(t1); clearInterval(t2); };
  }, [api]);
  const onRoad = (live?.buses || []).filter((b) => b.connected && b.onDuty);
  const routeLabel = (id) => { const r = routes.find((x) => x.id === id); return r ? (r.routeNumber ? `Route ${r.routeNumber}` : r.name) : 'No route'; };
  const seen = (ts) => { if (!ts) return 'never'; const sec = Math.max(0, Math.round(((live?.serverTs || Date.now()) - ts) / 1000)); return sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)} min ago`; };
  const cmp = eta?.compared;
  const processing = metrics?.latencyMs?.serverProcessing;

  // ETA error by how far ahead the prediction was made: the engine against the plain straight-line estimate, as bars.
  const HORIZON_LABEL = { 'under 2 min': '< 2 min', '2 to 5 min': '2-5 min', '5 to 10 min': '5-10 min', '10 to 20 min': '10-20 min', 'over 20 min': '20+ min' };
  const groups = (eta?.byHorizon || []).map((h) => ({ key: h.horizon, label: HORIZON_LABEL[h.horizon] || h.horizon, n: h.samples, engine: h.engineMaeSec, plain: h.baselineMaeSec }));
  const topError = Math.max(1, ...groups.flatMap((g) => [g.engine || 0, g.plain || 0]));

  const driverName = (id) => drivers.find((d) => d.id === id)?.name || 'No driver assigned';
  const statusClass = (s) => (s === 'Active' ? 'badge-green' : s === 'Maintenance' ? 'badge-red' : 'badge-amber');
  const shownDrivers = drivers.filter((d) => d.status === driverFilter).slice(0, MAX_DRIVER_ROWS);
  const frontRoute = routes[0];

  const cardActions = [
    { label: 'All routes', icon: 'route', onClick: () => setActivePage('routes') },
    { label: 'Add route', icon: 'plus', onClick: () => openModal('route') },
    { label: 'Live map', icon: 'pulse', onClick: () => setActivePage('live') },
    { label: 'Analytics', icon: 'chart', onClick: () => setActivePage('analytics') },
  ];

  return (
    <section className="page-section dash" data-page="dashboard">
      <div className="section-header">
        <div>
          <h1 className="greeting"><b>Hello,</b> {user.name || user.username}</h1>
          <p>{today} · Live data from MongoDB</p>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel chart-card">
          <div className="panel-head">
            <div>
              <h2>On the road now</h2>
              <p className="big-number">{onRoad.length}<small>{onRoad.length === 1 ? 'bus' : 'buses'} on duty · {buses.length} registered</small></p>
            </div>
            <div className="round-btns">
              <button type="button" className="round-btn" onClick={() => openModal('bus')} aria-label="Add bus" title="Add bus"><Icon type="plus" /></button>
              <button type="button" className="round-btn" onClick={() => { fetchBackendData(); showNotification('Refreshed data from MongoDB.'); }} aria-label="Refresh data" title="Refresh data"><Icon type="sync" /></button>
            </div>
          </div>

          <div className="live-tiles">
            <div className="live-tile">
              <span>ETA error</span>
              <b>{cmp?.engineMaeSec == null ? '—' : `${cmp.engineMaeSec} s`}</b>
              <small>{cmp?.engineMaeSec == null ? 'after the first trips' : `plain estimate ${cmp.baselineMaeSec} s`}</small>
            </div>
            <div className="live-tile">
              <span>Time to passengers</span>
              <b>{processing?.p95 == null ? '—' : `${processing.p95} ms`}</b>
              <small>server, 95th percentile</small>
            </div>
            <div className="live-tile">
              <span>GPS positions</span>
              <b>{metrics?.fixes ? metrics.fixes.accepted : '—'}</b>
              <small>{metrics?.fixes ? `${metrics.fixes.rejected} rejected` : 'since restart'}</small>
            </div>
          </div>

          <div className="live-list">
            {onRoad.length === 0 ? (
              <div className="live-empty">No bus is on duty. A bus appears here when its driver goes on duty in the driver app.</div>
            ) : onRoad.slice(0, MAX_LIVE_ROWS).map((b) => (
              <button type="button" key={b.busId} className="live-row" onClick={() => setActivePage('live')}>
                <span className="live-dot" aria-hidden="true" />
                <span className="live-reg">{b.registration}</span>
                <span className="live-route">{routeLabel(b.routeId)}</span>
                <span className="live-speed">{b.speed == null ? '—' : `${Math.round(b.speed * 3.6)} km/h`}</span>
                <span className="live-seen">{seen(b.lastSeen)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel card-panel">
          <div className="panel-head">
            <h2>Front route</h2>
            <button type="button" className="pill-outline" onClick={() => setActivePage('routes')}>
              Open routes <Icon type="route" />
            </button>
          </div>
          {frontRoute ? (
            <button type="button" className="route-card-big" onClick={() => setActivePage('routes')}>
              <span className="rcb-top"><span>{frontRoute.id}</span><span>{frontRoute.stopPoints.length} STOPS</span></span>
              <span className="rcb-number">{frontRoute.routeNumber ? `Route ${frontRoute.routeNumber}` : frontRoute.name}</span>
              <span className="rcb-name">{frontRoute.start} → {frontRoute.end} · {frontRoute.distance}</span>
              <span className="rcb-foot">
                <span className="rcb-bus">{frontRoute.assignedBus || 'No bus assigned'}</span>
                <span className="rcb-brand">SmartBus</span>
              </span>
            </button>
          ) : (
            <button type="button" className="route-card-big" onClick={() => openModal('route')}>
              <span className="rcb-number">No routes yet</span>
              <span className="rcb-name">Create the first route to see it here.</span>
              <span className="rcb-foot"><span className="rcb-bus">Add route</span><span className="rcb-brand">SmartBus</span></span>
            </button>
          )}
          <div className="card-actions">
            {cardActions.map((a) => (
              <button key={a.label} type="button" className="card-action" onClick={a.onClick}>
                <span className="ca-icon"><Icon type={a.icon} /></span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-bottom">
        <div className="panel">
          <div className="panel-head">
            <h2>Fleet manager <sup>{buses.length}</sup></h2>
            <button type="button" className="link-btn" onClick={() => setActivePage('buses')}>See all</button>
          </div>
          {buses.length === 0 ? (
            <p className="empty-line">No buses registered yet.</p>
          ) : (
            <ul className="rows">
              {buses.slice(0, MAX_FLEET_ROWS).map((b) => (
                <li key={b.id} className="row">
                  <span className="row-icon"><Icon type="bus" /></span>
                  <span className="row-main">
                    <strong>{b.registration}</strong>
                    <small>{b.id} · {driverName(b.assignedDriver)}</small>
                  </span>
                  <span className={`badge ${statusClass(b.status)}`}>{b.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel acc-panel">
          <div className="panel-head">
            <h2>ETA error by horizon</h2>
            <span className="chip chip-plain">seconds, lower is better</span>
          </div>
          {groups.length === 0 ? (
            <div className="acc-empty">Fills in after buses complete stops. It compares the engine with a plain straight-line estimate.</div>
          ) : (
            <>
              <div className="acc-chart" role="img" aria-label={groups.map((g) => `${g.label}: engine ${g.engine} s, plain estimate ${g.plain} s`).join('; ')}>
                {groups.map((g) => (
                  <div key={g.key} className="acc-group" title={`${g.n} arrivals`}>
                    <div className="acc-bars">
                      <span className="acc-col"><em>{g.engine}</em><i className="acc-bar engine" style={{ height: `${Math.max(4, ((g.engine || 0) / topError) * 100)}%` }} /></span>
                      <span className="acc-col"><em>{g.plain}</em><i className="acc-bar plain" style={{ height: `${Math.max(4, ((g.plain || 0) / topError) * 100)}%` }} /></span>
                    </div>
                    <span className="acc-label">{g.label}</span>
                  </div>
                ))}
              </div>
              <ul className="legend acc-legend">
                <li><span className="legend-dot" style={{ background: 'var(--orange)' }} />Engine</li>
                <li><span className="legend-dot" style={{ background: 'var(--violet)' }} />Plain estimate</li>
              </ul>
            </>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Drivers</h2>
            <button type="button" className="link-btn" onClick={() => setActivePage('drivers')}>See all</button>
          </div>
          <div className="stat-line"><strong>{summary.activeDrivers}</strong><span>of {drivers.length} on the roster</span></div>
          <p className="stat-note">Drivers marked Active can sign a bus in and go on duty.</p>
          <div className="pills" role="group" aria-label="Driver status">
            {['Active', 'On Leave'].map((s) => (
              <button key={s} type="button" className={`pill-toggle ${driverFilter === s ? 'on' : ''}`} aria-pressed={driverFilter === s} onClick={() => setDriverFilter(s)}>
                {s}
              </button>
            ))}
          </div>
          {shownDrivers.length === 0 ? (
            <p className="empty-line">No drivers with this status.</p>
          ) : shownDrivers.map((d) => (
            <div key={d.id} className="mini-card">
              <div className="mc-top">
                <span className="row-icon"><Icon type="drivers" /></span>
                <div><strong>{d.name}</strong><br /><small>{d.id} · {d.license}</small></div>
              </div>
              <div className="mc-meta"><span>{d.phone}</span><span>Licence to {d.expiry}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
