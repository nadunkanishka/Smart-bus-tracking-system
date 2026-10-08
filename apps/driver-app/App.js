import React, { useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, View } from 'react-native';
import { request, toRoute } from './src/shared/api';
import * as telemetry from './src/services/telemetry';
import { Toast } from './src/shared/ui';
import { MAX_LOG_ITEMS } from './src/constants';
import { formatCoord } from './src/utils';
import { LoginScreen } from './src/screens/LoginScreen';
import { DispatchModal } from './src/components/DispatchModal';
import { ShiftScreen } from './src/screens/ShiftScreen';
import { RouteScreen } from './src/screens/RouteScreen';
import { DiagnosticsScreen } from './src/screens/DiagnosticsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DriverDock } from './src/components/DriverDock';
import { D } from './src/styles/app';

export default function App() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [busRegistration, setBusRegistration] = useState('');
  const [busPassword, setBusPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [authenticatedBus, setAuthenticatedBus] = useState(null);
  const [assignedRoute, setAssignedRoute] = useState(null);
  const [driverName, setDriverName] = useState(null);

  // Navigation
  const [activeTab, setActiveTab] = useState('shift'); // 'shift' | 'route' | 'diagnostics' | 'profile'

  // Live telemetry state (connection, duty, offline queue, last GPS fix) comes from src/services/telemetry.js
  const [tele, setTele] = useState({ connected: false, onDuty: false, queued: 0, sent: 0, lastFix: null, nextStopIndex: null, mode: null, error: null });
  const [dutyBusy, setDutyBusy] = useState(false);
  const [logs, setLogs] = useState([]);

  // UI
  const [toastMsg, setToastMsg] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState('call'); // 'call' | 'message'

  // ─── Derived ──────────────────────────────────────────────────────────────
  const route = useMemo(() => toRoute(assignedRoute), [assignedRoute]);
  const isOnShift = tele.onDuty;
  const routeStops = route?.stops || [];
  const routeNumber = route ? route.shortName : 'No route assigned';
  const routeLabel = route ? `${route.startTerminal} ➔ ${route.endTerminal}` : 'Ask the admin to assign this bus to a route';
  const currentStopIndex = tele.nextStopIndex ?? 0;
  const busSpeed = tele.lastFix ? Math.round(tele.lastFix.speed * 3.6) : 0;
  const gpsStatus = !tele.onDuty ? 'Disconnected' : tele.lastFix ? 'Connected' : 'Searching';
  const lastTs = tele.lastFix?.ts;
  const busMarkers = useMemo(
    () => (tele.lastFix ? [{ id: 'me', lat: tele.lastFix.lat, lng: tele.lastFix.lng, label: 'This bus' }] : []),
    [lastTs], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => telemetry.subscribe(setTele), []);

  // GPS transmission log: one line per captured fix
  useEffect(() => {
    if (!tele.lastFix) return;
    const f = tele.lastFix;
    appendLog(`${tele.connected ? 'Sent' : 'Buffered'}: ${formatCoord(f.lat)}, ${formatCoord(f.lng)} | ${Math.round(f.speed * 3.6)} km/h`);
  }, [lastTs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function appendLog(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${ts}] ${msg}`, ...prev].slice(0, MAX_LOG_ITEMS));
  }

  function showToast(msg) { setToastMsg(msg); }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleLogin() {
    setLoginError('');
    if (!busRegistration.trim() || !busPassword.trim()) {
      setLoginError('Bus registration number and password are required.');
      return;
    }
    setLoginLoading(true);
    try {
      const data = await request('/auth/driver-login', {
        method: 'POST',
        body: { registration: busRegistration.trim(), password: busPassword.trim() },
      });
      setAuthenticatedBus(data.bus);
      setAssignedRoute(data.assignedRoute);
      setDriverName(data.driver?.name || null);
      await telemetry.connect(data.token);
      setIsAuthenticated(true);
      setActiveTab('shift');
      appendLog(`Signed in: ${data.bus?.registration || busRegistration}.`);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await telemetry.disconnect();
    setIsAuthenticated(false);
    setActiveTab('shift');
    setLogs([]);
    setBusPassword('');
  }

  async function handleToggleShift() {
    if (dutyBusy) return;
    setDutyBusy(true);
    try {
      if (tele.onDuty) {
        await telemetry.stopDuty();
        appendLog('Off duty. Location sharing stopped.');
        showToast('Off duty. Location sharing stopped.');
      } else {
        await telemetry.startDuty();
        appendLog('On duty. Broadcasting live location.');
        showToast('On duty. Broadcasting live location.');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setDutyBusy(false);
    }
  }

  function openDispatch(mode) {
    setDispatchMode(mode);
    setIsDispatchModalOpen(true);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={D.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {/* Toast */}
      <Toast message={toastMsg} />

      {/* ═══════════════════════════════════════════════════
          AUTH SCREEN  (CHANGED: hero + curved panel; split layout on desktop)
          No Register screen: bus accounts are created by the admin dashboard.
      ═══════════════════════════════════════════════════ */}
      {!isAuthenticated ? (
        <LoginScreen
          loginError={loginError}
          busRegistration={busRegistration}
          setBusRegistration={setBusRegistration}
          busPassword={busPassword}
          setBusPassword={setBusPassword}
          handleLogin={handleLogin}
          loginLoading={loginLoading}
        />
      ) : (
        /* ═══════════════════════════════════════════════════
            AUTHENTICATED APP  (CHANGED: centred, width-constrained on desktop)
        ═══════════════════════════════════════════════════ */
        <View style={D.appShell}>
          {/* ─── SCREENS ───────────────────────────────── */}
          <View style={D.flex}>
          {activeTab === 'shift' ? (
            <ShiftScreen
              isOnShift={isOnShift}
              busy={dutyBusy}
              hasRoute={!!route?.trackable}
              busRegistration={authenticatedBus?.registration || busRegistration}
              driverName={driverName}
              routeLabel={routeLabel}
              routeNumber={routeNumber}
              nextStop={routeStops[currentStopIndex]}
              busSpeed={busSpeed}
              gpsStatus={gpsStatus}
              connected={tele.connected}
              queued={tele.queued}
              mode={tele.mode}
              onToggleShift={handleToggleShift}
            />
          ) : activeTab === 'route' ? (
            <RouteScreen
              route={route}
              busMarkers={busMarkers}
              routeNumber={routeNumber}
              routeLabel={routeLabel}
              routeStops={routeStops}
              currentStopIndex={currentStopIndex}
              isOnShift={isOnShift}
            />
          ) : activeTab === 'diagnostics' ? (
            <DiagnosticsScreen
              busSpeed={busSpeed}
              gpsStatus={gpsStatus}
              driverCoordinate={tele.lastFix ? { latitude: tele.lastFix.lat, longitude: tele.lastFix.lng } : null}
              logs={logs}
              isOnShift={isOnShift}
            />
          ) : (
            <ProfileScreen
              busRegistration={authenticatedBus?.registration || busRegistration}
              driverName={driverName}
              routeNumber={routeNumber}
              routeLabel={routeLabel}
              isOnShift={isOnShift}
              onLogout={handleLogout}
              onOpenDispatch={openDispatch}
            />
          )}

          </View>

          {/* ─── BOTTOM DOCK ─────────────────────────── */}
          <DriverDock
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOnShift={isOnShift}
          />

          {/* ─── DISPATCH CONTACT MODAL ───────────────── */}
          <DispatchModal
            isDispatchModalOpen={isDispatchModalOpen}
            setIsDispatchModalOpen={setIsDispatchModalOpen}
            dispatchMode={dispatchMode}
            setDispatchMode={setDispatchMode}
            showToast={showToast}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
