import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { API_URL, request, toRoute } from './src/shared/api';
import { Toast, VehicleLoader } from './src/shared/ui';
import { SESSION_KEY, STALE_MS, GONE_MS, NO_ROUTE } from './src/constants';
import { pickBus } from './src/utils';
import { AuthScreen } from './src/screens/AuthScreen';
import { StopSelectorModal } from './src/components/StopSelectorModal';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RoutesScreen } from './src/screens/RoutesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BottomDock } from './src/components/BottomDock';
import { S } from './src/styles/app';

// 'home' | 'tracking' | 'routes' | 'profile'
export default function App() {
  // Account session ({ token, user }) from the backend
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

  // Navigation
  const [activeTab, setActiveTab] = useState('tracking');
  const [isBoardingExpanded, setIsBoardingExpanded] = useState(false);
  const [isDestExpanded, setIsDestExpanded] = useState(false);

  // Routes (from the backend) and stop selection
  const [routes, setRoutes] = useState([]);
  const [routesState, setRoutesState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [boardingStop, setBoardingStop] = useState(null);
  const [destinationStop, setDestinationStop] = useState(null);

  // UI overlays
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isBoardingOpen, setIsBoardingOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Live data pushed over Socket.IO for the selected route
  const [buses, setBuses] = useState({}); // busId -> last update (+ recvAt)
  const [conn, setConn] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef(null);

  const isAuthenticated = !!session;
  const userProfile = session?.user;

  // ─── Derived ────────────────────────────────────────────────────────────────
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || NO_ROUTE;

  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return routes;
    const q = routeSearchQuery.toLowerCase();
    return routes.filter((r) => String(r.number).toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.stops.some((s) => s.toLowerCase().includes(q)));
  }, [routeSearchQuery, routes]);

  const boardingIndex = selectedRoute.stops.indexOf(boardingStop);
  const destinationIndex = selectedRoute.stops.indexOf(destinationStop);

  const liveBuses = useMemo(
    () => Object.values(buses)
      .filter((b) => b.routeId === selectedRoute.id && now - b.recvAt < GONE_MS)
      .map((b) => ({ ...b, stale: now - b.recvAt > STALE_MS })),
    [buses, now, selectedRoute.id],
  );
  const tracked = useMemo(() => pickBus(liveBuses, boardingIndex, destinationIndex), [liveBuses, boardingIndex, destinationIndex]);
  const mapBuses = useMemo(
    () => liveBuses.map((b) => ({ id: b.busId, lat: b.lat, lng: b.lng, label: b.registration, stale: b.stale, heading: b.heading })),
    [liveBuses],
  );

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Restore a remembered session
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => { if (raw) setSession(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  // Load routes once signed in
  useEffect(() => { if (session) loadRoutes(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // One socket per session
  useEffect(() => {
    if (!session) return undefined;
    const socket = io(API_URL, { auth: { token: session.token }, transports: ['websocket'] });
    socketRef.current = socket;
    setConn('connecting');
    socket.on('connect', () => setConn('connected'));
    socket.on('disconnect', () => setConn('disconnected'));
    socket.on('connect_error', () => setConn('disconnected'));
    socket.on('route:snapshot', ({ buses: list, serverTs }) => {
      // Cached fixes may already be a while old: keep their real age so stale buses are flagged straight away.
      const at = Date.now();
      setBuses(Object.fromEntries(list.map((b) => [b.busId, { ...b, recvAt: at - Math.max(0, serverTs - b.serverEmitTs) }])));
    });
    socket.on('bus:update', (b) => setBuses((prev) => ({ ...prev, [b.busId]: { ...b, recvAt: Date.now() } })));
    socket.on('bus:offline', ({ busId }) => setBuses((prev) => {
      const next = { ...prev };
      delete next[busId];
      return next;
    }));
    return () => { socket.close(); socketRef.current = null; };
  }, [session]);

  // Join the selected route's room (the server leaves the previous one), also after every reconnect
  useEffect(() => {
    if (conn !== 'connected' || !selectedRouteId) return;
    setBuses({});
    socketRef.current?.emit('route:subscribe', { routeId: selectedRouteId });
  }, [selectedRouteId, conn]);

  // Clock for "signal lost" / removal of buses that stopped reporting
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function selectRoute(route) {
    setSelectedRouteId(route.id);
    setBoardingStop(route.stops[0] || null);
    setDestinationStop(route.stops[route.stops.length - 1] || null);
  }

  async function loadRoutes() {
    setRoutesState('loading');
    try {
      const list = (await request('/routes')).filter((r) => r.status === 'Active').map(toRoute);
      setRoutes(list);
      setRoutesState('ready');
      if (!list.some((r) => r.id === selectedRouteId) && list.length) selectRoute(list.find((r) => r.trackable) || list[0]);
    } catch (err) {
      setRoutesState('error');
      showToast(err.message);
    }
  }

  function startSession(data, message) {
    const next = { token: data.token, user: data.user };
    setSession(next);
    if (rememberMe) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)).catch(() => {});
    setLoginPassword('');
    setRegPassword('');
    setRegConfirm('');
    setActiveTab('tracking');
    showToast(message);
  }

  async function handleLogin() {
    setAuthError('');
    if (!loginUsername.trim() || !loginPassword) {
      setAuthError('Enter your username and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const data = await request('/passengers/login', { method: 'POST', body: { username: loginUsername.trim(), password: loginPassword } });
      startSession(data, `Welcome back, ${data.user.name}!`);
    } catch (err) {
      setAuthError(err.message);
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
      startSession(data, `Account created! Welcome, ${data.user.name}.`);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    setSession(null);
    setBuses({});
    setActiveTab('tracking');
  }

  function handleSelectRoute(route) {
    selectRoute(route);
    setRouteSearchQuery('');
    setActiveTab('tracking');
  }

  function handleResetDefaults() {
    setBoardingStop(selectedRoute.stops[0] || null);
    setDestinationStop(selectedRoute.stops[selectedRoute.stops.length - 1] || null);
    showToast('Reset stops to route terminals.');
  }

  function showToast(msg) {
    setToastMsg(msg);
  }

  function switchAuthMode(mode) {
    setAuthError('');
    setAuthMode(mode);
  }

  const confirmMismatch = regConfirm.length > 0 && regConfirm !== regPassword;
  const passwordTooShort = regPassword.length > 0 && regPassword.length < 6;
  const registerBlocked = confirmMismatch || !regTerms || !regFullName.trim() || !regUsername.trim() || regPassword.length < 6 || regConfirm !== regPassword;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {/* ─── Toast ─────────────────────────────────────── */}
      <Toast message={toastMsg} />

      {booting ? (
        <View style={S.centerFill}><VehicleLoader label="Loading SmartBus" /></View>
      ) : !isAuthenticated ? (
        /* ═══════════════════════════════════════════════════
            PASSENGER LOGIN / REGISTER (real accounts stored in MongoDB)
        ═══════════════════════════════════════════════════ */
        <AuthScreen
          authMode={authMode}
          switchAuthMode={switchAuthMode}
          authError={authError}
          authLoading={authLoading}
          showToast={showToast}
          loginUsername={loginUsername}
          setLoginUsername={setLoginUsername}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          handleLogin={handleLogin}
          regFullName={regFullName}
          setRegFullName={setRegFullName}
          regUsername={regUsername}
          setRegUsername={setRegUsername}
          regPhone={regPhone}
          setRegPhone={setRegPhone}
          regPassword={regPassword}
          setRegPassword={setRegPassword}
          regConfirm={regConfirm}
          setRegConfirm={setRegConfirm}
          regTerms={regTerms}
          setRegTerms={setRegTerms}
          passwordTooShort={passwordTooShort}
          confirmMismatch={confirmMismatch}
          registerBlocked={registerBlocked}
          handleRegister={handleRegister}
        />
      ) : (
        /* ═══════════════════════════════════════════════════
            APPLICATION SHELL
        ═══════════════════════════════════════════════════ */
        <View style={S.appShell}>
          {/* ─── SCREEN AREA ──────────────────────────── */}
          <View style={S.flex}>
            {activeTab === 'tracking' ? (
              <TrackingScreen
                conn={conn}
                routesState={routesState}
                tracked={tracked}
                liveCount={liveBuses.length}
                mapBuses={mapBuses}
                selectedRoute={selectedRoute}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                boardingIndex={boardingIndex}
                destinationIndex={destinationIndex}
                routeStops={selectedRoute.stops}
                isBoardingExpanded={isBoardingExpanded}
                isDestExpanded={isDestExpanded}
                setIsBoardingExpanded={setIsBoardingExpanded}
                setIsDestExpanded={setIsDestExpanded}
                setBoardingStop={setBoardingStop}
                setDestinationStop={setDestinationStop}
                onOpenStops={() => setIsStopModalOpen(true)}
                onGoRoutes={() => setActiveTab('routes')}
              />
            ) : activeTab === 'home' ? (
              <HomeScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                tracked={tracked}
                liveCount={liveBuses.length}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onGoTracking={() => setActiveTab('tracking')}
                onGoRoutes={() => setActiveTab('routes')}
                onOpenStops={() => setIsStopModalOpen(true)}
                showToast={showToast}
              />
            ) : activeTab === 'routes' ? (
              <RoutesScreen
                routesState={routesState}
                onRetry={loadRoutes}
                routeSearchQuery={routeSearchQuery}
                setRouteSearchQuery={setRouteSearchQuery}
                filteredRoutes={filteredRoutes}
                selectedRoute={selectedRoute}
                onSelectRoute={handleSelectRoute}
              />
            ) : (
              <ProfileScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onResetDefaults={handleResetDefaults}
                onLogout={handleLogout}
                onOpenStops={() => setIsStopModalOpen(true)}
              />
            )}
          </View>

          {/* ─── BOTTOM DOCK ──────────────────────────── */}
          <BottomDock activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* ─── STOP SELECTOR MODAL ──────────────────── */}
          <StopSelectorModal
            isStopModalOpen={isStopModalOpen}
            setIsStopModalOpen={setIsStopModalOpen}
            routes={routes}
            selectedRoute={selectedRoute}
            selectRoute={selectRoute}
            isBoardingOpen={isBoardingOpen}
            setIsBoardingOpen={setIsBoardingOpen}
            isDestOpen={isDestOpen}
            setIsDestOpen={setIsDestOpen}
            boardingStop={boardingStop}
            setBoardingStop={setBoardingStop}
            destinationStop={destinationStop}
            setDestinationStop={setDestinationStop}
            tracked={tracked}
            boardingIndex={boardingIndex}
            destinationIndex={destinationIndex}
          />

        </View>
      )}
    </SafeAreaView>
  );
}
