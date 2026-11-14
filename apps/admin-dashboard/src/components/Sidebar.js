import React from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from './Icon';
import { signOut } from '../api';

// `pages` and `sections` come from the page registry (pages.js), in menu order.
export default function Sidebar({ pages, sections, activePage, setActivePage, sidebarCollapsed }) {
  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Vehicle name="bus" width={30} label="SmartBus logo" />
        </div>
        <p className="brand-title">SmartBus</p>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {pages.filter((item) => item.section === section).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                onClick={() => setActivePage(item.key)}
                aria-label={item.label}
                title={item.label}
              >
                <Icon type={item.icon} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="nav-item nav-logout" onClick={() => signOut()} aria-label="Log out">
          <Icon type="logout" className="nav-icon" />
          <span className="nav-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}
