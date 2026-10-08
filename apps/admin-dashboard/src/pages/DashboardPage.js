import React from 'react';
import Icon from '../components/Icon';
import KpiCard from '../components/KpiCard';
import LegendItem from '../components/LegendItem';

export default function DashboardPage({ summary, fetchBackendData, showNotification, openModal }) {
  // Modern fleet chart calculation
  const fleetTotal = Object.values(summary.fleetDistribution || {}).reduce((tot, v) => tot + v, 0) || 1;
  const activePct = ((summary.fleetDistribution?.active || 0) / fleetTotal) * 360;
  const idlePct = (((summary.fleetDistribution?.active || 0) + (summary.fleetDistribution?.idle || 0)) / fleetTotal) * 360;

  const fleetChartStyle = {
    background: `conic-gradient(
      var(--primary) 0deg ${activePct}deg,
      #D1D1D1 ${activePct}deg ${idlePct}deg,
      var(--accent) ${idlePct}deg 360deg
    )`,
  };

  return (
    <section className="page-section" data-page="dashboard">
      <div className="section-header">
        <div>
          <h1>System Dashboard</h1>
          <p>Real-time analytics fetched directly from your MongoDB Database</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary sync-btn"
          onClick={() => {
            fetchBackendData();
            showNotification('Refreshed data from MongoDB.');
          }}
        >
          <Icon type="sync" />
          Refresh Data
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Active Routes"
          value={summary.activeRoutes}
          subtitle="Active network routes"
          tint="train"
          vehicle="route"
        />
        <KpiCard
          label="Registered Buses"
          value={summary.registeredBuses}
          subtitle={`${summary.fleetDistribution?.active || 0} Active / ${summary.fleetDistribution?.maintenance || 0} Maintenance`}
          tint="bus"
          vehicle="bus"
          livery="purple"
        />
        <KpiCard
          label="Active Drivers"
          value={summary.activeDrivers}
          subtitle="Authorized drivers in system"
          tint="taxi"
          vehicle="driver"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <h2>Fleet Status Distribution (Real-Time)</h2>
          <div className="chart-layout">
            <div className="fleet-chart-shell">
              <div className="fleet-chart" style={fleetChartStyle}>
                <div className="fleet-chart-inner">
                  <span>{fleetTotal}</span>
                  <small>Total Buses</small>
                </div>
              </div>
            </div>

            <div className="chart-legend">
              <LegendItem
                color="sky"
                label="Active Fleet"
                value={`${summary.fleetDistribution?.active || 0} buses`}
              />
              <LegendItem
                color="slate"
                label="Idle / Depot"
                value={`${summary.fleetDistribution?.idle || 0} buses`}
              />
              <LegendItem
                color="amber"
                label="Under Maintenance"
                value={`${summary.fleetDistribution?.maintenance || 0} buses`}
              />
            </div>
          </div>
        </div>

        <div className="panel quick-panel">
          <div>
            <h2>Quick Management</h2>
            <p>Shortcuts to instantly add assets into MongoDB</p>
            <div className="quick-actions">
              <button type="button" className="btn btn-secondary quick-action" onClick={() => openModal('driver')}>
                <span><Icon type="plus" /></span> Register New Driver
              </button>
              <button type="button" className="btn btn-secondary quick-action" onClick={() => openModal('bus')}>
                <span><Icon type="plus" /></span> Register New Bus / Vehicle
              </button>
              <button type="button" className="btn btn-secondary quick-action" onClick={() => openModal('route')}>
                <span><Icon type="plus" /></span> Create Network Route
              </button>
            </div>
          </div>
          <p className="quick-panel-footer">
            Connected to MongoDB database <code>smart_bus_tracking</code>
          </p>
        </div>
      </div>
    </section>
  );
}
