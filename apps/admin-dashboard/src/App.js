import React, { useEffect, useMemo, useState } from 'react';
import './admin-theme.css';

const API_BASE = 'http://localhost:5000/api';

const initialDrivers = [
  {
    id: 'DRV-001',
    name: 'P. Jayawardena',
    license: 'LK-2019-47821',
    expiry: '2027-08-14',
    phone: '+94 77 123 4567',
    status: 'Active',
  },
  {
    id: 'DRV-002',
    name: 'S. Perera',
    license: 'LK-2021-88234',
    expiry: '2028-03-22',
    phone: '+94 71 987 6543',
    status: 'Active',
  },
  {
    id: 'DRV-003',
    name: 'S. Fernando',
    license: 'LK-2020-33012',
    expiry: '2026-09-30',
    phone: '+94 76 555 0012',
    status: 'Active',
  },
];

const initialBuses = [
  {
    id: 'BUS-001',
    registration: 'NB-4712',
    capacity: '52 seats',
    mileage: '148,320 km',
    rawCapacity: 52,
    rawMileage: 148320,
    status: 'Active',
  },
  {
    id: 'BUS-002',
    registration: 'KA-1234',
    capacity: '45 seats',
    mileage: '92,410 km',
    rawCapacity: 45,
    rawMileage: 92410,
    status: 'Active',
  },
  {
    id: 'BUS-003',
    registration: 'NE-2041',
    capacity: '52 seats',
    mileage: '220,104 km',
    rawCapacity: 52,
    rawMileage: 220104,
    status: 'Maintenance',
  },
];

const initialRoutes = [
  {
    id: 'RT-001',
    name: 'Colombo to Kandy',
    start: 'Colombo Fort',
    end: 'Kandy Bus Stand',
    distance: '110 km',
    rawDistance: 110,
    stops: ['Kadawatha', 'Nittambuwa', 'Kegalle', 'Peradeniya'],
    status: 'Active',
  },
  {
    id: 'RT-002',
    name: 'Kandy to Matale',
    start: 'Kandy Bus Stand',
    end: 'Matale Town',
    distance: '26 km',
    rawDistance: 26,
    stops: ['Katugastota', 'Akurana'],
    status: 'Active',
  },
];

const initialSummary = {
  activeRoutes: 14,
  registeredBuses: 26,
  activeDrivers: 32,
  fleetDistribution: {
    active: 22,
    idle: 4,
    maintenance: 5,
  },
};

