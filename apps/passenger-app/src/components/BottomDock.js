import React from 'react';
import { FloatingDock, NavIcon } from '../shared/ui';
import { TABS } from '../constants';

export function BottomDock({ activeTab, setActiveTab }) {
  const icon = (name) => (active) => <NavIcon name={name} active={active} />;
  const items = [
    { id: TABS.home, label: 'Home', icon: icon('home') },
    { id: TABS.tracking, label: 'Track', icon: icon('arrow') },
    { id: TABS.routes, label: 'Routes', icon: icon('route') },
    { id: TABS.profile, label: 'Profile', icon: icon('user') },
  ];
  return <FloatingDock items={items} active={activeTab} onChange={setActiveTab} />;
}
