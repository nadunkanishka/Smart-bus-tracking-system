import React from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from './Icon';

const NAV = [
  { section: 'Administrator', key: 'dashboard', label: 'Dashboard', icon: 'tiles' },
  { section: 'Fleet', key: 'drivers', label: 'Drivers', icon: 'drivers' },
  { section: 'Fleet', key: 'buses', label: 'Buses', icon: 'bus' },
  { section: 'Network', key: 'routes', label: 'Routes', icon: 'route' },
  { section: 'Network', key: 'live', label: 'Live Monitor', icon: 'pulse' },
  { section: 'Network', key: 'analytics', label: 'Analytics', icon: 'chart' },
];

export default function Sidebar({ activePage, setActivePage, sidebarCollapsed, handleLogout }) {
  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Vehicle name="bus" width={30} label="SmartBus logo" />
        </div>
        <p className="brand-title">SmartBus</p>
      </div>

      <nav className="sidebar-nav">
        {['Administrator', 'Fleet', 'Network'].map((section) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {NAV.filter((item) => item.section === section).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                onClick={() => setActivePage(item.key)}
                aria-label={item.label}
              >
                <Icon type={item.icon} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="nav-item nav-logout" onClick={handleLogout} aria-label="Log out">
          <Icon type="logout" className="nav-icon" />
          <span className="nav-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}
