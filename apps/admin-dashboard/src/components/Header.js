import React from 'react';
import Icon from './Icon';

export default function Header({ currentPageTitle, clock, backendConnected, user, setSidebarCollapsed }) {
  const name = user.name || user.username;
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <header className="main-header">
      <div className="header-left">
        <button
          type="button"
          className="icon-button"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label="Toggle sidebar"
        >
          <Icon type="menu" />
        </button>
        <h3 className="header-title">{currentPageTitle}</h3>
      </div>

      <div className="header-right">
        <span className="header-clock">{clock}</span>
        <span className="system-status">
          <span className={`system-status-dot ${backendConnected ? 'on' : 'off'}`} />
          {backendConnected ? 'MongoDB Connected' : 'Local State Mode'}
        </span>
        <div className="user-chip">
          <span className="user-avatar">{initials}</span>
          <span className="user-chip-copy">
            <strong>{name}</strong>
            <small>{user.role || 'Administrator'}</small>
          </span>
        </div>
      </div>
    </header>
  );
}
