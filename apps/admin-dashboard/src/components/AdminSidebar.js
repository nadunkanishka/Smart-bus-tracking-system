import React from 'react';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'fleet', label: 'Fleet Command', icon: '⚡' },
    { id: 'routes', label: 'Routes & Polylines', icon: '🛣️' },
    { id: 'telemetry', label: 'Live Telemetry', icon: '📡' },
    { id: 'analytics', label: 'Segment Analytics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo" title="Uber Fleet Operations">
        UF
      </div>
      <nav className="sidebar-nav-list">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <span>{item.icon}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
