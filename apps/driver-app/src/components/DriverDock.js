import React from 'react';
import { FloatingDock, NavIcon } from '../shared/ui';
import { TABS } from '../constants';

export function DriverDock({ activeTab, setActiveTab }) {
  const icon = (name) => (a) => <NavIcon name={name} active={a} />;
  const items = [
    { id: TABS.shift, label: 'Duty', icon: icon('arrow') },
    { id: TABS.route, label: 'Route', icon: icon('route') },
    { id: TABS.diagnostics, label: 'Telemetry', icon: icon('gauge') },
    { id: TABS.profile, label: 'Profile', icon: icon('user') },
  ];
  return <FloatingDock items={items} active={activeTab} onChange={setActiveTab} />;
}
