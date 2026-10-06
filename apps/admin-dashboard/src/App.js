import React, { useEffect, useMemo, useState } from 'react';
import './design/tokens.css'; // CHANGED: shared design tokens
import './admin-theme.css';
import { RoadScene, Vehicle } from './design/Vehicle'; // CHANGED: shared vehicle illustration set

const API_BASE = 'http://localhost:5000/api';

const modalDefaults = {
  driver: { name: '', license: '', expiry: '', phone: '' },
  bus: { registration: '', capacity: '', mileage: '', password: '', status: 'Active' },
  route: { name: '', start: '', end: '', distance: '', stops: [''], assignedBus: '' },
};

function App() {
  // Auth State
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('adminUser') || 'null');
    } catch {
      return null;
    }
  });
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPw, setShowPw] = useState(false); // CHANGED (UI-only): show/hide password toggle

  // App UI State
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clock, setClock] = useState('');
  const [notification, setNotification] = useState(null);

  // Data Collections (real data from MongoDB)
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState({
    activeRoutes: 0,
    registeredBuses: 0,
    activeDrivers: 0,
    fleetDistribution: {
      active: 0,
      idle: 0,
      maintenance: 0,
    },
  });
  const [backendConnected, setBackendConnected] = useState(false);

  // Modal & Confirm dialogs
  const [modalState, setModalState] = useState({
    open: false,
    entity: 'driver',
    mode: 'add',
    editId: null,
  });
  const [formData, setFormData] = useState(modalDefaults.driver);
  const [confirmState, setConfirmState] = useState({
    open: false,
    entity: 'driver',
    id: '',
    rawId: '',
    label: '',
  });

  // Fetch live MongoDB backend data & summary metrics
  const fetchBackendData = async () => {
    try {
      const [resD, resB, resR, resS] = await Promise.all([
        fetch(`${API_BASE}/drivers`),
        fetch(`${API_BASE}/buses`),
        fetch(`${API_BASE}/routes`),
        fetch(`${API_BASE}/dashboard/summary`),
      ]);

      let connected = false;

      if (resD.ok) {
        const dataD = await resD.json();
        if (Array.isArray(dataD)) {
          setDrivers(
            dataD.map((d) => ({
              id: d.driverId || d._id || d.id,
              rawId: d._id,
              name: d.name,
              license: d.license,
              expiry: d.expiry,
              phone: d.phone,
              status: d.status || 'Active',
            }))
          );
        }
        connected = true;
      }

      if (resB.ok) {
        const dataB = await resB.json();
        if (Array.isArray(dataB)) {
          setBuses(
            dataB.map((b) => ({
              id: b.busId || b._id || b.id,
              rawId: b._id,
              registration: b.registration,
              capacity: `${b.capacity} seats`,
              mileage: `${Number(b.mileage || 0).toLocaleString('en-US')} km`,
              password: b.password || '',
              rawCapacity: b.capacity,
              rawMileage: b.mileage,
              status: b.status || 'Active',
            }))
          );
        }
        connected = true;
      }

      if (resR.ok) {
        const dataR = await resR.json();
        if (Array.isArray(dataR)) {
          setRoutes(
            dataR.map((r) => ({
              id: r.routeId || r._id || r.id,
              rawId: r._id,
              name: r.name,
              start: r.start,
              end: r.end,
              distance: `${r.distance} km`,
              rawDistance: r.distance,
              stops: Array.isArray(r.stops) ? r.stops : [],
              assignedBus: r.assignedBus || '',
              status: r.status || 'Active',
            }))
          );
        }
        connected = true;
      }

      if (resS.ok) {
        const summaryData = await resS.json();
        setSummary(summaryData);
      }

      setBackendConnected(connected);
    } catch (err) {
      setBackendConnected(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBackendData();
    }
  }, [user]);

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };

    updateClock();
    const interval = window.setInterval(updateClock, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  // Auth Functions
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCreds),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials');
        setLoginLoading(false);
        return;
      }

      setUser(data.user);
      sessionStorage.setItem('adminUser', JSON.stringify(data.user));
      setLoginLoading(false);
    } catch (err) {
      setLoginError('Could not connect to backend server. Make sure node backend is running.');
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('adminUser');
  };

  // Modern fleet chart calculation
  const fleetTotal = Object.values(summary.fleetDistribution || {}).reduce((tot, v) => tot + v, 0) || 1;
  const activePct = ((summary.fleetDistribution?.active || 0) / fleetTotal) * 360;
  const idlePct = (((summary.fleetDistribution?.active || 0) + (summary.fleetDistribution?.idle || 0)) / fleetTotal) * 360;

  const fleetChartStyle = {
    background: `conic-gradient(
      var(--primary) 0deg ${activePct}deg,
      #C4CFDA ${activePct}deg ${idlePct}deg,
      var(--accent) ${idlePct}deg 360deg
    )`,
  };

  const showNotification = (message) => setNotification(message);

  const openModal = (entity, mode = 'add', record = null) => {
    setModalState({
      open: true,
      entity,
      mode,
      editId: record?.rawId || record?.id || null,
    });

    if (record) {
      if (entity === 'driver') {
        setFormData({
          name: record.name,
          license: record.license,
          expiry: record.expiry,
          phone: record.phone,
        });
      } else if (entity === 'bus') {
        setFormData({
          registration: record.registration,
          capacity: record.rawCapacity ?? String(record.capacity).replace(' seats', ''),
          mileage: record.rawMileage ?? String(record.mileage).replace(' km', '').replaceAll(',', ''),
          password: record.password || '',
          status: record.status || 'Active',
        });
      } else {
        setFormData({
          name: record.name,
          start: record.start,
          end: record.end,
          distance: record.rawDistance ?? String(record.distance).replace(' km', ''),
          stops: Array.isArray(record.stops)
            ? record.stops.length > 0 ? record.stops : ['']
            : typeof record.stops === 'string'
              ? record.stops.split(',').map((s) => s.trim())
              : [''],
          assignedBus: record.assignedBus || '',
        });
      }
      return;
    }

    setFormData(modalDefaults[entity]);
  };

  const closeModal = () => {
    setModalState((current) => ({ ...current, open: false, editId: null }));
    setFormData(modalDefaults[modalState.entity]);
  };

  const openConfirm = (entity, record) => {
    const label =
      entity === 'driver'
        ? `Driver: ${record.name}`
        : entity === 'bus'
          ? `Bus: ${record.registration}`
          : `Route: ${record.name}`;

    setConfirmState({
      open: true,
      entity,
      id: record.id,
      rawId: record.rawId || record._id || record.id,
      registration: record.registration || '',
      label,
    });
  };

  const closeConfirm = () => {
    setConfirmState({ open: false, entity: 'driver', id: '', rawId: '', label: '' });
  };

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const { entity, mode, editId } = modalState;

    if (entity === 'driver') {
      const payload = {
        name: formData.name || 'New Driver',
        license: formData.license || `LK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        expiry: formData.expiry || '2028-01-01',
        phone: formData.phone || '+94 77 000 0000',
        status: 'Active',
      };

      try {
        if (mode === 'edit') {
          await fetch(`${API_BASE}/drivers/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showNotification(`Driver ${payload.name} updated successfully.`);
        } else {
          await fetch(`${API_BASE}/drivers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showNotification(`Driver ${payload.name} added successfully.`);
        }
      } catch (err) {
        showNotification(`Saved driver ${payload.name}.`);
      }
    }

    if (entity === 'bus') {
      const payload = {
        registration: formData.registration || 'NB-0000',
        capacity: Number(formData.capacity || 50),
        mileage: Number(formData.mileage || 0),
        password: formData.password || '',
        status: formData.status || 'Active',
      };

      try {
        if (mode === 'edit') {
          await fetch(`${API_BASE}/buses/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showNotification(`Bus ${payload.registration} updated successfully.`);
        } else {
          await fetch(`${API_BASE}/buses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showNotification(`Bus ${payload.registration} registered successfully.`);
        }
      } catch (err) {
        showNotification(`Saved bus ${payload.registration}.`);
      }
    }

    if (entity === 'route') {
      const cleanStops = (Array.isArray(formData.stops) ? formData.stops : [])
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name || 'New Route',
        start: formData.start || 'Start Terminal',
        end: formData.end || 'End Terminal',
        distance: Number(formData.distance || 0),
        stops: cleanStops,
        assignedBus: formData.assignedBus || '',
        status: 'Active',
      };

      try {
        if (mode === 'edit') {
          await fetch(`${API_BASE}/routes/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showNotification(`Route ${payload.name} updated successfully.`);
        } else {
          await fetch(`${API_BASE}/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          showNotification(`Route ${payload.name} created successfully.`);
        }
      } catch (err) {
        showNotification(`Saved route ${payload.name}.`);
      }
    }

    closeModal();
    fetchBackendData();
  };

  const handleDelete = async () => {
    const { entity, id, rawId, registration } = confirmState;
    const targetId = rawId || id;

    // Instantly filter out from UI
    if (entity === 'bus') {
      setBuses((prev) => prev.filter((b) => b.rawId !== rawId && b.id !== id && b.registration !== registration));
    } else if (entity === 'driver') {
      setDrivers((prev) => prev.filter((d) => d.rawId !== rawId && d.id !== id));
    } else if (entity === 'route') {
      setRoutes((prev) => prev.filter((r) => r.rawId !== rawId && r.id !== id));
    }

    closeConfirm();

    try {
      await fetch(`${API_BASE}/${entity}s/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
      showNotification(`${entity.toUpperCase()} deleted successfully.`);
    } catch (err) {
      showNotification('Record deleted.');
    }

    await fetchBackendData();
  };

  // If not logged in, render Login View
  if (!user) {
    return (
      <div className="login-shell">
        {/* CHANGED: teal hero with vehicles on a road; the white form panel curves up over it on mobile */}
        <section className="login-hero">
          <div>
            <div className="login-brand">
              <span className="login-brand-icon"><Vehicle name="bus" width={36} label="SmartBus logo" /></span>
              SmartBus Console
            </div>
            <span className="login-tagline">Fleet, drivers and routes in one place</span>
          </div>
          <RoadScene scene="admin" className="login-scene" label="A metro train and a cargo truck on the road" />
        </section>

        <div className="login-card">
          <h2 className="login-title">Admin sign in</h2>
          <p className="login-subtitle">Manage your fleet, drivers and routes.</p>

          {loginError && <div className="login-error" role="alert">{loginError}</div>}

          <form onSubmit={handleLoginSubmit} className="login-form">
            <label className="field">
              <span className="form-label">Username</span>
              <span className="input-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <input
                  type="text"
                  className="form-input"
                  value={loginCreds.username}
                  onChange={(e) => setLoginCreds({ ...loginCreds, username: e.target.value })}
                  placeholder="Enter admin username"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="field">
              <span className="form-label">Password</span>
              <span className="input-wrap">
                <svg className="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={loginCreds.password}
                  onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" />{showPw && <path d="M3 3l18 18" />}</svg>
                </button>
              </span>
            </label>

            <button type="submit" className="login-btn" disabled={loginLoading}>
              {loginLoading ? (<><span className="spinner" aria-hidden="true" />Signing In…</>) : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="login-hint">
            Default credentials: <code>admin</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    );
  }

  const currentPageTitle =
    activePage === 'dashboard'
      ? 'System Admin Dashboard'
      : activePage === 'drivers'
        ? 'Driver Management'
        : activePage === 'buses'
          ? 'Bus & Fleet Inventory'
          : 'Create & Manage Routes';

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Vehicle name="bus" width={36} label="SmartBus logo" />
          </div>
          <div className="brand-copy">
            <p className="brand-title">SmartBus Console</p>
            <p className="brand-subtitle">Admin Operations</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {['Main', 'Fleet Management', 'Network & Operations'].map((section) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {[
                { section: 'Main', key: 'dashboard', label: 'Dashboard', icon: 'grid' },
                { section: 'Fleet Management', key: 'drivers', label: 'Drivers', icon: 'drivers' },
                { section: 'Fleet Management', key: 'buses', label: 'Buses', icon: 'bus' },
                { section: 'Network & Operations', key: 'routes', label: 'Routes', icon: 'route' },
              ]
                .filter((item) => item.section === section)
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                    onClick={() => setActivePage(item.key)}
                    aria-label={item.label}
                  >
                    <span className="nav-icon">
                      <Icon type={item.icon} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-depot">
          <p className="sidebar-depot-title">MongoDB Realtime Sync</p>
          <p className="sidebar-depot-copy">
            {summary.registeredBuses} buses, {summary.activeDrivers} drivers online
          </p>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">AD</div>
          <div className="sidebar-user-copy">
            <p className="sidebar-user-name">{user.name || user.username}</p>
            <p className="sidebar-user-role">
              Role: <span>{user.role || 'Super Admin'}</span>
            </p>
          </div>
        </div>
      </aside>

      <div className="main-panel">
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
              Sign Out ({user.username})
            </button>
          </div>
        </header>

        {notification && (
          <div className="notification-banner" role="alert">
            <div className="notification-card">
              <p className="notification-text">{notification}</p>
              <button type="button" className="notification-close" onClick={() => setNotification(null)}>
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="page-scroll">
          {activePage === 'dashboard' && (
            <section className="page-section">
              <div className="section-header">
                <div>
                  <h1>System Dashboard</h1>
                  <p>Real-time analytics fetched directly from your MongoDB Database</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary sync-btn"
                  onClick={() => {
                    fetchBackendData();
                    showNotification('Refreshed data from MongoDB.');
                  }}
                >
                  <Icon type="sync" />
                  Refresh Data
                </button>
              </div>

              <div className="kpi-grid">
                <KpiCard
                  label="Active Routes"
                  value={summary.activeRoutes}
                  subtitle="Active network routes"
                  icon="route"
                  tint="train"
                  vehicle="train"
                />
                <KpiCard
                  label="Registered Buses"
                  value={summary.registeredBuses}
                  subtitle={`${summary.fleetDistribution?.active || 0} Active / ${summary.fleetDistribution?.maintenance || 0} Maintenance`}
                  icon="bus"
                  tint="bus"
                  vehicle="bus"
                />
                <KpiCard
                  label="Active Drivers"
                  value={summary.activeDrivers}
                  subtitle="Authorized drivers in system"
                  icon="drivers"
                  tint="taxi"
                  vehicle="taxi"
                />
              </div>

              <div className="dashboard-grid">
                <div className="panel chart-panel">
                  <h2>Fleet Status Distribution (Real-Time)</h2>
                  <div className="chart-layout">
                    <div className="fleet-chart-shell">
                      <div className="fleet-chart" style={fleetChartStyle}>
                        <div className="fleet-chart-inner">
                          <span>{fleetTotal}</span>
                          <small>Total Buses</small>
                        </div>
                      </div>
                    </div>

                    <div className="chart-legend">
                      <LegendItem
                        color="sky"
                        label="Active Fleet"
                        value={`${summary.fleetDistribution?.active || 0} buses`}
                      />
                      <LegendItem
                        color="slate"
                        label="Idle / Depot"
                        value={`${summary.fleetDistribution?.idle || 0} buses`}
                      />
                      <LegendItem
                        color="amber"
                        label="Under Maintenance"
                        value={`${summary.fleetDistribution?.maintenance || 0} buses`}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel quick-panel">
                  <div>
                    <h2>Quick Management</h2>
                    <p>Shortcuts to instantly add assets into MongoDB</p>
                    <div className="quick-actions">
                      <button type="button" className="btn btn-secondary quick-action" onClick={() => openModal('driver')}>
                        <span>+</span> Register New Driver
                      </button>
                      <button type="button" className="btn btn-secondary quick-action" onClick={() => openModal('bus')}>
                        <span>+</span> Register New Bus / Vehicle
                      </button>
                      <button type="button" className="btn btn-secondary quick-action" onClick={() => openModal('route')}>
                        <span>+</span> Create Network Route
                      </button>
                    </div>
                  </div>
                  <p className="quick-panel-footer">
                    Connected to MongoDB database <code>smart_bus_tracking</code>
                  </p>
                </div>
              </div>
            </section>
          )}

          {activePage === 'drivers' && (
            <section className="page-section">
              <div className="section-header">
                <div>
                  <h1>{currentPageTitle}</h1>
                  <p>Manage and register system drivers stored in MongoDB</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => openModal('driver')}>
                  <Icon type="plus" />
                  Add New Driver
                </button>
              </div>
              <TableShell>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Driver ID</th>
                      <th>Full Name</th>
                      <th>License Number</th>
                      <th>License Expiry</th>
                      <th>Phone Number</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="cell-empty">
                          <div className="empty-state"><Vehicle name="taxi" width={140} label="Nothing here yet" />No drivers registered yet. Click "Add New Driver" to add one!</div>
                        </td>
                      </tr>
                    ) : (
                      drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td className="mono-cell">{driver.id}</td>
                          <td className="table-strong">{driver.name}</td>
                          <td className="mono-cell">{driver.license}</td>
                          <td>{driver.expiry}</td>
                          <td>{driver.phone}</td>
                          <td>
                            <StatusBadge status={driver.status} />
                          </td>
                          <td>
                            <div className="table-actions">
                              <button type="button" className="btn btn-edit" onClick={() => openModal('driver', 'edit', driver)}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-danger" onClick={() => openConfirm('driver', driver)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableShell>
            </section>
          )}

          {activePage === 'buses' && (
            <section className="page-section">
              <div className="section-header">
                <div>
                  <h1>{currentPageTitle}</h1>
                  <p>Register new transit buses into MongoDB inventory</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => openModal('bus')}>
                  <Icon type="plus" />
                  Add New Bus
                </button>
              </div>
              <TableShell>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bus ID</th>
                      <th>Registration No.</th>
                      <th>Passenger Capacity</th>
                      <th>Total Mileage</th>
                      <th>Password</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buses.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="cell-empty">
                          <div className="empty-state"><Vehicle name="bus" width={140} label="Nothing here yet" />No buses registered yet. Click "Add New Bus" to register a bus!</div>
                        </td>
                      </tr>
                    ) : (
                      buses.map((bus) => (
                        <tr key={bus.id}>
                          <td className="mono-cell">{bus.id}</td>
                          <td className="mono-cell table-strong">{bus.registration}</td>
                          <td>{bus.capacity}</td>
                          <td>{bus.mileage}</td>
                          <td className="mono-cell cell-muted">
                            {bus.password ? bus.password : <span className="cell-muted">None</span>}
                          </td>
                          <td>
                            <StatusBadge status={bus.status} />
                          </td>
                          <td>
                            <div className="table-actions">
                              <button type="button" className="btn btn-edit" onClick={() => openModal('bus', 'edit', bus)}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-danger" onClick={() => openConfirm('bus', bus)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableShell>
            </section>
          )}

          {activePage === 'routes' && (
            <section className="page-section">
              <div className="section-header">
                <div>
                  <h1>{currentPageTitle}</h1>
                  <p>Setup network paths and intermediate stop lists in MongoDB</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => openModal('route')}>
                  <Icon type="plus" />
                  Create Route
                </button>
              </div>
              <TableShell>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Route ID</th>
                      <th>Route Name</th>
                      <th>Assigned Bus</th>
                      <th>Start Terminal</th>
                      <th>End Terminal</th>
                      <th>Distance</th>
                      <th>Intermediate Stops</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="cell-empty">
                          <div className="empty-state"><Vehicle name="train" width={140} label="Nothing here yet" />No network routes created yet. Click "Create Route" to create one!</div>
                        </td>
                      </tr>
                    ) : (
                      routes.map((route) => (
                        <tr key={route.id}>
                          <td className="mono-cell">{route.id}</td>
                          <td className="table-strong">{route.name}</td>
                          <td>
                            {route.assignedBus ? (
                              <span className="mono-cell cell-bus">
                                {route.assignedBus}
                              </span>
                            ) : (
                              <span className="cell-muted">Unassigned</span>
                            )}
                          </td>
                          <td>{route.start}</td>
                          <td>{route.end}</td>
                          <td>{route.distance}</td>
                          <td>
                            {Array.isArray(route.stops) ? (
                              route.stops.length > 0 ? (
                                <div>
                                  <span className="table-strong">{route.stops.length} stop{route.stops.length > 1 ? 's' : ''}</span>
                                  <div className="cell-hint">
                                    {route.stops.join(' → ')}
                                  </div>
                                </div>
                              ) : (
                                <span className="cell-muted">Direct Route</span>
                              )
                            ) : (
                              route.stops || 'N/A'
                            )}
                          </td>
                          <td>
                            <StatusBadge status={route.status} />
                          </td>
                          <td>
                            <div className="table-actions">
                              <button type="button" className="btn btn-edit" onClick={() => openModal('route', 'edit', route)}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-danger" onClick={() => openConfirm('route', route)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableShell>
            </section>
          )}
        </main>
      </div>

      {modalState.open && (
        <div className="overlay" onClick={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="modal-box">
            <h3 className="modal-title">
              {modalState.entity === 'driver'
                ? modalState.mode === 'edit'
                  ? 'Edit Driver'
                  : 'Add New Driver'
                : modalState.entity === 'bus'
                  ? modalState.mode === 'edit'
                    ? 'Edit Bus'
                    : 'Add New Bus'
                  : modalState.mode === 'edit'
                    ? 'Edit Route'
                    : 'Create New Route'}
            </h3>

            {modalState.entity === 'driver' && (
              <div className="modal-form">
                <Field label="Full Name *">
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="e.g. A. Bandara"
                  />
                </Field>
                <Field label="License Number *">
                  <input
                    className="form-input mono-input"
                    value={formData.license}
                    onChange={(event) => updateField('license', event.target.value)}
                    placeholder="LK-2024-XXXXX"
                  />
                </Field>
                <div className="form-grid">
                  <Field label="License Expiry *">
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expiry}
                      onChange={(event) => updateField('expiry', event.target.value)}
                    />
                  </Field>
                  <Field label="Phone Number *">
                    <input
                      className="form-input"
                      value={formData.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      placeholder="+94 7X XXX XXXX"
                    />
                  </Field>
                </div>
              </div>
            )}

            {modalState.entity === 'bus' && (
              <div className="modal-form">
                <Field label="Registration Number (e.g. NB-4712) *">
                  <input
                    className="form-input mono-input"
                    value={formData.registration}
                    onChange={(event) => updateField('registration', event.target.value)}
                    placeholder="e.g. NB-4712"
                  />
                </Field>
                <div className="form-grid">
                  <Field label="Seating Capacity *">
                    <input
                      type="number"
                      className="form-input"
                      value={formData.capacity}
                      onChange={(event) => updateField('capacity', event.target.value)}
                      placeholder="52"
                    />
                  </Field>
                  <Field label="Initial Mileage (km) *">
                    <input
                      type="number"
                      className="form-input"
                      value={formData.mileage}
                      onChange={(event) => updateField('mileage', event.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field label="Bus Password / Security PIN">
                    <input
                      type="text"
                      className="form-input mono-input"
                      value={formData.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      placeholder="Enter bus password"
                    />
                  </Field>
                  <Field label="Bus Operating Status">
                    <select
                      className="form-input"
                      value={formData.status}
                      onChange={(event) => updateField('status', event.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {modalState.entity === 'route' && (
              <div className="modal-form">
                <Field label="Route Name *">
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="e.g. Colombo to Galle"
                  />
                </Field>
                <div className="form-grid">
                  <Field label="Start Terminal *">
                    <input
                      className="form-input"
                      value={formData.start}
                      onChange={(event) => updateField('start', event.target.value)}
                      placeholder="Origin Terminal"
                    />
                  </Field>
                  <Field label="End Terminal *">
                    <input
                      className="form-input"
                      value={formData.end}
                      onChange={(event) => updateField('end', event.target.value)}
                      placeholder="Destination Terminal"
                    />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field label="Distance (km) *">
                    <input
                      type="number"
                      className="form-input"
                      value={formData.distance}
                      onChange={(event) => updateField('distance', event.target.value)}
                      placeholder="120"
                    />
                  </Field>
                  <Field label="Assign Bus (From Fleet)">
                    <select
                      className="form-input"
                      value={formData.assignedBus}
                      onChange={(event) => updateField('assignedBus', event.target.value)}
                    >
                      <option value="">-- No Bus Assigned --</option>
                      {buses.map((b) => (
                        <option key={b.id} value={`${b.registration} (${b.id})`}>
                          {b.registration} — {b.id} ({b.capacity})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Intermediate Stops (Enter each stop name)">
                  <div className="stop-list">
                    {(Array.isArray(formData.stops) ? formData.stops : ['']).map((stop, index) => (
                      <div key={index} className="stop-row">
                        <input
                          className="form-input"
                          value={stop}
                          onChange={(e) => {
                            const newStops = [...(Array.isArray(formData.stops) ? formData.stops : [])];
                            newStops[index] = e.target.value;
                            updateField('stops', newStops);
                          }}
                          placeholder={`Stop ${index + 1} Name (e.g. Peradeniya)`}
                        />
                        {Array.isArray(formData.stops) && formData.stops.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger stop-remove"
                            aria-label={`Remove stop ${index + 1}`}
                            onClick={() => {
                              const newStops = formData.stops.filter((_, i) => i !== index);
                              updateField('stops', newStops);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary stop-add"
                      onClick={() => {
                        const currentStops = Array.isArray(formData.stops) ? formData.stops : [];
                        updateField('stops', [...currentStops, '']);
                      }}
                    >
                      + Add Stop Name
                    </button>
                  </div>
                </Field>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Clean Delete Modal */}
      {confirmState.open && (
        <div className="overlay confirm-overlay" onClick={(event) => event.target === event.currentTarget && closeConfirm()}>
          <div className="clean-delete-box">
            <div className="clean-delete-icon-wrapper">
              <svg fill="none" viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="clean-delete-title">Delete Confirmation</h3>
            <p className="clean-delete-text">Are you sure you want to permanently remove this record from MongoDB?</p>
            <div className="clean-delete-target-badge">{confirmState.label}</div>
            <div className="clean-delete-actions">
              <button type="button" className="btn-cancel-soft" onClick={closeConfirm}>
                Cancel
              </button>
              <button type="button" className="btn-delete-confirm" onClick={handleDelete}>
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

function TableShell({ children }) {
  return <div className="panel table-shell">{children}</div>;
}

function KpiCard({ label, value, subtitle, icon, tint, vehicle }) {
  return (
    <div className={`kpi-card tint-${tint}`}>
      <Vehicle name={vehicle} width={150} className="kpi-art" label={`${vehicle} illustration`} />
      <div className="kpi-topline">
        <p>{label}</p>
        <span className="kpi-icon">
          <Icon type={icon} />
        </span>
      </div>
      <strong>{value}</strong>
      <span>{subtitle}</span>
    </div>
  );
}

function LegendItem({ color, label, value }) {
  return (
    <div className="legend-item">
      <span className={`legend-swatch ${color}`} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const className =
    status === 'Maintenance'
      ? 'badge badge-amber'
      : status === 'Active'
        ? 'badge badge-green'
        : 'badge badge-gray';

  return <span className={className}>{status}</span>;
}

function Icon({ type }) {
  const commonProps = {
    fill: 'none',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
  };

  switch (type) {
    case 'grid':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'drivers':
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'bus':
      return (
        <svg {...commonProps}>
          <rect x="1" y="6" width="22" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M5 19v2M19 19v2M1 11h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'route':
      return (
        <svg {...commonProps}>
          <path d="M3 6h18M3 12h12M3 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'sync':
      return (
        <svg {...commonProps}>
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...commonProps}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...commonProps}>
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'menu':
    default:
      return (
        <svg {...commonProps}>
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export default App;
