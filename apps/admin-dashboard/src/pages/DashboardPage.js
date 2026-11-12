import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';

const LIVE_MS = 5000; // how often the live numbers refresh
const SLOW_MS = 30000; // ETA accuracy and the passenger count change slowly
const MAX_ATTENTION = 4;
const MAX_FLEET_ROWS = 3;
const MAX_DRIVER_ROWS = 1;
const STALE_MS = 60 * 1000; // a bus on duty that has not reported for this long needs a look
const SOON_DAYS = 30; // a licence ending within this many days is flagged

const ago = (ms) => (ms < 60000 ? `${Math.max(0, Math.round(ms / 1000))}s` : `${Math.floor(ms / 60000)} min`);

// The operator's first look: simple counts that are easy to keep an eye on, the bus on the road, and anything that needs attention.
export default function DashboardPage({ api, user, summary, drivers, buses, routes, fetchBackendData, showNotification, openModal, setActivePage }) {
  const [driverFilter, setDriverFilter] = useState('Active'); // 'Active' | 'On Leave'
  const [live, setLive] = useState(null); // { buses, serverTs }
  const [metrics, setMetrics] = useState(null);
  const [eta, setEta] = useState(null);
  const [passengers, setPassengers] = useState(null);
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
    const loadSlow = async () => {
      try {
        const [a, b] = await Promise.all([api('/analytics/eta'), api('/passengers')]);
        if (stop) return;
        if (a.ok) setEta(await a.json());
        if (b.ok) { const list = await b.json(); setPassengers(Array.isArray(list) ? list.length : null); }
      } catch (err) { /* ignore */ }
    };
    load();
    loadSlow();
    const t1 = setInterval(load, LIVE_MS);
    const t2 = setInterval(loadSlow, SLOW_MS);
    return () => { stop = true; clearInterval(t1); clearInterval(t2); };
  }, [api]);

  const serverNow = live?.serverTs || Date.now();
  const onRoad = (live?.buses || []).filter((b) => b.connected && b.onDuty);
  const onDutyIds = new Set(onRoad.map((b) => b.busId));
  const routeLabel = (id) => { const r = routes.find((x) => x.id === id); return r ? (r.routeNumber ? `Route ${r.routeNumber}` : r.name) : 'No route'; };
  const busRoute = (b) => routes.find((x) => (x.assignedBus || '').includes(b.registration));
  const seen = (ts) => (ts ? `${ago(serverNow - ts)} ago` : 'never');
  const driverName = (id) => drivers.find((d) => d.id === id)?.name || 'No driver assigned';
  const shownDrivers = drivers.filter((d) => d.status === driverFilter).slice(0, MAX_DRIVER_ROWS);
  const frontBus = onRoad[0];

  const readyRoutes = routes.filter((r) => r.path.length > 1 && r.stopPoints.length > 1).length;
  const lastSeen = Math.max(0, ...(live?.buses || []).map((b) => b.lastSeen || 0));
  const cmp = eta?.compared;
  const miss = cmp?.engineMaeSec ?? eta?.maeSec ?? null;

  // Simple numbers: each says one thing.
  const cards = [
    { key: 'duty', icon: 'bus', label: 'Buses on duty', value: onRoad.length, tone: onRoad.length ? 'good' : '', sub: `of ${buses.length} registered`, go: 'live' },
    { key: 'drivers', icon: 'drivers', label: 'Drivers active', value: summary.activeDrivers, sub: `of ${drivers.length} on the roster`, go: 'drivers' },
    { key: 'routes', icon: 'route', label: 'Routes ready', value: readyRoutes, sub: `of ${routes.length} (road and stops set)`, go: 'routes' },
    { key: 'riders', icon: 'user', label: 'Passengers signed up', value: passengers == null ? '—' : passengers, sub: 'registered accounts', go: 'passengers' },
    { key: 'eta', icon: 'gauge', label: 'Average ETA miss', value: miss == null ? '—' : `${miss} s`, sub: miss == null ? 'after the first trips' : (cmp?.baselineMaeSec != null ? `plain estimate ${cmp.baselineMaeSec} s` : 'predicted against actual'), go: 'analytics' },
    { key: 'gps', icon: 'pulse', label: 'Last GPS update', value: lastSeen ? ago(serverNow - lastSeen) : '—', sub: metrics?.fixes ? `${metrics.fixes.accepted} positions received` : 'waiting for a driver', go: 'live' },
  ];

  // Things to look at, most urgent first.
  const attention = [];
  onRoad.forEach((b) => { if (b.lastSeen && serverNow - b.lastSeen > STALE_MS) attention.push({ key: `stale-${b.busId}`, tone: 'bad', text: `${b.registration} has not sent a position for ${ago(serverNow - b.lastSeen)}`, go: 'live' }); });
  buses.forEach((b) => { if (!busRoute(b)) attention.push({ key: `noroute-${b.id}`, tone: 'warn', text: `${b.registration} is not assigned to a route`, go: 'routes' }); });
  drivers.forEach((d) => {
    const days = Math.round((new Date(d.expiry).getTime() - Date.now()) / 86400000);
    if (Number.isFinite(days) && days < 0) attention.push({ key: `lic-${d.id}`, tone: 'bad', text: `${d.name}'s licence has expired`, go: 'drivers' });
    else if (Number.isFinite(days) && days <= SOON_DAYS) attention.push({ key: `lic-${d.id}`, tone: 'warn', text: `${d.name}'s licence ends in ${days} days`, go: 'drivers' });
  });
  if (metrics && metrics.fixes.rejected > 0) attention.push({ key: 'rejected', tone: 'warn', text: `${metrics.fixes.rejected} GPS positions were rejected since the last restart`, go: 'live' });

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
        <div className="round-btns">
          <button type="button" className="round-btn" onClick={() => openModal('bus')} aria-label="Add bus" title="Add bus"><Icon type="plus" /></button>
          <button type="button" className="round-btn" onClick={() => { fetchBackendData(); showNotification('Refreshed data from MongoDB.'); }} aria-label="Refresh data" title="Refresh data"><Icon type="sync" /></button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="kpi-grid">
          {cards.map((c) => (
            <button key={c.key} type="button" className={`panel kpi ${c.tone}`} onClick={() => setActivePage(c.go)}>
              <span className="kpi-top"><span className="kpi-label">{c.label}</span><span className="kpi-icon"><Icon type={c.icon} /></span></span>
              <span className="kpi-value">{c.value}</span>
              <span className="kpi-sub">{c.sub}</span>
            </button>
          ))}
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
                const r = busRoute(b);
                return (
                  <li key={b.id} className="row">
                    <span className="row-icon"><Icon type="bus" /></span>
                    <span className="row-main">
                      <strong>{b.registration}</strong>
                      <small>{driverName(b.assignedDriver)} · {r ? routeLabel(r.id) : 'no route'}</small>
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
            <h2>Needs attention <sup>{attention.length}</sup></h2>
          </div>
          {attention.length === 0 ? (
            <p className="all-clear"><span className="live-dot" aria-hidden="true" />All clear. Nothing needs your attention right now.</p>
          ) : (
            <ul className="rows">
              {attention.slice(0, MAX_ATTENTION).map((a) => (
                <li key={a.key}>
                  <button type="button" className="row attn" onClick={() => setActivePage(a.go)}>
                    <span className={`attn-dot ${a.tone}`} aria-hidden="true" />
                    <span className="row-main"><strong>{a.text}</strong></span>
                  </button>
                </li>
              ))}
              {attention.length > MAX_ATTENTION ? <li className="attn-more">+{attention.length - MAX_ATTENTION} more</li> : null}
            </ul>
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
