import React, { useEffect, useState } from 'react';
import './design/tokens.css';
import './styles/admin-theme.css';
import { getSession, onSignOut } from './api';
import { recordLabel } from './entities';
import { useAdminData } from './hooks/useAdminData';
import { useEntityModal } from './hooks/useEntityModal';
import { PAGES, SECTIONS } from './pages';
import Icon from './components/Icon';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EntityModal from './components/EntityModal';
import ConfirmDialog from './components/ConfirmDialog';
import { CurrentPage } from './components/PageHeader';
import LoginPage from './pages/LoginPage';

// Root: the sign-in page until an admin is signed in, then the console. Any sign-out (button or rejected token) returns here.
function App() {
  const [user, setUser] = useState(getSession);
  useEffect(() => onSignOut(() => setUser(null)), []);
  return user ? <Console user={user} /> : <LoginPage onLoggedIn={setUser} />;
}

// The console shell: sidebar, header, notification banner, the current page, and the driver/bus/route dialogs.
function Console({ user }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // rail: icons only, the header button expands it
  const [notification, showNotification] = useState(null);

  const data = useAdminData();
  const records = useEntityModal({ showNotification, fetchBackendData: data.fetchBackendData });
  const { modal, confirm } = records;

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => showNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const page = PAGES.find((p) => p.key === activePage);
  const Page = page.component;

  return (
    <div className="admin-shell">
      <Sidebar pages={PAGES} sections={SECTIONS} activePage={activePage} setActivePage={setActivePage} sidebarCollapsed={sidebarCollapsed} />

      <div className="main-panel">
        <Header title={page.title} backendConnected={data.backendConnected} user={user} onToggleSidebar={() => setSidebarCollapsed((c) => !c)} />

        {notification && (
          <div className="notification-banner" role="alert">
            <div className="notification-card">
              <p className="notification-text">{notification}</p>
              <button type="button" className="notification-close" onClick={() => showNotification(null)} aria-label="Dismiss">
                <Icon type="close" />
              </button>
            </div>
          </div>
        )}

        <main className={`page-scroll ${page.fit ? 'fit' : ''}`}>
          <CurrentPage.Provider value={page}>
            <Page
              user={user}
              {...data}
              openModal={records.openModal}
              openConfirm={records.openConfirm}
              showNotification={showNotification}
              setActivePage={setActivePage}
            />
          </CurrentPage.Provider>
        </main>
      </div>

      {modal.open && (
        <EntityModal
          modal={modal}
          formData={records.formData}
          updateField={records.updateField}
          setFormData={records.setFormData}
          closeModal={records.closeModal}
          handleSave={records.handleSave}
          drivers={data.drivers}
          buses={data.buses}
        />
      )}

      {confirm && (
        <ConfirmDialog
          text="Are you sure you want to permanently remove this record from MongoDB?"
          target={recordLabel(confirm.entity, confirm.record, ': ')}
          onConfirm={records.handleDelete}
          onCancel={records.closeConfirm}
        />
      )}
    </div>
  );
}

export default App;
