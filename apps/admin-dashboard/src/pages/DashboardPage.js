import React, { useState } from 'react';
import Icon from '../components/Icon';

const MAX_BARS = 7;
const MAX_FLEET_ROWS = 3;
const MAX_DRIVER_ROWS = 1;

export default function DashboardPage({ user, summary, drivers, buses, routes, fetchBackendData, showNotification, openModal, setActivePage }) {
  const [driverFilter, setDriverFilter] = useState('Active'); // 'Active' | 'On Leave'
  const fleet = { active: 0, idle: 0, maintenance: 0, ...summary.fleetDistribution };
  const fleetTotal = fleet.active + fleet.idle + fleet.maintenance;
  const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);
  const readyRoutes = routes.filter((r) => r.path.length > 1 && r.stopPoints.length > 1).length;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  // Stops per route as bars; the tallest bar carries a small card with its details.
  const bars = routes.slice(0, MAX_BARS).map((r) => ({ id: r.id, label: r.routeNumber || r.id, name: r.name, stops: r.stopPoints.length, distance: r.distance }));
  const topStops = Math.max(1, ...bars.map((b) => b.stops));
  const topIndex = bars.findIndex((b) => b.stops === topStops);
  const totalStops = routes.reduce((n, r) => n + r.stopPoints.length, 0);

  // Fleet split: green = running, violet = idle, red = maintenance. The ring is a conic gradient built from the shares.
  const split = [
    { key: 'active', label: 'Running', color: 'var(--green)', n: fleet.active },
    { key: 'idle', label: 'Idle', color: 'var(--violet)', n: fleet.idle },
    { key: 'maintenance', label: 'Service', color: 'var(--danger)', n: fleet.maintenance },
  ];
  let at = 0;
  const ring = fleetTotal
    ? `conic-gradient(${split.map((s) => { const from = at; at += (s.n / fleetTotal) * 100; return `${s.color} ${from}% ${at}%`; }).join(', ')})`
    : 'conic-gradient(var(--a-line) 0 100%)';

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
              <h2>Stops per route</h2>
              <p className="big-number">{totalStops}<small>{routes.length} routes · {readyRoutes} ready</small></p>
            </div>
            <div className="round-btns">
              <button type="button" className="round-btn" onClick={() => openModal('route')} aria-label="Add route" title="Add route"><Icon type="plus" /></button>
              <button type="button" className="round-btn" onClick={() => { fetchBackendData(); showNotification('Refreshed data from MongoDB.'); }} aria-label="Refresh data" title="Refresh data"><Icon type="sync" /></button>
            </div>
          </div>
          {bars.length === 0 ? (
            <div className="bar-chart empty-state">No routes yet. Create one to see it here.</div>
          ) : (
            <div className="bar-chart" role="img" aria-label={bars.map((b) => `${b.name}: ${b.stops} stops`).join(', ')}>
              {bars.map((b, i) => (
                <div key={b.id} className={`bar-col ${i === topIndex ? 'top' : ''}`}>
                  {i === topIndex && (
                    <span className="bar-tip">
                      <small>{b.name}</small>
                      <b><i />{b.stops} stops</b>
                      <b><i />{b.distance}</b>
                    </span>
                  )}
                  <span className="bar" style={{ height: `${Math.max(14, (b.stops / topStops) * 100)}%` }} />
                  <span className="bar-label" title={b.name}>{b.label}</span>
                </div>
              ))}
            </div>
          )}
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

        <div className="panel">
          <div className="panel-head">
            <h2>Fleet split</h2>
            <span className="chip chip-plain">{fleetTotal} buses</span>
          </div>
          <div className="ring-wrap">
            <div className="donut" style={{ background: ring }} role="img" aria-label={split.map((s) => `${s.label}: ${pct(s.n, fleetTotal)}%`).join(', ')}>
              <div className="donut-hole">
                <small>Running now</small>
                <strong>{fleet.active}</strong>
                <small>of {fleetTotal}</small>
              </div>
            </div>
            <ul className="legend">
              {split.map((s) => (
                <li key={s.key}><span className="legend-dot" style={{ background: s.color }} />{s.label} <strong>{pct(s.n, fleetTotal)}%</strong></li>
              ))}
            </ul>
          </div>
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
