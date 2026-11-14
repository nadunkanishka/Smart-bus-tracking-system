import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../shared/api';
import { SESSION_KEY } from '../constants';

// Passenger account: the remembered session ({ token, user }), the login and register form fields, and the calls
// that sign in. handleLogin and handleRegister resolve to a welcome message once a session started (null otherwise),
// so the caller decides what happens next.
export function useAuth() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regTerms, setRegTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Restore a remembered session
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => { if (raw) setSession(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  function startSession(data) {
    const next = { token: data.token, user: data.user };
    setSession(next);
    if (rememberMe) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)).catch(() => {});
    setLoginPassword('');
    setRegPassword('');
    setRegConfirm('');
  }

  async function handleLogin() {
    setAuthError('');
    if (!loginUsername.trim() || !loginPassword) {
      setAuthError('Enter your username and password.');
      return null;
    }
    setAuthLoading(true);
    try {
      const data = await request('/passengers/login', { method: 'POST', body: { username: loginUsername.trim(), password: loginPassword } });
      startSession(data);
      return `Welcome back, ${data.user.name}!`;
    } catch (err) {
      setAuthError(err.message);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister() {
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await request('/passengers/register', {
        method: 'POST',
        body: { name: regFullName.trim(), username: regUsername.trim(), phone: regPhone.trim(), password: regPassword },
      });
      startSession(data);
      return `Account created! Welcome, ${data.user.name}.`;
    } catch (err) {
      setAuthError(err.message);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }

  function signOut() {
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    setSession(null);
  }

  // Account management for the signed-in passenger. Each throws Error(message) so the caller can show it.
  async function updateProfile({ name, phone }) {
    const data = await request('/passengers/me', { method: 'PUT', body: { name, phone }, token: session.token });
    const next = { ...session, user: data.user };
    setSession(next);
    // only refresh the stored copy when the passenger chose to be remembered
    AsyncStorage.getItem(SESSION_KEY).then((raw) => { if (raw) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)); }).catch(() => {});
  }

  async function changePassword(currentPassword, newPassword) {
    await request('/passengers/me/password', { method: 'PUT', body: { currentPassword, newPassword }, token: session.token });
  }

  async function deleteAccount(password) {
    await request('/passengers/me', { method: 'DELETE', body: { password }, token: session.token });
    signOut();
  }

  function switchAuthMode(mode) {
    setAuthError('');
    setAuthMode(mode);
  }

  const confirmMismatch = regConfirm.length > 0 && regConfirm !== regPassword;
  const passwordTooShort = regPassword.length > 0 && regPassword.length < 6;
  const registerBlocked = confirmMismatch || !regTerms || !regFullName.trim() || !regUsername.trim() || regPassword.length < 6 || regConfirm !== regPassword;

  return {
    booting,
    session,
    signOut,
    updateProfile,
    changePassword,
    deleteAccount,
    // Everything <AuthScreen> needs, except showToast (App wraps handleLogin and handleRegister to act on the result).
    form: {
      authMode, switchAuthMode, authError, authLoading,
      loginUsername, setLoginUsername, loginPassword, setLoginPassword, rememberMe, setRememberMe, handleLogin,
      regFullName, setRegFullName, regUsername, setRegUsername, regPhone, setRegPhone, regPassword, setRegPassword,
      regConfirm, setRegConfirm, regTerms, setRegTerms, passwordTooShort, confirmMismatch, registerBlocked, handleRegister,
    },
  };
}
