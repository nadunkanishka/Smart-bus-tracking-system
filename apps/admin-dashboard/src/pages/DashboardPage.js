import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';

const LIVE_MS = 5000; // how often the dashboard asks the backend for the live numbers
const QUALITY_MS = 30000; // ETA accuracy changes slowly
const MAX_FLEET_ROWS = 3;
const MAX_DRIVER_ROWS = 1;
const HORIZON_LABEL = { 'under 2 min': '< 2 min', '2 to 5 min': '2-5 min', '5 to 10 min': '5-10 min', '10 to 20 min': '10-20 min', 'over 20 min': '20+ min' };
const clock = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// The operator's first look: is the system receiving positions, are buses on the road, and how good are the predictions.
export default function DashboardPage({ api, user, summary, drivers, buses, routes, fetchBackendData, showNotification, openModal, setActivePage }) {
  const [driverFilter, setDriverFilter] = useState('Active'); // 'Active' | 'On Leave'
  const [view, setView] = useState('activity'); // the big chart: 'activity' | 'accuracy'
  const [live, setLive] = useState(null); // { buses, serverTs }
  const [metrics, setMetrics] = useState(null);
  const [eta, setEta] = useState(null);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (!api) return undefined;
    let stop = false;
    const load = async () => {
      try {
        const [a, b] = await Promise.all([api('/live'), api('/metrics')]);
        if (stop) return;
        if (a.ok) setLive(await a.json());
        if (b.ok) setMetrics(await b.json());
      } catch (err) { /* keep the last values */ }
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
  const onDutyIds = new Set(onRoad.map((b) => b.busId));
  const routeLabel = (id) => { const r = routes.find((x) => x.id === id); return r ? (r.routeNumber ? `Route ${r.routeNumber}` : r.name) : 'No route'; };
  const seen = (ts) => { if (!ts) return 'never'; const sec = Math.max(0, Math.round(((live?.serverTs || Date.now()) - ts) / 1000)); return sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)} min ago`; };
  const cmp = eta?.compared;
  const processing = metrics?.latencyMs?.serverProcessing;

  // Chart 1: GPS positions received per minute, the last 12 minutes.
  const minutes = metrics?.fixesPerMinute || [];
  const topMinute = Math.max(1, ...minutes.map((m) => m.n));
  const topIndex = minutes.findIndex((m) => m.n === topMinute && m.n > 0);
  const received = minutes.reduce((n, m) => n + m.n, 0);

  // Chart 2: ETA error by how far ahead the prediction was made, the engine against the plain straight-line estimate.
  const groups = (eta?.byHorizon || []).map((h) => ({ key: h.horizon, label: HORIZON_LABEL[h.horizon] || h.horizon, n: h.samples, engine: h.engineMaeSec, plain: h.baselineMaeSec }));
  const topError = Math.max(1, ...groups.flatMap((g) => [g.engine || 0, g.plain || 0]));

  const busRoute = (b) => { const r = routes.find((x) => (x.assignedBus || '').includes(b.registration)); return r ? routeLabel(r.id) : 'no route'; };
  const driverName = (id) => drivers.find((d) => d.id === id)?.name || 'No driver assigned';
  const shownDrivers = drivers.filter((d) => d.status === driverFilter).slice(0, MAX_DRIVER_ROWS);
  const frontBus = onRoad[0];

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
              <h2>{view === 'activity' ? 'GPS positions per minute' : 'ETA error by horizon'}</h2>
              {view === 'activity' ? (
                <p className="big-number">{received}<small>in the last 12 min · {onRoad.length} {onRoad.length === 1 ? 'bus' : 'buses'} on duty</small></p>
              ) : (
                <p className="big-number">{cmp?.engineMaeSec == null ? '—' : `${cmp.engineMaeSec} s`}<small>{cmp?.engineMaeSec == null ? 'fills in after buses complete stops' : `plain estimate ${cmp.baselineMaeSec} s · ${cmp.samples} arrivals`}</small></p>
              )}
            </div>
            <div className="round-btns">
              <button type="button" className="round-btn" onClick={() => openModal('bus')} aria-label="Add bus" title="Add bus"><Icon type="plus" /></button>
              <button type="button" className="round-btn" onClick={() => { fetchBackendData(); showNotification('Refreshed data from MongoDB.'); }} aria-label="Refresh data" title="Refresh data"><Icon type="sync" /></button>
            </div>
          </div>

          <div className="pills chart-tabs" role="group" aria-label="Chart">
            <button type="button" className={`pill-toggle ${view === 'activity' ? 'on' : ''}`} aria-pressed={view === 'activity'} onClick={() => setView('activity')}>Live activity</button>
            <button type="button" className={`pill-toggle ${view === 'accuracy' ? 'on' : ''}`} aria-pressed={view === 'accuracy'} onClick={() => setView('accuracy')}>ETA accuracy</button>
          </div>

          {view === 'activity' ? (
            minutes.length === 0 ? (
              <div className="bar-chart empty-state">Waiting for the backend.</div>
            ) : (
              <div className="bar-chart" role="img" aria-label={minutes.map((m) => `${clock(m.t)}: ${m.n} positions`).join(', ')}>
                {minutes.map((m, i) => (
                  <div key={m.t} className={`bar-col ${i === topIndex ? 'top' : ''}`}>
                    {i === topIndex && (
                      <span className="bar-tip">
                        <small>{clock(m.t)}</small>
                        <b><i />{m.n} positions</b>
                      </span>
                    )}
                    <span className="bar" style={{ height: `${Math.max(6, (m.n / topMinute) * 100)}%` }} />
                    <span className="bar-label">{clock(m.t)}</span>
                  </div>
                ))}
              </div>
            )
          ) : groups.length === 0 ? (
            <div className="bar-chart empty-state">No arrivals recorded yet. Drive a bus on duty past a stop and it fills in.</div>
          ) : (
            <>
              <div className="acc-chart" role="img" aria-label={groups.map((g) => `${g.label}: engine ${g.engine} s, plain estimate ${g.plain} s`).join('; ')}>
                {groups.map((g) => (
                  <div key={g.key} className="acc-group" title={`${g.n} arrivals`}>
                    <div className="acc-bars">
                      <span className="acc-col"><em>{g.engine} s</em><i className="acc-bar engine" style={{ height: `${Math.max(4, ((g.engine || 0) / topError) * 100)}%` }} /></span>
                      <span className="acc-col"><em>{g.plain} s</em><i className="acc-bar plain" style={{ height: `${Math.max(4, ((g.plain || 0) / topError) * 100)}%` }} /></span>
                    </div>
                    <span className="acc-label">{g.label}</span>
                  </div>
                ))}
              </div>
              <ul className="legend acc-legend">
                <li><span className="legend-dot" style={{ background: 'var(--orange)' }} />Engine</li>
                <li><span className="legend-dot" style={{ background: 'var(--violet)' }} />Plain estimate</li>
                <li>lower is better</li>
              </ul>
            </>
          )}
        </div>

        <div className="panel card-panel">
          <div className="panel-head">
            <h2>Live bus</h2>
            <button type="button" className="pill-outline" onClick={() => setActivePage('live')}>
              Open live map <Icon type="pulse" />
            </button>
          </div>
          {frontBus ? (
            <button type="button" className="route-card-big" onClick={() => setActivePage('live')}>
              <span className="rcb-top"><span>{frontBus.driverName || 'On duty'}</span><span>{frontBus.speed == null ? '—' : `${Math.round(frontBus.speed * 3.6)} km/h`}</span></span>
              <span className="rcb-number">{frontBus.registration}</span>
              <span className="rcb-name">{routeLabel(frontBus.routeId)}{onRoad.length > 1 ? ` · +${onRoad.length - 1} more on the road` : ''}</span>
              <span className="rcb-foot">
                <span className="rcb-bus">Last position {seen(frontBus.lastSeen)}</span>
                <span className="rcb-brand">SmartBus</span>
              </span>
            </button>
          ) : (
            <button type="button" className="route-card-big idle" onClick={() => setActivePage('live')}>
              <span className="rcb-top"><span>{buses.length} registered</span><span>OFF DUTY</span></span>
              <span className="rcb-number">No bus on duty</span>
              <span className="rcb-name">A bus shows here when its driver goes on duty.</span>
              <span className="rcb-foot"><span className="rcb-bus">Open live map</span><span className="rcb-brand">SmartBus</span></span>
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
              {buses.slice(0, MAX_FLEET_ROWS).map((b) => {
                const running = onDutyIds.has(b.id);
                return (
                  <li key={b.id} className="row">
                    <span className="row-icon"><Icon type="bus" /></span>
                    <span className="row-main">
                      <strong>{b.registration}</strong>
                      <small>{driverName(b.assignedDriver)} · {busRoute(b)}</small>
                    </span>
                    <span className={`badge ${running ? 'badge-green' : 'badge-amber'}`}>{running ? 'On duty' : 'Off duty'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>System health</h2>
            <button type="button" className="link-btn" onClick={() => setActivePage('live')}>Live monitor</button>
          </div>
          <ul className="kv">
            <li><span>ETA error</span><strong>{cmp?.engineMaeSec == null ? 'No arrivals yet' : `${cmp.engineMaeSec} s (plain ${cmp.baselineMaeSec} s)`}</strong></li>
            <li><span>Time to passengers</span><strong>{processing?.p95 == null ? '—' : `${processing.p95} ms (p95)`}</strong></li>
            <li><span>GPS positions</span><strong>{metrics?.fixes ? `${metrics.fixes.accepted} ok, ${metrics.fixes.rejected} rejected` : '—'}</strong></li>
            <li><span>Live cache</span><strong>{metrics ? (metrics.store === 'redis' ? 'Redis' : 'In memory') : '—'}</strong></li>
          </ul>
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
