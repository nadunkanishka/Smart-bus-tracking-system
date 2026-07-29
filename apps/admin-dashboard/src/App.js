import React, { useState } from 'react';
import './admin-theme.css';
import AdminSidebar from './components/AdminSidebar';
import KPIAnalyticsCards from './components/KPIAnalyticsCards';
import CommandMap from './components/CommandMap';
import TelemetryGrid from './components/TelemetryGrid';

function App() {
  const [activeTab, setActiveTab] = useState('fleet');

  return (
    <div className="admin-app-container">
      {/* Jet Black (#09090B) Navigation Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Command Workspace */}
      <main className="main-workspace">
        {/* Command Top Header */}
        <header className="command-header">
          <div className="command-title-group">
            <h1>Fleet Operations Command Center</h1>
            <p>Smart Bus Tracking System • Live GPS & Telemetry Engine</p>
          </div>

          <div className="header-status-pills">
            <div className="status-pill online">
              <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#05A357' }} />
              <span>WebSocket Cluster: Connected</span>
            </div>
          </div>
        </header>

        {/* Compact KPI Tiles */}
        <KPIAnalyticsCards />

        {/* Split Command View: Left ~60% Map / Right ~40% Telemetry Grid */}
        <div className="split-command-view">
          <CommandMap />
          <TelemetryGrid />
        </div>
      </main>
    </div>
  );
}

export default App;
