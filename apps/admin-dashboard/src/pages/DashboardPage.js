import React from 'react';
import Icon from '../components/Icon';

const MAX_BARS = 8;

export default function DashboardPage({ user, summary, drivers, buses, routes, fetchBackendData, showNotification, openModal, setActivePage }) {
  const fleet = { active: 0, idle: 0, maintenance: 0, ...summary.fleetDistribution };
  const fleetTotal = fleet.active + fleet.idle + fleet.maintenance;
  const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);
  const activePct = pct(fleet.active, fleetTotal);
  const readyRoutes = routes.filter((r) => r.path.length > 1 && r.stopPoints.length > 1).length;

  const bars = routes.slice(0, MAX_BARS).map((r) => ({ id: r.id, name: r.name, stops: r.stopPoints.length }));
  const topStops = Math.max(1, ...bars.map((b) => b.stops));
  const totalStops = bars.reduce((n, b) => n + b.stops, 0);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const kpis = [
    { label: 'Registered buses', value: summary.registeredBuses, chip: `${fleet.active} on the road`, tone: 'blue', icon: 'bus' },
    { label: 'Active drivers', value: summary.activeDrivers, chip: `of ${drivers.length} drivers`, tone: 'green', icon: 'drivers' },
    { label: 'Active routes', value: summary.activeRoutes, chip: `${readyRoutes} ready for tracking`, tone: 'peach', icon: 'route' },
    { label: 'Under maintenance', value: fleet.maintenance, chip: `of ${fleetTotal} buses`, tone: 'cream', icon: 'gauge' },
  ];
  const statuses = [
    { key: 'active', label: 'Active', tone: 'blue' },
    { key: 'idle', label: 'Idle / depot', tone: 'green' },
    { key: 'maintenance', label: 'Maintenance', tone: 'peach' },
  ];
  const actions = [
    { label: 'Register driver', onClick: () => openModal('driver') },
    { label: 'Register bus', onClick: () => openModal('bus') },
    { label: 'Create route', onClick: () => openModal('route') },
    { label: 'Refresh data', icon: 'sync', onClick: () => { fetchBackendData(); showNotification('Refreshed data from MongoDB.'); } },
  ];

  return (
    <section className="page-section" data-page="dashboard">
      <div className="section-header">
        <div>
          <h1 className="greeting"><b>Hello,</b> {user.name || user.username}</h1>
          <p>{today} · Live data from MongoDB</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal('bus')}>
          <Icon type="plus" />
          Add bus
        </button>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <span className={`kpi-icon tone-${k.tone}`}><Icon type={k.icon} /></span>
            <p className="kpi-label">{k.label}</p>
            <strong>{k.value}</strong>
            <span className="chip">{k.chip}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Stops per route</h2>
              <p>Stops placed on the map for each route</p>
            </div>
            <span className="chip chip-plain">{totalStops} total</span>
          </div>
          {bars.length === 0 ? (
            <div className="bar-chart empty-state">No routes yet. Create one to see it here.</div>
          ) : (
            <div className="bar-chart" role="img" aria-label={bars.map((b) => `${b.name}: ${b.stops} stops`).join(', ')}>
              {bars.map((b) => (
                <div key={b.id} className={`bar-col ${b.stops === topStops ? 'top' : ''}`}>
                  <span className="bar-value">{b.stops}</span>
                  <span className="bar" style={{ height: `${Math.max(12, (b.stops / topStops) * 100)}%` }} />
                  <span className="bar-label" title={b.name}>{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel overview-card">
          <span className="chip chip-dark">Overview</span>
          <div>
            <h2>Keep SmartBus running smoothly</h2>
            <p>Review buses, drivers, routes and live activity in one place.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setActivePage('buses')}>Manage buses</button>
        </div>
      </div>

      <div className="tile-grid">
        <div className="panel tile tile-blue">
          <div className="panel-head">
            <h2><span className="tile-icon"><Icon type="bus" /></span>Buses by status</h2>
            <span className="chip chip-plain">{fleetTotal} buses</span>
          </div>
          <div className="stack-bar">
            {statuses.map((s) => <span key={s.key} className={`tone-${s.tone}`} style={{ flexGrow: fleet[s.key] }} />)}
          </div>
          {statuses.map((s) => (
            <div key={s.key} className="tile-row">
              <span className={`dot tone-${s.tone}`} />
              <span>{s.label}</span>
              <strong>{fleet[s.key]}</strong>
            </div>
          ))}
        </div>

        <div className="panel tile tile-green">
          <div className="panel-head">
            <h2><span className="tile-icon"><Icon type="pulse" /></span>Fleet active</h2>
            <span className="chip chip-plain">right now</span>
          </div>
          <div className="ring" style={{ '--pct': activePct }} role="img" aria-label={`${activePct}% of buses active`}>
            <span>{activePct}<small>%</small></span>
          </div>
          <p className="tile-caption">{fleet.active} of {fleetTotal} buses are running</p>
        </div>

        <div className="panel tile tile-peach">
          <div className="panel-head">
            <h2><span className="tile-icon"><Icon type="plus" /></span>Quick actions</h2>
            <span className="chip chip-plain">{buses.length + drivers.length + routes.length} records</span>
          </div>
          {actions.map((a) => (
            <button key={a.label} type="button" className="tile-row tile-action" onClick={a.onClick}>
              <span>{a.label}</span>
              <span className="tile-action-badge"><Icon type={a.icon || 'plus'} /></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
