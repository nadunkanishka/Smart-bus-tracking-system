import React from 'react';
import { FloatingDock, NavIcon } from '../shared/ui';

export function DriverDock({ activeTab, setActiveTab }) {
  // CHANGED (visual only): filled two-tone nav icons, shared with the admin sidebar
  const icon = (name) => (a) => <NavIcon name={name} active={a} />;
  const items = [
    { id: 'shift', label: 'Duty', icon: icon('arrow') },
    { id: 'route', label: 'Route', icon: icon('route') },
    { id: 'diagnostics', label: 'Telemetry', icon: icon('gauge') },
    { id: 'profile', label: 'Profile', icon: icon('user') },
  ];
  return <FloatingDock items={items} active={activeTab} onChange={setActiveTab} />;
}
