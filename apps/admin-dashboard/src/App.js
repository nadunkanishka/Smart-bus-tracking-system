import React, { useEffect, useState } from 'react';
import './design/tokens.css'; // CHANGED: shared design tokens
import './styles/admin-theme.css';
import { API_BASE, api, setAuthToken } from './api';
import { useAdminData } from './hooks/useAdminData';
import { useEntityModal } from './hooks/useEntityModal';
import Icon from './components/Icon';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EntityModal from './components/EntityModal';
import ConfirmDialog from './components/ConfirmDialog';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DriversPage from './pages/DriversPage';
import BusesPage from './pages/BusesPage';
import RoutesPage from './pages/RoutesPage';
import LiveMonitor from './pages/LiveMonitor';
import Analytics from './pages/Analytics';

// Root component: sign-in state, the page shell and the switch between pages.
function App() {
  // Auth State
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('adminUser') || 'null');
    } catch {
      return null;
    }
  });
  setAuthToken(user?.token || '');
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPw, setShowPw] = useState(false); // CHANGED (UI-only): show/hide password toggle

  // App UI State
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clock, setClock] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => setNotification(message);

  // Data Collections (real data from MongoDB)
  const { drivers, buses, routes, summary, backendConnected, fetchBackendData } = useAdminData({
    user,
    // Session expired or signed in before tokens existed: ask the admin to sign in again.
    onSessionExpired: () => {
      handleLogout();
      setLoginError('Your session has expired. Please sign in again.');
    },
  });

  // Modal & Confirm dialogs
  const {
    modalState, formData, setFormData, confirmState, openModal, closeModal, openConfirm, closeConfirm, updateField, handleSave, handleDelete,
  } = useEntityModal({ showNotification, fetchBackendData });

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

      const signedIn = { ...data.user, token: data.token };
      setUser(signedIn);
      sessionStorage.setItem('adminUser', JSON.stringify(signedIn));
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

  // If not logged in, render Login View
  if (!user) {
    return (
      <LoginPage
        loginError={loginError}
        handleLoginSubmit={handleLoginSubmit}
        loginCreds={loginCreds}
        setLoginCreds={setLoginCreds}
        showPw={showPw}
        setShowPw={setShowPw}
        loginLoading={loginLoading}
      />
    );
  }

  const currentPageTitle =
    activePage === 'dashboard'
      ? 'System Admin Dashboard'
      : activePage === 'live'
        ? 'Live Monitor'
        : activePage === 'analytics'
          ? 'Trip Analytics'
      : activePage === 'drivers'
        ? 'Driver Management'
        : activePage === 'buses'
          ? 'Bus & Fleet Inventory'
          : 'Create & Manage Routes';

  return (
    <div className="admin-shell">
      <Sidebar activePage={activePage} setActivePage={setActivePage} sidebarCollapsed={sidebarCollapsed} summary={summary} user={user} />

      <div className="main-panel">
        <Header
          currentPageTitle={currentPageTitle}
          clock={clock}
          backendConnected={backendConnected}
          handleLogout={handleLogout}
          user={user}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        {notification && (
          <div className="notification-banner" role="alert">
            <div className="notification-card">
              <p className="notification-text">{notification}</p>
              <button type="button" className="notification-close" onClick={() => setNotification(null)} aria-label="Dismiss">
                <Icon type="close" />
              </button>
            </div>
          </div>
        )}

        <main className="page-scroll">
          {activePage === 'dashboard' && <DashboardPage summary={summary} fetchBackendData={fetchBackendData} showNotification={showNotification} openModal={openModal} />}

          {activePage === 'live' && <LiveMonitor api={api} routes={routes} />}
          {activePage === 'analytics' && <Analytics api={api} routes={routes} />}

          {activePage === 'drivers' && <DriversPage currentPageTitle={currentPageTitle} drivers={drivers} openModal={openModal} openConfirm={openConfirm} />}

          {activePage === 'buses' && <BusesPage currentPageTitle={currentPageTitle} buses={buses} drivers={drivers} openModal={openModal} openConfirm={openConfirm} />}

          {activePage === 'routes' && <RoutesPage currentPageTitle={currentPageTitle} routes={routes} openModal={openModal} openConfirm={openConfirm} />}
        </main>
      </div>

      {modalState.open && (
        <EntityModal
          modalState={modalState}
          formData={formData}
          updateField={updateField}
          setFormData={setFormData}
          closeModal={closeModal}
          handleSave={handleSave}
          drivers={drivers}
          buses={buses}
        />
      )}

      {confirmState.open && <ConfirmDialog confirmState={confirmState} closeConfirm={closeConfirm} handleDelete={handleDelete} />}
    </div>
  );
}

export default App;
