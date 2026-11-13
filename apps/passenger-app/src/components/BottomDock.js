import React from 'react';
import { FloatingDock, NavIcon } from '../shared/ui';

export function BottomDock({ activeTab, setActiveTab }) {
  const icon = (name) => (active) => <NavIcon name={name} active={active} />;
  const items = [
    { id: 'home', label: 'Home', icon: icon('home') },
    { id: 'tracking', label: 'Track', icon: icon('arrow') },
    { id: 'routes', label: 'Routes', icon: icon('route') },
    { id: 'profile', label: 'Profile', icon: icon('user') },
  ];
  return <FloatingDock items={items} active={activeTab} onChange={setActiveTab} />;
}