const navItems = [
  { section: 'Main', key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { section: 'Fleet Management', key: 'drivers', label: 'Drivers', icon: 'drivers' },
  { section: 'Fleet Management', key: 'buses', label: 'Buses', icon: 'bus' },
  { section: 'Network & Operations', key: 'routes', label: 'Routes', icon: 'route' },
];

const modalDefaults = {
  driver: { name: '', license: '', expiry: '', phone: '' },
  bus: { registration: '', capacity: '', mileage: '' },
  route: { name: '', start: '', end: '', distance: '', stops: [''] },
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [clock, setClock] = useState('');
  const [notification, setNotification] = useState(null);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [buses, setBuses] = useState(initialBuses);
  const [routes, setRoutes] = useState(initialRoutes);
  const [summary, setSummary] = useState(initialSummary);
  const [backendConnected, setBackendConnected] = useState(false);
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
    label: '',
  });

  // Fetch MongoDB backend data on mount
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [resD, resB, resR] = await Promise.all([
          fetch(`${API_BASE}/drivers`),
          fetch(`${API_BASE}/buses`),
          fetch(`${API_BASE}/routes`),
        ]);

        let connected = false;

        if (resD.ok) {
          const dataD = await resD.json();
          if (Array.isArray(dataD) && dataD.length > 0) {
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
          if (Array.isArray(dataB) && dataB.length > 0) {
            setBuses(
              dataB.map((b) => ({
                id: b.busId || b._id || b.id,
                rawId: b._id,
                registration: b.registration,
                capacity: `${b.capacity} seats`,
                mileage: `${Number(b.mileage || 0).toLocaleString('en-US')} km`,
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
          if (Array.isArray(dataR) && dataR.length > 0) {
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
                status: r.status || 'Active',
              }))
            );
          }
          connected = true;
        }

        if (connected) {
          setBackendConnected(true);
        }
      } catch (err) {
        console.log('MongoDB API server offline. Defaulting to local UI state.');
      }
    };

    fetchBackendData();
  }, []);

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
    if (!notification) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        [driver.id, driver.name, driver.license, driver.phone]
          .join(' ')
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      ),
    [drivers, searchValue]
  );

  const filteredBuses = useMemo(
    () =>
      buses.filter((bus) =>
        [bus.id, bus.registration, bus.capacity, bus.status]
          .join(' ')
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      ),
    [buses, searchValue]
  );

  const filteredRoutes = useMemo(
    () =>
      routes.filter((route) => {
        const stopsStr = Array.isArray(route.stops) ? route.stops.join(' ') : String(route.stops);
        return [route.id, route.name, route.start, route.end, stopsStr]
          .join(' ')
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      }),
    [routes, searchValue]
  );

  const fleetTotal = Object.values(summary.fleetDistribution).reduce((total, value) => total + value, 0);
  const fleetChartStyle = {
    background: `conic-gradient(
      #0284c7 0deg ${(summary.fleetDistribution.active / fleetTotal) * 360}deg,
      #94a3b8 ${(summary.fleetDistribution.active / fleetTotal) * 360}deg ${((summary.fleetDistribution.active + summary.fleetDistribution.idle) / fleetTotal) * 360}deg,
      #f59e0b ${((summary.fleetDistribution.active + summary.fleetDistribution.idle) / fleetTotal) * 360}deg 360deg
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
        ? `driver ${record.name || record.id}`
        : entity === 'bus'
          ? `bus ${record.registration}`
          : `route ${record.name || record.id}`;

    setConfirmState({
      open: true,
      entity,
      id: record.id,
      rawId: record.rawId || record.id,
      label,
    });
  };

  const closeConfirm = () => {
    setConfirmState({ open: false, entity: 'driver', id: '', label: '' });
  };

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const updateSummaryCount = (entity, delta, record = null) => {
    setSummary((current) => {
      const next = { ...current, fleetDistribution: { ...current.fleetDistribution } };

      if (entity === 'driver') {
        next.activeDrivers += delta;
      }

      if (entity === 'route') {
        next.activeRoutes += delta;
      }

      if (entity === 'bus') {
        next.registeredBuses += delta;
        if (record?.status === 'Maintenance') {
          next.fleetDistribution.maintenance += delta;
        } else {
          next.fleetDistribution.active += delta;
        }
      }

      return next;
    });
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
          const res = await fetch(`${API_BASE}/drivers/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const saved = res.ok ? await res.json() : null;
          setDrivers((current) =>
            current.map((driver) =>
              driver.id === editId || driver.rawId === editId
                ? {
                    ...driver,
                    ...payload,
                    id: saved?.driverId || driver.id,
                    rawId: saved?._id || driver.rawId,
                  }
                : driver
            )
          );
          showNotification(`Driver ${payload.name} updated successfully.`);
        } else {
          const res = await fetch(`${API_BASE}/drivers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const saved = res.ok ? await res.json() : null;
          const newRec = {
            id: saved?.driverId || saved?._id || `DRV-${String(drivers.length + 1).padStart(3, '0')}`,
            rawId: saved?._id,
            ...payload,
          };
          setDrivers((current) => [newRec, ...current]);
          updateSummaryCount('driver', 1);
          showNotification(`Driver ${payload.name} added successfully.`);
        }
      } catch (err) {
        const newRec = {
          id: editId || `DRV-${String(drivers.length + 1).padStart(3, '0')}`,
          ...payload,
        };
        if (mode === 'edit') {
          setDrivers((current) => current.map((d) => (d.id === editId || d.rawId === editId ? newRec : d)));
        } else {
          setDrivers((current) => [newRec, ...current]);
          updateSummaryCount('driver', 1);
        }
        showNotification(`Driver ${payload.name} saved.`);
      }
    }

    if (entity === 'bus') {
      const payload = {
        registration: formData.registration || 'NB-0000',
        capacity: Number(formData.capacity || 50),
        mileage: Number(formData.mileage || 0),
        status: 'Active',
      };

      try {
        if (mode === 'edit') {
          const res = await fetch(`${API_BASE}/buses/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const saved = res.ok ? await res.json() : null;
          const formatted = {
            id: saved?.busId || editId,
            rawId: saved?._id,
            registration: payload.registration,
            capacity: `${payload.capacity} seats`,
            mileage: `${payload.mileage.toLocaleString('en-US')} km`,
            rawCapacity: payload.capacity,
            rawMileage: payload.mileage,
            status: payload.status,
          };
          setBuses((current) => current.map((bus) => (bus.id === editId || bus.rawId === editId ? formatted : bus)));
          showNotification(`Bus ${payload.registration} updated successfully.`);
        } else {
          const res = await fetch(`${API_BASE}/buses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const saved = res.ok ? await res.json() : null;
          const formatted = {
            id: saved?.busId || saved?._id || `BUS-${String(buses.length + 1).padStart(3, '0')}`,
            rawId: saved?._id,
            registration: payload.registration,
            capacity: `${payload.capacity} seats`,
            mileage: `${payload.mileage.toLocaleString('en-US')} km`,
            rawCapacity: payload.capacity,
            rawMileage: payload.mileage,
            status: payload.status,
          };
          setBuses((current) => [formatted, ...current]);
          updateSummaryCount('bus', 1, formatted);
          showNotification(`Bus ${payload.registration} registered successfully.`);
        }
      } catch (err) {
        const formatted = {
          id: editId || `BUS-${String(buses.length + 1).padStart(3, '0')}`,
          registration: payload.registration,
          capacity: `${payload.capacity} seats`,
          mileage: `${payload.mileage.toLocaleString('en-US')} km`,
          rawCapacity: payload.capacity,
          rawMileage: payload.mileage,
          status: payload.status,
        };
        if (mode === 'edit') {
          setBuses((current) => current.map((b) => (b.id === editId || b.rawId === editId ? formatted : b)));
        } else {
          setBuses((current) => [formatted, ...current]);
          updateSummaryCount('bus', 1, formatted);
        }
        showNotification(`Bus ${payload.registration} saved.`);
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
        status: 'Active',
      };

      try {
        if (mode === 'edit') {
          const res = await fetch(`${API_BASE}/routes/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const saved = res.ok ? await res.json() : null;
          const formatted = {
            id: saved?.routeId || editId,
            rawId: saved?._id,
            name: payload.name,
            start: payload.start,
            end: payload.end,
            distance: `${payload.distance} km`,
            rawDistance: payload.distance,
            stops: cleanStops,
            status: payload.status,
          };
          setRoutes((current) => current.map((route) => (route.id === editId || route.rawId === editId ? formatted : route)));
          showNotification(`Route ${payload.name} updated successfully.`);
        } else {
          const res = await fetch(`${API_BASE}/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const saved = res.ok ? await res.json() : null;
          const formatted = {
            id: saved?.routeId || saved?._id || `RT-${String(routes.length + 1).padStart(3, '0')}`,
            rawId: saved?._id,
            name: payload.name,
            start: payload.start,
            end: payload.end,
            distance: `${payload.distance} km`,
            rawDistance: payload.distance,
            stops: cleanStops,
            status: payload.status,
          };
          setRoutes((current) => [formatted, ...current]);
          updateSummaryCount('route', 1);
          showNotification(`Route ${payload.name} created successfully.`);
        }
      } catch (err) {
        const formatted = {
          id: editId || `RT-${String(routes.length + 1).padStart(3, '0')}`,
          name: payload.name,
          start: payload.start,
          end: payload.end,
          distance: `${payload.distance} km`,
          rawDistance: payload.distance,
          stops: cleanStops,
          status: payload.status,
        };
        if (mode === 'edit') {
          setRoutes((current) => current.map((r) => (r.id === editId || r.rawId === editId ? formatted : r)));
        } else {
          setRoutes((current) => [formatted, ...current]);
          updateSummaryCount('route', 1);
        }
        showNotification(`Route ${payload.name} saved.`);
      }
    }

    closeModal();
  };

  const handleDelete = async () => {
    const { entity, id, rawId } = confirmState;
    const targetId = rawId || id;

    try {
      await fetch(`${API_BASE}/${entity}s/${targetId}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Delete request API offline fallback');
    }

    if (entity === 'driver') {
      setDrivers((current) => current.filter((driver) => driver.id !== id && driver.rawId !== targetId));
      updateSummaryCount('driver', -1);
    }

    if (entity === 'bus') {
      const record = buses.find((bus) => bus.id === id || bus.rawId === targetId);
      setBuses((current) => current.filter((bus) => bus.id !== id && bus.rawId !== targetId));
      if (record) {
        updateSummaryCount('bus', -1, record);
      }
    }

    if (entity === 'route') {
      setRoutes((current) => current.filter((route) => route.id !== id && route.rawId !== targetId));
      updateSummaryCount('route', -1);
    }

    showNotification('Record deleted successfully.');
    closeConfirm();
  };

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
            <Icon type="menu" />
          </div>
          <div className="brand-copy">
            <p className="brand-title">SRMSS</p>
            <p className="brand-subtitle">Admin Operations</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {['Main', 'Fleet Management', 'Network & Operations'].map((section) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {navItems
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
          <p className="sidebar-depot-title">Central Command Depot</p>
          <p className="sidebar-depot-copy">22 buses active, 4 in depot</p>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">AD</div>
          <div className="sidebar-user-copy">
            <p className="sidebar-user-name">Admin Console</p>
            <p className="sidebar-user-role">
              Role: <span>Super Admin</span>
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

            <div className="search-box">
              <span className="search-icon">
                <Icon type="search" />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search routes, buses, drivers…"
                className="form-input search-input"
              />
            </div>
          </div>

          <div className="header-right">
            <span className="header-clock">{clock}</span>
            <span className="system-status">
              <span className="system-status-dot" style={{ backgroundColor: backendConnected ? '#10b981' : '#f59e0b' }} />
              {backendConnected ? 'MongoDB Connected' : 'System online'}
            </span>
            <button
              type="button"
              className="btn btn-secondary header-profile-btn"
              onClick={() => showNotification('Admin session active.')}
            >
              Admin Profile
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
                  <h1>{currentPageTitle}</h1>
                  <p>Overview synchronized with Driver & Passenger Apps</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary sync-btn"
                  onClick={() => showNotification('Admin data synchronized across driver and passenger nodes.')}
                >
                  <Icon type="sync" />
                  Sync System
                </button>
              </div>

              <div className="kpi-grid">
                <KpiCard
                  label="Active Routes"
                  value={summary.activeRoutes}
                  subtitle="Live on Passenger App"
                  icon="route"
                />
                <KpiCard
                  label="Registered Buses"
                  value={summary.registeredBuses}
                  subtitle={`${summary.fleetDistribution.active} Active / ${summary.fleetDistribution.idle} Maintenance`}
                  icon="bus"
                />
                <KpiCard
                  label="Active Drivers"
                  value={summary.activeDrivers}
                  subtitle="Driver App Connected"
                  icon="drivers"
                />
              </div>

              <div className="dashboard-grid">
                <div className="panel chart-panel">
                  <h2>Fleet Status Distribution</h2>
                  <div className="chart-layout">
                    <div className="fleet-chart-shell">
                      <div className="fleet-chart" style={fleetChartStyle}>
                        <div className="fleet-chart-inner">
                          <span>{fleetTotal}</span>
                          <small>Buses</small>
                        </div>
                      </div>
                    </div>

                    <div className="chart-legend">
                      <LegendItem
                        color="sky"
                        label="Active Fleet"
                        value={`${summary.fleetDistribution.active} buses`}
                      />
                      <LegendItem
                        color="slate"
                        label="Idle / Depot"
                        value={`${summary.fleetDistribution.idle} buses`}
                      />
                      <LegendItem
                        color="amber"
                        label="Under Maintenance"
                        value={`${summary.fleetDistribution.maintenance} buses`}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel quick-panel">
                  <div>
                    <h2>Quick Management</h2>
                    <p>Direct shortcuts to add assets & update routes</p>
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
                    Theme matched with Driver UI & Passenger Booking Interface
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
                  <p>Register drivers and assign Driver App authorization</p>
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
                    {filteredDrivers.map((driver) => (
                      <tr key={driver.id}>
                        <td className="mono-cell">{String(driver.id).slice(-8)}</td>
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
                    ))}
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
                  <p>Register new transit buses into the central system</p>
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
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuses.map((bus) => (
                      <tr key={bus.id}>
                        <td className="mono-cell">{String(bus.id).slice(-8)}</td>
                        <td className="mono-cell table-strong">{bus.registration}</td>
                        <td>{bus.capacity}</td>
                        <td>{bus.mileage}</td>
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
                    ))}
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
                  <p>Setup network paths for Passenger App display</p>
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
                      <th>Start Terminal</th>
                      <th>End Terminal</th>
                      <th>Distance</th>
                      <th>Intermediate Stops</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((route) => (
                      <tr key={route.id}>
                        <td className="mono-cell">{String(route.id).slice(-8)}</td>
                        <td className="table-strong">{route.name}</td>
                        <td>{route.start}</td>
                        <td>{route.end}</td>
                        <td>{route.distance}</td>
                        <td>
                          {Array.isArray(route.stops) ? (
                            route.stops.length > 0 ? (
                              <div>
                                <span style={{ fontWeight: 600 }}>{route.stops.length} stop{route.stops.length > 1 ? 's' : ''}</span>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {route.stops.join(' → ')}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Direct Route</span>
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
                    ))}
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
                <Field label="Distance (km) *">
                  <input
                    type="number"
                    className="form-input"
                    value={formData.distance}
                    onChange={(event) => updateField('distance', event.target.value)}
                    placeholder="120"
                  />
                </Field>

                <Field label="Intermediate Stops (Enter each stop name)">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {(Array.isArray(formData.stops) ? formData.stops : ['']).map((stop, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                            className="btn btn-danger"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
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
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '13px', padding: '6px 14px' }}
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
                {modalState.entity === 'route'
                  ? modalState.mode === 'edit'
                    ? 'Save Route'
                    : 'Create Route'
                  : modalState.entity === 'bus'
                    ? modalState.mode === 'edit'
                      ? 'Save Bus'
                      : 'Save Bus'
                    : modalState.mode === 'edit'
                      ? 'Save Driver'
                      : 'Save Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState.open && (
        <div className="overlay confirm-overlay" onClick={(event) => event.target === event.currentTarget && closeConfirm()}>
          <div className="confirm-box">
            <div className="confirm-icon">
              <Icon type="trash" />
            </div>
            <h3>Confirm Delete</h3>
            <p className="confirm-copy">You are about to delete</p>
            <p className="confirm-target">{confirmState.label}</p>
            <p className="confirm-danger-text">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={closeConfirm}>
                Cancel
              </button>
              <button type="button" className="btn btn-delete-primary" onClick={handleDelete}>
                Delete
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

function KpiCard({ label, value, subtitle, icon }) {
  return (
    <div className="kpi-card">
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
    case 'search':
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
