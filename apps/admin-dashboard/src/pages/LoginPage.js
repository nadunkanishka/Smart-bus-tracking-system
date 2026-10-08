import React from 'react';
import { RoadScene, Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';

export default function LoginPage({ loginError, handleLoginSubmit, loginCreds, setLoginCreds, showPw, setShowPw, loginLoading }) {
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
        <RoadScene scene="admin" className="login-scene" label="Buses on a two-lane road" />
      </section>

      <div className="login-card">
        <h2 className="login-title">Admin sign in</h2>
        <p className="login-subtitle">Manage your fleet, drivers and routes.</p>

        {loginError && <div className="login-error" role="alert">{loginError}</div>}

        <form onSubmit={handleLoginSubmit} className="login-form">
          <label className="field">
            <span className="form-label">Username</span>
            <span className="input-wrap">
              <Icon type="user" className="lead" />
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
              <Icon type="lock" className="lead" />
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
                <Icon type="eye" />
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
