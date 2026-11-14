import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';
import { displayName, initials, roleLabel } from '../format';

const clockText = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// The date and time, refreshed every minute.
function useClock() {
  const [clock, setClock] = useState(clockText);
  useEffect(() => {
    const interval = window.setInterval(() => setClock(clockText()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  return clock;
}

export default function Header({ title, backendConnected, user, onToggleSidebar }) {
  const clock = useClock();
  return (
    <header className="main-header">
      <div className="header-left">
        <button
          type="button"
          className="icon-button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Icon type="menu" />
        </button>
        <h3 className="header-title">{title}</h3>
      </div>

      <div className="header-right">
        <span className="header-clock">{clock}</span>
        <span className="system-status">
          <span className={`system-status-dot ${backendConnected ? 'on' : 'off'}`} />
          {backendConnected ? 'MongoDB Connected' : 'Backend offline'}
        </span>
        <ThemeToggle />
        <div className="user-chip">
          <span className="user-avatar">{initials(user)}</span>
          <span className="user-chip-copy">
            <strong>{displayName(user)}</strong>
            <small>{roleLabel(user)}</small>
          </span>
        </div>
      </div>
    </header>
  );
}
