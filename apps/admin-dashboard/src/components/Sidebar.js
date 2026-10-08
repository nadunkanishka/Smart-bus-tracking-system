import React from 'react';
import { Vehicle } from '../design/Vehicle';
import NavGlyph, { NAV_FOR } from './NavGlyph';

export default function Sidebar({ activePage, setActivePage, sidebarCollapsed, summary, user }) {
  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Vehicle name="bus" width={36} label="SmartBus logo" />
        </div>
        <div className="brand-copy">
          <p className="brand-title">SmartBus Console</p>
          <p className="brand-subtitle">Admin Operations</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {['Main', 'Fleet Management', 'Network & Operations'].map((section) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {[
              { section: 'Main', key: 'dashboard', label: 'Dashboard', icon: 'grid' },
              { section: 'Fleet Management', key: 'drivers', label: 'Drivers', icon: 'drivers' },
              { section: 'Fleet Management', key: 'buses', label: 'Buses', icon: 'bus' },
              { section: 'Network & Operations', key: 'routes', label: 'Routes', icon: 'route' },
              { section: 'Network & Operations', key: 'live', label: 'Live Monitor', icon: 'pulse' },
              { section: 'Network & Operations', key: 'analytics', label: 'Analytics', icon: 'chart' },
            ]
              .filter((item) => item.section === section)
              .map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                  onClick={() => setActivePage(item.key)}
                  aria-label={item.label}
                >
                  <span className="nav-icon">
                    <NavGlyph name={NAV_FOR[item.icon]} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-depot">
        <p className="sidebar-depot-title">MongoDB Realtime Sync</p>
        <p className="sidebar-depot-copy">
          {summary.registeredBuses} buses, {summary.activeDrivers} drivers online
        </p>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">AD</div>
        <div className="sidebar-user-copy">
          <p className="sidebar-user-name">{user.name || user.username}</p>
          <p className="sidebar-user-role">
            Role: <span>{user.role || 'Super Admin'}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
