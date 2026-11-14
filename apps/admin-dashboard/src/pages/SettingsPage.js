import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { API_BASE, api, signOut } from '../api';
import { displayName, initials, roleLabel } from '../format';
import { setPreference, useThemePreference } from '../theme';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Settings: how the console looks, which server it talks to, who is signed in. Everything shown is real: the
// appearance choice is saved in this browser, the health line is read from the API.
export default function SettingsPage({ user, backendConnected, fetchBackendData, showNotification, setActivePage }) {
  const preference = useThemePreference();
  const [health, setHealth] = useState(null); // null = loading, false = unreachable
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await api('/health');
      setHealth(res.ok ? await res.json() : false);
    } catch {
      setHealth(false); // server unreachable
    }
    setChecking(false);
  };
  useEffect(() => { check(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const host = API_BASE.replace(/\/api$/, '');
  const index = THEME_OPTIONS.findIndex((o) => o.value === preference);

  return (
    <section className="page-section settings" data-page="settings">
      <PageHeader subtitle="Appearance, connection and your account. Changes here apply to this browser only." />

      <div className="settings-grid">
        <div className="panel">
          <div className="panel-head"><h2>Appearance</h2></div>
          <p className="setting-note">System follows your device. Light and dark stay as you set them.</p>
          <div className="segmented" role="radiogroup" aria-label="Colour mode" style={{ '--i': Math.max(0, index), '--n': THEME_OPTIONS.length }}>
            {THEME_OPTIONS.map((o) => (
              <button key={o.value} type="button" role="radio" aria-checked={preference === o.value} className={preference === o.value ? 'on' : ''} onClick={() => setPreference(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Connection</h2>
            <span className={`badge ${backendConnected ? 'badge-green' : 'badge-amber'}`}>{backendConnected ? 'Connected' : 'Not connected'}</span>
          </div>
          <ul className="kv">
            <li><span>Server</span><strong>{host}</strong></li>
            <li><span>Database</span><strong>{health === null ? 'Checking…' : health && health.mongo === 'connected' ? 'MongoDB connected' : 'Not reachable'}</strong></li>
            <li><span>Live cache</span><strong>{health ? (health.cache === 'redis' ? 'Redis' : 'In memory') : '—'}</strong></li>
            <li><span>Open sockets</span><strong>{health ? health.sockets : '—'}</strong></li>
          </ul>
          <div className="setting-actions">
            <button type="button" className="btn btn-secondary" disabled={checking} onClick={check}><Icon type="sync" />Check again</button>
            <button type="button" className="btn btn-secondary" onClick={() => { fetchBackendData(); showNotification('Refreshed data from MongoDB.'); }}>Reload data</button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Your account</h2></div>
          <div className="account-line">
            <span className="user-avatar big">{initials(user)}</span>
            <span>
              <strong>{displayName(user)}</strong>
              <small>@{user.username} · {roleLabel(user)}</small>
            </span>
          </div>
          <div className="setting-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setActivePage('admins')}><Icon type="lock" />Change password</button>
            <button type="button" className="btn btn-secondary" onClick={() => setActivePage('admins')}><Icon type="drivers" />Administrators</button>
          </div>
        </div>

        <div className="panel danger-panel">
          <div className="panel-head"><h2>Session</h2></div>
          <p className="setting-note">Signing out clears this browser's saved session. Your colour choice stays.</p>
          <div className="setting-actions">
            <button type="button" className="btn btn-danger-solid" onClick={() => signOut()}><Icon type="logout" />Sign out</button>
          </div>
        </div>
      </div>
    </section>
  );
}
