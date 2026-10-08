import React from 'react';
import Icon from './Icon';

export default function Header({ currentPageTitle, clock, backendConnected, handleLogout, user, setSidebarCollapsed }) {
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
        <h3 className="header-title">
          {currentPageTitle}
        </h3>
      </div>

      <div className="header-right">
        <span className="header-clock">{clock}</span>
        <span className="system-status">
          <span
            className={`system-status-dot ${backendConnected ? 'on' : 'off'}`}
          />
          {backendConnected ? 'MongoDB Connected' : 'Local State Mode'}
        </span>
        <button
          type="button"
          className="btn btn-secondary header-profile-btn"
          onClick={handleLogout}
          title="Sign Out of Admin Console"
        >
          <Icon type="logout" />
          Sign Out ({user.username})
        </button>
      </div>
    </header>
  );
}
