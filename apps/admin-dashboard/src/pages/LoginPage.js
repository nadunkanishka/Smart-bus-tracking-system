import React, { useState } from 'react';
import { RoadScene, Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import ThemeToggle from '../components/ThemeToggle';
import { getSignOutNotice, login } from '../api';

// The sign-in form. It owns its fields; on success it hands the signed-in user to onLoggedIn.
export default function LoginPage({ onLoggedIn }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState(getSignOutNotice); // e.g. "Your session has expired" after an automatic sign-out
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(creds);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <ThemeToggle className="login-theme" />
        <div>
          <div className="login-brand">
            <span className="login-brand-icon"><Vehicle name="bus" width={36} label="SmartBus logo" /></span>
            SmartBus Console
          </div>
          <span className="login-tagline">Fleet, drivers and routes in one place</span>
        </div>
        <RoadScene scene="admin" className="login-scene" label="Buses on a two-lane road" />
      </section>

      <div className="login-card">
        <h2 className="login-title">Admin sign in</h2>
        <p className="login-subtitle">Manage your fleet, drivers and routes.</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span className="form-label">Username</span>
            <span className="input-wrap">
              <Icon type="user" className="lead" />
              <input
                type="text"
                className="form-input"
                value={creds.username}
                onChange={(e) => setCreds({ ...creds, username: e.target.value })}
                placeholder="Enter admin username"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="form-label">Password</span>
            <span className="input-wrap">
              <Icon type="lock" className="lead" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                value={creds.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button type="button" className="toggle-pw" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                <Icon type="eye" />
              </button>
            </span>
          </label>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (<><span className="spinner" aria-hidden="true" />Signing In…</>) : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* The development default is only shown while developing; a deployed site must not advertise a password. */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="login-hint">
            Default credentials: <code>admin</code> / <code>admin123</code>
          </div>
        )}
      </div>
    </div>
  );
}
