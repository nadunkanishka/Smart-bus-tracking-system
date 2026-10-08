import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import LiveMap from './src/shared/LiveMap';
import { API_URL, request, toRoute } from './src/shared/api';
import { COLORS, RADII, SHADOWS, TYPE } from './src/shared/theme';
import {
  Avatar,
  AuthLayout,
  Banner,
  Button,
  Checkbox,
  Chip,
  FONT,
  FloatingDock,
  GradientCard,
  IconButton,
  OverlapHeader,
  OverlapSheet,
  Sheet,
  StrengthMeter,
  TextField,
  Toast,
  Vehicle,
  VehicleLoader,
  NavIcon,
} from './src/shared/ui';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { liveryFor } from './src/shared/vehicleShapes';
import {
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  FlagIcon,
  LockIcon,
  MapIcon,
  MapPinIcon,
  MoreVerticalIcon,
  NavigationArrowIcon,
  PhoneCallIcon,
  RouteIcon,
  SearchIcon,
  UserIcon,
} from './src/shared/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'smartbus:session';
const STALE_MS = 15000; // no update for this long: the bus is shown as "signal lost"
const GONE_MS = 60000; // no update for this long: the bus is removed from the map
const MAP_PADDING = { top: 170, bottom: 400 };
// Android draws edge to edge: StatusBar.currentHeight reads 0 there, so use the real safe-area inset.
const TOP_INSET = Platform.OS === 'android' ? (initialWindowMetrics?.insets.top ?? StatusBar.currentHeight ?? 0) : 0;

const NO_ROUTE = {
  id: null, number: '–', name: 'No routes yet', shortName: '—', startTerminal: '—', endTerminal: '—',
  distanceKm: 0, stops: [], stopPoints: [], path: [], trackable: false,
};

// Which bus matters to this passenger: the next one still coming to the boarding stop; otherwise one that has
// passed it and is heading to the destination; otherwise any live bus on the route.
function pickBus(all, boardingIndex, destinationIndex) {
  const fresh = all.filter((b) => !b.stale);
  const list = fresh.length ? fresh : all; // a bus that lost signal is only tracked when nothing else is live
  const eta = (bus, i) => (bus.stops?.[i]?.status === 'upcoming' ? bus.stops[i].etaSec : null);
  const nearest = (i) => list.filter((b) => eta(b, i) != null).sort((a, b) => eta(a, i) - eta(b, i))[0];
  const coming = nearest(boardingIndex);
  if (coming) return { bus: coming, phase: 'coming', etaMin: coming.stops[boardingIndex].etaMin };
  const riding = nearest(destinationIndex);
  if (riding) return { bus: riding, phase: 'passed', etaMin: riding.stops[destinationIndex].etaMin };
  return list[0] ? { bus: list[0], phase: 'done', etaMin: null } : null;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
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
        authMode === 'login' ? (
          <AuthLayout
            scene="login"
            tagline="Real-time bus tracking for Colombo commuters"
            title="Welcome back"
            subtitle="Where are you going today?"
            footer={
              <Text style={S.authSwitch}>
                New here?{' '}
                <Text style={S.authSwitchLink} accessibilityRole="link" onPress={() => switchAuthMode('register')}>
                  Create an account
                </Text>
              </Text>
            }
          >
            {authError ? <Banner tone="danger">{authError}</Banner> : null}
            <TextField
              label="Username"
              icon={<UserIcon color={COLORS.muted} size={20} />}
              value={loginUsername}
              onChangeText={setLoginUsername}
              placeholder="e.g. kasun_p"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label="Password"
              icon={<LockIcon color={COLORS.muted} size={20} />}
              secure
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="Your password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <View style={S.authRow}>
              <Checkbox checked={rememberMe} onChange={setRememberMe}>Remember me</Checkbox>
              <Pressable
                onPress={() => showToast('Password reset is not available yet.')}
                accessibilityRole="link"
                style={S.linkTap}
              >
                <Text style={S.link}>Forgot password?</Text>
              </Pressable>
            </View>
            <Button title="Log in" onPress={handleLogin} loading={authLoading} />
          </AuthLayout>
        ) : (
          <AuthLayout
            scene="register"
            tagline="Personalise your daily commute"
            title="Create account"
            subtitle="It takes less than a minute."
            footer={
              <Text style={S.authSwitch}>
                Already have an account?{' '}
                <Text style={S.authSwitchLink} accessibilityRole="link" onPress={() => switchAuthMode('login')}>
                  Log in
                </Text>
              </Text>
            }
          >
            {authError ? <Banner tone="danger">{authError}</Banner> : null}
            <TextField
              label="Full name"
              icon={<UserIcon color={COLORS.muted} size={20} />}
              value={regFullName}
              onChangeText={setRegFullName}
              placeholder="e.g. Kasun Perera"
              returnKeyType="next"
            />
            <TextField
              label="Username"
              icon={<UserIcon color={COLORS.muted} size={20} />}
              value={regUsername}
              onChangeText={setRegUsername}
              placeholder="e.g. kasun_p"
              hint="3-30 letters, numbers, dots or underscores"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextField
              label="Phone number (optional)"
              icon={<PhoneCallIcon color={COLORS.muted} size={20} />}
              value={regPhone}
              onChangeText={setRegPhone}
              placeholder="+94 77 123 4567"
              keyboardType="phone-pad"
              returnKeyType="next"
            />
            <TextField
              label="Password"
              icon={<LockIcon color={COLORS.muted} size={20} />}
              secure
              value={regPassword}
              onChangeText={setRegPassword}
              placeholder="At least 6 characters"
              error={passwordTooShort ? 'Use at least 6 characters.' : undefined}
              returnKeyType="next"
            />
            <StrengthMeter password={regPassword} />
            <TextField
              label="Confirm password"
              icon={<LockIcon color={COLORS.muted} size={20} />}
              secure
              value={regConfirm}
              onChangeText={setRegConfirm}
              placeholder="Re-enter password"
              error={confirmMismatch ? 'Passwords do not match.' : undefined}
              returnKeyType="done"
              onSubmitEditing={registerBlocked ? undefined : handleRegister}
            />
            <Checkbox checked={regTerms} onChange={setRegTerms}>
              I agree to the Terms of Service and Privacy Policy
            </Checkbox>
            <View style={S.gap16} />
            <Button title="Create account" onPress={handleRegister} loading={authLoading} disabled={registerBlocked} />
          </AuthLayout>
        )
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
          <Modal
            visible={isStopModalOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setIsStopModalOpen(false)}
          >
            <View style={S.modalBackdrop}>
              <TouchableOpacity
                style={S.modalDismissArea}
                onPress={() => setIsStopModalOpen(false)}
                activeOpacity={1}
                accessibilityLabel="Close stop selector"
              />
              <Sheet>
                <View style={S.modalHandleRow}>
                  <View style={S.modalHandle} />
                </View>

                <View style={S.modalHeaderRow}>
                  <Text style={S.modalTitle}>Select Your Stops</Text>
                  <Button title="Done" tone="ink" size="sm" full={false} onPress={() => setIsStopModalOpen(false)} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Route selector */}
                  <Text style={S.modalSectionLabel}>Active route</Text>
                  <View style={S.routeChipsRow}>
                    {routes.map(r => (
                      <Chip
                        key={r.id}
                        label={r.shortName}
                        selected={selectedRoute.id === r.id}
                        tone="ink"
                        onPress={() => {
                          selectRoute(r);
                          setIsBoardingOpen(false);
                          setIsDestOpen(false);
                        }}
                      />
                    ))}
                  </View>

                  {/* Boarding */}
                  <Text style={[S.modalSectionLabel, S.modalSectionGap]}>Boarding stop</Text>
                  <TouchableOpacity
                    style={S.dropdownTrigger}
                    onPress={() => { setIsBoardingOpen(p => !p); setIsDestOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={S.dropdownTriggerLeft}>
                      <MapPinIcon color={COLORS.accent} size={18} />
                      <Text style={S.dropdownTriggerText}>{boardingStop || '—'}</Text>
                    </View>
                    <ChevronDownIcon color={COLORS.muted} size={16} />
                  </TouchableOpacity>
                  {isBoardingOpen && (
                    <View style={S.dropdownList}>
                      {selectedRoute.stops.map((stop, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[S.dropdownItem, boardingStop === stop && S.dropdownItemActive]}
                          onPress={() => { setBoardingStop(stop); setIsBoardingOpen(false); }}
                        >
                          <Text style={[S.dropdownItemText, boardingStop === stop && S.dropdownItemTextActive]}>
                            {stop}
                          </Text>
                          {boardingStop === stop && <CheckIcon color={COLORS.accentText} size={14} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Destination */}
                  <Text style={[S.modalSectionLabel, S.modalSectionGap]}>Destination stop</Text>
                  <TouchableOpacity
                    style={S.dropdownTrigger}
                    onPress={() => { setIsDestOpen(p => !p); setIsBoardingOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={S.dropdownTriggerLeft}>
                      <FlagIcon color={COLORS.accent} size={18} />
                      <Text style={S.dropdownTriggerText}>{destinationStop || '—'}</Text>
                    </View>
                    <ChevronDownIcon color={COLORS.muted} size={16} />
                  </TouchableOpacity>
                  {isDestOpen && (
                    <View style={S.dropdownList}>
                      {selectedRoute.stops.map((stop, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[S.dropdownItem, destinationStop === stop && S.dropdownItemActive]}
                          onPress={() => { setDestinationStop(stop); setIsDestOpen(false); }}
                        >
                          <Text style={[S.dropdownItemText, destinationStop === stop && S.dropdownItemTextActive]}>
                            {stop}
                          </Text>
                          {destinationStop === stop && <CheckIcon color={COLORS.accentText} size={14} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Timeline: live arrival time at every stop for the tracked bus */}
                  <Text style={[S.modalSectionLabel, S.modalSectionGapLg]}>Route timeline</Text>
                  <View style={S.timelineContainer}>
                    {selectedRoute.stops.map((stop, idx) => {
                      const live = tracked?.bus.stops?.[idx];
                      const isPassed = live ? live.status === 'passed' : false;
                      const isBoarding = idx === boardingIndex;
                      const isDestination = idx === destinationIndex;
                      const isActive = idx > boardingIndex && idx <= destinationIndex;
                      return (
                        <View key={idx} style={S.timelineRow}>
                          <View style={S.timelineLeft}>
                            <View style={[
                              S.timelineDot,
                              isPassed && S.dotPassed,
                              isBoarding && S.dotBoarding,
                              isDestination && S.dotDestination,
                              isActive && !isDestination && S.dotActive,
                            ]}>
                              {isPassed ? <CheckIcon color="#FFF" size={7} /> : null}
                            </View>
                            {idx < selectedRoute.stops.length - 1 && (
                              <View style={[S.timelineLineV, isPassed && S.lineVPassed]} />
                            )}
                          </View>
                          <View style={S.timelineRight}>
                            <Text style={[
                              S.timelineStopName,
                              (isBoarding || isDestination) && S.timelineStopNameHighlight,
                            ]}>
                              {stop}
                            </Text>
                            <Text style={S.timelineTag}>
                              {isBoarding ? 'Boarding stop · ' : isDestination ? 'Destination · ' : ''}
                              {!live ? 'No live bus' : isPassed ? 'Bus passed' : `Bus in ${live.etaMin} min`}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </Sheet>
            </View>
          </Modal>

        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Screen Components ────────────────────────────────────────────────────────

function StopPicker({ label, dotStyle, value, expanded, onToggle, stops, onPick, alignRight }) {
  return (
    <View style={S.stopSelectorCol}>
      <View style={S.stopSelectorHeader}>
        <View style={dotStyle} />
        <Text style={S.stopSelectorLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        style={S.stopSelectorBtn}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label} stop: ${value || 'none'}`}
      >
        <Text style={S.stopSelectorValue} numberOfLines={1}>{value || '—'}</Text>
        <ChevronDownIcon color={COLORS.accentText} size={14} />
      </TouchableOpacity>
      {expanded && (
        <View style={[S.stopInlineList, alignRight && S.stopInlineListRight]}>
          {stops.map((stop, idx) => (
            <TouchableOpacity
              key={idx}
              style={[S.stopInlineItem, value === stop && S.stopInlineItemActive]}
              onPress={() => onPick(stop)}
              activeOpacity={0.8}
            >
              <Text style={[S.stopInlineText, value === stop && S.stopInlineTextActive]}>{stop}</Text>
              {value === stop && <CheckIcon color={COLORS.accentText} size={12} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// What the tracked bus means for this passenger, in one line.
function trackedSummary(tracked, boardingStop, destinationStop) {
  if (!tracked) return '';
  if (tracked.bus.stale) return 'Signal lost. Showing the last known position.';
  if (tracked.phase === 'coming') return `Arrives at ${boardingStop} in ${tracked.etaMin} min`;
  if (tracked.phase === 'passed') return `Passed ${boardingStop}. ${tracked.etaMin} min to ${destinationStop}`;
  return 'This bus has passed your stops.';
}

function ConnectionChip({ conn }) {
  const live = conn === 'connected';
  return (
    <View style={[S.liveChip, !live && S.liveChipOff]} accessibilityLabel={live ? 'Live connection' : conn === 'connecting' ? 'Connecting' : 'Disconnected'}>
      <View style={[S.liveDot, !live && S.liveDotOff]} />
      <Text style={S.liveText}>{live ? 'LIVE' : conn === 'connecting' ? 'CONNECTING' : 'OFFLINE'}</Text>
    </View>
  );
}

function TrackingScreen({
  conn,
  routesState,
  tracked,
  liveCount,
  mapBuses,
  selectedRoute,
  boardingStop,
  destinationStop,
  boardingIndex,
  destinationIndex,
  routeStops,
  isBoardingExpanded,
  isDestExpanded,
  setIsBoardingExpanded,
  setIsDestExpanded,
  setBoardingStop,
  setDestinationStop,
  onOpenStops,
  onGoRoutes,
}) {
  const bus = tracked?.bus;
  // How far along the route the tracked bus is (by segment), for the progress bar.
  const progress = bus?.segIndex != null && routeStops.length > 1
    ? Math.min(0.94, Math.max(0.06, (bus.segIndex + 0.5) / (routeStops.length - 1)))
    : 0.06;

  return (
    <View style={S.flex}>
      {/* Map fills the whole screen; cards float on top */}
      <View style={S.mapCanvas}>
        <LiveMap
          path={selectedRoute.path}
          stops={selectedRoute.stopPoints}
          buses={mapBuses}
          highlightStop={boardingIndex}
          padding={MAP_PADDING}
        />
      </View>

      {/* Floating Map Header */}
      <View style={S.mapHeader} pointerEvents="box-none">
        <View style={S.mapHeaderInner}>
          <View style={S.mapHeaderLeft}>
            <ConnectionChip conn={conn} />
            <Text style={S.mapHeaderTitle} numberOfLines={1}>{selectedRoute.shortName}</Text>
          </View>
          <IconButton label="Change stops" onPress={onOpenStops} tone="soft" size={44}>
            <MoreVerticalIcon color={COLORS.ink} size={18} />
          </IconButton>
        </View>
      </View>

      {/* ── INLINE STOP SELECTOR (floating card) ─────────────────── */}
      {routeStops.length > 0 ? (
        <View style={S.stopSelectorBar}>
          <StopPicker
            label="BOARDING"
            dotStyle={S.stopDotGreen}
            value={boardingStop}
            expanded={isBoardingExpanded}
            onToggle={() => { setIsBoardingExpanded(p => !p); setIsDestExpanded(false); }}
            stops={routeStops}
            onPick={(stop) => { setBoardingStop(stop); setIsBoardingExpanded(false); }}
          />
          <View style={S.stopSelectorDivider}>
            <ArrowRightIcon color={COLORS.accent} size={16} />
          </View>
          <StopPicker
            label="DESTINATION"
            dotStyle={S.stopDotOrange}
            value={destinationStop}
            expanded={isDestExpanded}
            onToggle={() => { setIsDestExpanded(p => !p); setIsBoardingExpanded(false); }}
            stops={routeStops}
            onPick={(stop) => { setDestinationStop(stop); setIsDestExpanded(false); }}
            alignRight
          />
        </View>
      ) : null}

      {/* Bottom summary card */}
      <View style={S.summaryCard}>
        {routesState === 'loading' ? (
          <View style={S.emptyState}><VehicleLoader label="Loading routes" /></View>
        ) : !selectedRoute.id ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status={routesState === 'error' ? 'maint' : undefined} width={116} label="No routes" />
            <Text style={S.emptyStateTitle}>{routesState === 'error' ? 'Could not load routes' : 'No routes available yet'}</Text>
            <Text style={S.emptyStateSub}>{routesState === 'error' ? 'Check your connection and try again.' : 'Routes appear here once they are published.'}</Text>
            <Button title="Open routes" tone="ink" size="sm" full={false} onPress={onGoRoutes} style={S.emptyBtn} />
          </View>
        ) : !selectedRoute.trackable ? (
          <View style={S.emptyState}>
            <Vehicle name="minibus" width={116} label="No map data" />
            <Text style={S.emptyStateTitle}>Live tracking is not set up for this route</Text>
            <Text style={S.emptyStateSub}>It has no map path or stop positions yet.</Text>
          </View>
        ) : !bus ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status={conn === 'connected' ? 'idle' : 'off'} width={116} label="No live bus" />
            <Text style={S.emptyStateTitle}>{conn === 'connected' ? 'No bus is on this route right now' : 'Reconnecting…'}</Text>
            <Text style={S.emptyStateSub}>
              {conn === 'connected' ? 'It will appear here as soon as a driver goes on duty.' : 'Live positions will resume when the connection is back.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Header: bus + status */}
            <View style={S.sheetTopRow}>
              <View style={S.flex}>
                <Text style={S.sheetMetaLabel}>{liveCount > 1 ? `Nearest of ${liveCount} buses` : 'Bus'}</Text>
                <Text style={S.sheetBookingId}>{bus.registration}</Text>
              </View>
              <View style={[S.transitBadge, bus.stale && S.transitBadgeWarn]}>
                <Text style={[S.transitBadgeText, bus.stale && S.transitBadgeTextWarn]}>
                  {bus.stale ? 'Signal lost' : tracked.phase === 'coming' ? `${tracked.etaMin} min away` : 'In transit'}
                </Text>
              </View>
            </View>

            {/* Progress along the route */}
            <View style={S.progressBlock}>
              <View style={S.progressTrack}>
                <View style={[S.progressDone, { flex: progress }]} />
                <ArrowRightIcon color={COLORS.accent} size={20} />
                <View style={[S.progressLeft, { flex: 1 - progress }]} />
              </View>
              <Text style={S.progressSummary}>{trackedSummary(tracked, boardingStop, destinationStop)}</Text>
            </View>

            {/* Predicted arrival at every stop, updated on each GPS fix */}
            <ScrollView style={S.etaList} showsVerticalScrollIndicator={false}>
              {bus.stops.map((stop) => {
                const mine = stop.index === boardingIndex || stop.index === destinationIndex;
                return (
                  <View key={stop.index} style={[S.etaRow, mine && S.etaRowOn]}>
                    <View style={[S.etaDot, stop.status === 'passed' && S.etaDotPassed, mine && S.etaDotOn]} />
                    <Text style={[S.etaStop, stop.status === 'passed' && S.etaPassed]} numberOfLines={1}>{stop.name}</Text>
                    <Text style={[S.etaVal, stop.status === 'passed' && S.etaPassed]}>
                      {stop.status === 'passed' ? 'Passed' : `${stop.etaMin} min`}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={S.driverCard}>
              <View style={S.driverLeft}>
                <View style={S.driverAvatar}>
                  <Text style={S.driverAvatarText}>{(bus.driverName || bus.registration || 'B').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={S.flex}>
                  <Text style={S.driverName}>{bus.driverName || 'Driver on duty'}</Text>
                  <Text style={S.driverRole} numberOfLines={1}>{Math.round((bus.speed || 0) * 3.6)} km/h · {bus.registration}</Text>
                </View>
              </View>
              <View style={S.driverStatusBadge}>
                <View style={S.driverStatusDot} />
                <Text style={S.driverStatusText}>On Duty</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function HomeScreen({ userProfile, selectedRoute, tracked, liveCount, boardingStop, destinationStop, onGoTracking, onGoRoutes, onOpenStops, showToast }) {
  const bus = tracked?.bus;
  const services = [
    { key: 'track', label: 'Live tracker', onPress: onGoTracking, icon: <NavigationArrowIcon color={COLORS.primary} size={22} /> },
    { key: 'routes', label: 'Browse routes', onPress: onGoRoutes, icon: <RouteIcon color={COLORS.primary} size={22} /> },
    { key: 'stops', label: 'My stops', onPress: onOpenStops, icon: <MapPinIcon color={COLORS.primary} size={22} /> },
  ];
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.homeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={196}>
        <View style={S.homeHeader}>
          <Avatar label={userProfile?.name} size={48} />
          <View style={S.homeHeaderText}>
            <Text style={S.homeGreeting}>Hello,</Text>
            <Text style={S.homeUserName} numberOfLines={1}>{userProfile?.name || 'Passenger'}</Text>
          </View>
          <IconButton
            label="Notifications"
            onPress={() => showToast(bus ? trackedSummary(tracked, boardingStop, destinationStop) : `No live bus on ${selectedRoute.shortName} right now.`)}
          >
            <BellIcon color={COLORS.ink} size={20} hasBadge={!!bus} />
          </IconButton>
        </View>
        <Vehicle name="bus" livery="purple" width={132} style={S.homeHeaderBus} label="Illustrated city bus" />
      </OverlapHeader>

      <OverlapSheet style={S.homeSheet}>
        {/* Travelling To Card */}
        <View style={S.travelCard}>
          <View style={S.travelCardLeft}>
            <View style={S.travelIcon}>
              <MapPinIcon color={COLORS.accent} size={20} />
            </View>
            <View style={S.flex}>
              <Text style={S.travelCardLabel}>Travelling to</Text>
              <Text style={S.travelCardPlace} numberOfLines={1}>{destinationStop || 'Choose a route'}</Text>
            </View>
          </View>
          <Button title="Change" tone="soft" size="sm" full={false} onPress={onOpenStops} />
        </View>

        {/* Services */}
        <Text style={S.sectionTitle}>Services</Text>
        <View style={S.quickRow}>
          {services.map(s => (
            <Pressable
              key={s.key}
              onPress={s.onPress}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              style={({ pressed }) => [S.quickItem, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
            >
              <View style={S.quickTile}>{s.icon}</View>
              <Text style={S.quickLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Active Journey: the live bus for the chosen stops */}
        <Text style={S.sectionTitle}>Active Journey</Text>
        {bus ? (
          <GradientCard tint="bus" style={S.journeyCard}>
            <Pressable
              onPress={onGoTracking}
              accessibilityRole="button"
              accessibilityLabel={`Open live tracker for bus ${bus.registration}`}
              style={({ pressed }) => [S.journeyPress, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
            >
              <View style={S.journeyCardTop}>
                <View style={S.flex}>
                  <Text style={S.journeyBusId}>Bus {bus.registration}</Text>
                  <Text style={S.journeyRouteName}>{selectedRoute.shortName}</Text>
                  <View style={S.journeyKv}>
                    <View>
                      <Text style={S.journeyKvLabel}>Status</Text>
                      <Text style={S.journeyKvVal}>{bus.stale ? 'Signal lost' : tracked.phase === 'coming' ? 'On the way' : 'In transit'}</Text>
                    </View>
                    <View>
                      <Text style={S.journeyKvLabel}>{tracked.phase === 'coming' ? 'At your stop' : 'At destination'}</Text>
                      <Text style={S.journeyKvVal}>{tracked.etaMin != null ? `${tracked.etaMin} min` : '—'}</Text>
                    </View>
                  </View>
                </View>
                <Vehicle name="bus" livery={liveryFor(selectedRoute.id)} status={bus.stale ? 'off' : undefined} running={!bus.stale} width={124} style={S.journeyBus} label="Illustrated city bus" />
              </View>

              <View style={S.journeyTerminals}>
                <View style={S.flex}>
                  <Text style={S.journeyTerminalLabel}>From</Text>
                  <Text style={S.journeyTerminalName} numberOfLines={1}>{boardingStop}</Text>
                </View>
                <View style={S.journeyTerminalRight}>
                  <Text style={S.journeyTerminalLabel}>To</Text>
                  <Text style={S.journeyTerminalName} numberOfLines={1}>{destinationStop}</Text>
                </View>
              </View>
            </Pressable>
          </GradientCard>
        ) : (
          <View style={[S.routeSummaryCard, S.journeyCard, S.emptyState]}>
            <Vehicle name="bus" status="idle" width={108} label="No live bus" />
            <Text style={S.emptyStateTitle}>No live bus right now</Text>
            <Text style={S.emptyStateSub}>{selectedRoute.id ? `Nothing is running on ${selectedRoute.shortName} at the moment.` : 'Pick a route to start tracking.'}</Text>
          </View>
        )}

        {/* Route Summary */}
        <View style={S.sectionRow}>
          <Text style={S.sectionTitleFlat}>My Route</Text>
          <TouchableOpacity onPress={onGoRoutes} activeOpacity={0.7} style={S.linkTap} accessibilityRole="link">
            <Text style={S.link}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={S.routeSummaryCard}>
          <View style={S.routeSummaryHeader}>
            <View style={S.routeBadge}>
              <Text style={S.routeBadgeText}>{selectedRoute.shortName}</Text>
            </View>
            <Text style={S.routeSummaryMeta}>{selectedRoute.distanceKm} km · {liveCount} {liveCount === 1 ? 'bus' : 'buses'} live</Text>
          </View>
          <Text style={S.routeSummaryName}>{selectedRoute.name}</Text>
          <View style={S.routeTerminalRow}>
            <Text style={S.routeTerminalText}>{selectedRoute.startTerminal}</Text>
            <ArrowRightIcon color={COLORS.accent} size={12} />
            <Text style={S.routeTerminalText}>{selectedRoute.endTerminal}</Text>
          </View>
        </View>
      </OverlapSheet>
    </ScrollView>
  );
}

function RoutesScreen({ routesState, onRetry, routeSearchQuery, setRouteSearchQuery, filteredRoutes, selectedRoute, onSelectRoute }) {
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.routesScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={190}>
        <Text style={S.screenTitle}>Bus Routes</Text>
        <Text style={S.screenSubtitle}>Select a route to start tracking your bus</Text>

        {/* Search */}
        <View style={S.searchBar}>
          <SearchIcon color={COLORS.muted} size={18} />
          <TextInput
            style={S.searchInput}
            value={routeSearchQuery}
            onChangeText={setRouteSearchQuery}
            placeholder="Search route no. or stop name…"
            placeholderTextColor={COLORS.mutedLight}
            accessibilityLabel="Search routes"
          />
          {routeSearchQuery ? (
            <TouchableOpacity onPress={() => setRouteSearchQuery('')} activeOpacity={0.7} style={S.searchClearTap} accessibilityLabel="Clear search" accessibilityRole="button">
              <Text style={S.searchClear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Currently Selected */}
        {selectedRoute.id && (
          <View style={S.activeRouteBanner}>
            <View style={S.activeRouteLeft}>
              <NavigationArrowIcon color={COLORS.accentText} size={14} />
              <Text style={S.activeRouteBannerText}>
                Tracking {selectedRoute.shortName}
              </Text>
            </View>
            <View style={S.activeDot} />
          </View>
        )}

        {/* Route Cards */}
        {routesState === 'loading' ? (
          <View style={S.emptyState}><VehicleLoader label="Loading routes" /></View>
        ) : routesState === 'error' ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status="maint" width={120} label="Could not load routes" />
            <Text style={S.emptyStateTitle}>Could not load routes</Text>
            <Text style={S.emptyStateSub}>Check your connection and try again.</Text>
            <Button title="Try again" tone="ink" size="sm" full={false} onPress={onRetry} style={S.emptyBtn} />
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={S.emptyState}>
            <Vehicle name="coach" width={128} label="No routes found" />
            <Text style={S.emptyStateTitle}>No routes found</Text>
            <Text style={S.emptyStateSub}>{routeSearchQuery ? 'Try a different search term' : 'Routes appear here once they are published.'}</Text>
          </View>
        ) : (
          filteredRoutes.map(route => {
            const isSel = selectedRoute.id === route.id;
            const Wrap = isSel ? GradientCard : View;
            const wrapProps = isSel ? { tint: 'bus', id: `route-${route.id}`, style: S.routeCardWrap } : { style: [S.routeCardWrap, S.routeCardPlain] };
            return (
              <Wrap key={route.id} {...wrapProps}>
                <TouchableOpacity
                  style={S.routeCard}
                  onPress={() => onSelectRoute(route)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${route.name}, ${isSel ? 'currently tracking' : 'select'}`}
                >
                  <View style={S.routeCardTop}>
                    <View style={[S.routeNumBadge, isSel && S.routeNumBadgeActive]}>
                      <Text style={[S.routeNumText, isSel && S.routeNumTextActive]}>
                        {route.number}
                      </Text>
                    </View>
                    <View style={S.routeCardTitleBox}>
                      <Text style={S.routeCardName} numberOfLines={1}>{route.name}</Text>
                      <Text style={S.routeCardMeta}>
                        {route.distanceKm} km · {route.stops.length} stops{route.trackable ? '' : ' · no live tracking yet'}
                      </Text>
                    </View>
                    {isSel ? (
                      <View style={S.trackingPill}>
                        <Text style={S.trackingPillText}>Tracking</Text>
                      </View>
                    ) : (
                      <View style={S.trackRoutePill}>
                        <Text style={S.trackRoutePillText}>Select</Text>
                        <ArrowRightIcon color={COLORS.primaryStrong} size={12} />
                      </View>
                    )}
                  </View>

                  <View style={S.routeTerminalsCard}>
                    <View style={S.terminalItem}>
                      <View style={S.terminalDotStart} />
                      <Text style={S.terminalName} numberOfLines={1}>{route.startTerminal}</Text>
                    </View>
                    <View style={S.terminalDashedLine} />
                    <View style={S.terminalItem}>
                      <View style={S.terminalDotEnd} />
                      <Text style={S.terminalName} numberOfLines={1}>{route.endTerminal}</Text>
                    </View>
                  </View>

                  {/* Stops */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.stopsScroll}>
                    {route.stops.map((stop, idx) => (
                      <View key={idx} style={S.stopChip}>
                        <Text style={S.stopChipText}>{stop}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </TouchableOpacity>
              </Wrap>
            );
          })
        )}
      </OverlapSheet>
    </ScrollView>
  );
}

function ProfileScreen({ userProfile, selectedRoute, boardingStop, destinationStop, onResetDefaults, onLogout, onOpenStops }) {
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.profileScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar Hero */}
      <OverlapHeader minHeight={200}>
        <View style={S.profileHero}>
          <View style={S.profileAvatar}>
            <Text style={S.profileAvatarText}>
              {(userProfile?.name || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={S.profileName}>{userProfile?.name || 'Passenger'}</Text>
          <Text style={S.profileUsername}>@{userProfile?.username}</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Account */}
        <View style={S.profileCard}>
          <Text style={S.profileCardTitle}>Account</Text>
          <ProfileRow label="Full name" value={userProfile?.name || '—'} />
          <ProfileRow label="Username" value={userProfile?.username || '—'} />
          <ProfileRow label="Phone" value={userProfile?.phone || 'Not provided'} last />
        </View>

        {/* Journey Preferences */}
        <View style={S.profileCard}>
          <View style={S.profileCardHeader}>
            <Text style={S.profileCardTitleFlat}>Journey Preferences</Text>
            <TouchableOpacity onPress={onOpenStops} activeOpacity={0.7} style={S.linkTap} accessibilityRole="link">
              <Text style={S.link}>Edit Stops</Text>
            </TouchableOpacity>
          </View>
          <ProfileRow label="Preferred Route" value={selectedRoute.shortName} />
          <ProfileRow label="Boarding Stop" value={boardingStop || '—'} accent />
          <ProfileRow label="Destination Stop" value={destinationStop || '—'} accent last />
        </View>

        {/* Reset Stops Defaults */}
        <Button title="Reset Route Terminals" tone="soft" onPress={onResetDefaults} style={S.profileBtn} />

        {/* Sign Out */}
        <Button title="Sign Out" tone="dangerSoft" onPress={onLogout} style={S.profileBtn} />
      </OverlapSheet>
    </ScrollView>
  );
}

function ProfileRow({ label, value, accent, last }) {
  return (
    <View style={[S.profileRow, last && S.profileRowLast]}>
      <Text style={S.profileRowLabel}>{label}</Text>
      <Text style={[S.profileRowValue, accent && S.profileRowValueAccent]}>{value}</Text>
    </View>
  );
}

function BottomDock({ activeTab, setActiveTab }) {
  // CHANGED (visual only): filled two-tone nav icons, shared with the admin sidebar
  const icon = (name) => (active) => <NavIcon name={name} active={active} />;
  const items = [
    { id: 'home', label: 'Home', icon: icon('home') },
    { id: 'tracking', label: 'Track', icon: icon('arrow') },
    { id: 'routes', label: 'Routes', icon: icon('route') },
    { id: 'profile', label: 'Profile', icon: icon('user') },
  ];
  return <FloatingDock items={items} active={activeTab} onChange={setActiveTab} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// CHANGED: every value comes from shared tokens (COLORS / RADII / SHADOWS / TYPE); spacing is on the 4px scale.

const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  // On desktop the signed-in app is a centred phone-width column, never a stretched mobile screen.
  appShell: {
    flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden',
    backgroundColor: COLORS.bg, ...(Platform.OS === 'web' ? SHADOWS.lg : null),
  },

  // ─── Auth ───────────────────────────────────────────────
  authRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  authSwitch: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: 24 },
  authSwitchLink: { color: COLORS.accentText, fontWeight: '700' },
  link: { ...type('smallBold'), color: COLORS.accentText },
  linkTap: { minHeight: 44, justifyContent: 'center' },

  // ─── Tracking Screen ────────────────────────────────────
  mapCanvas: { ...StyleSheet.absoluteFillObject },
  mapHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    paddingTop: TOP_INSET + 8, paddingHorizontal: 16,
  },
  mapHeaderInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADII.lg, paddingLeft: 16, paddingRight: 8, paddingVertical: 8,
    ...SHADOWS.md,
  },
  mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADII.pill,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  liveText: { ...type('overline'), color: COLORS.white },
  mapHeaderTitle: { ...type('h3'), color: COLORS.ink },

  // Floating stop selector card
  stopSelectorBar: {
    position: 'absolute', top: TOP_INSET + 8 + 60 + 8, left: 16, right: 16, zIndex: 20,
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 12,
    ...SHADOWS.md,
  },
  stopSelectorCol: { flex: 1, position: 'relative' },
  stopSelectorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stopDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryStrong },
  stopDotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  stopSelectorLabel: { ...type('overline'), color: COLORS.muted },
  stopSelectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.sm, paddingHorizontal: 12, minHeight: 44,
  },
  stopSelectorValue: { ...type('smallBold'), color: COLORS.ink, flex: 1, marginRight: 4 },
  stopSelectorDivider: { width: 28, alignItems: 'center', justifyContent: 'flex-end', height: 70 },
  stopInlineList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 8,
    backgroundColor: COLORS.surface, borderRadius: RADII.md, overflow: 'hidden', minWidth: 190,
    ...SHADOWS.lg,
  },
  stopInlineListRight: { left: 'auto', right: 0 },
  stopInlineItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 44, paddingHorizontal: 16,
  },
  stopInlineItemActive: { backgroundColor: COLORS.accentSoft },
  stopInlineText: { ...type('small'), color: COLORS.ink },
  stopInlineTextActive: { color: COLORS.accentText, fontWeight: '700' },

  // Bottom summary card
  summaryCard: {
    position: 'absolute', left: 16, right: 16, bottom: 104,
    backgroundColor: COLORS.surface, borderRadius: RADII.xl, padding: 20,
    ...SHADOWS.lg,
  },
  sheetTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  sheetMetaLabel: { ...type('caption'), color: COLORS.muted },
  sheetBookingId: { ...type('h2'), color: COLORS.ink },
  transitBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill, backgroundColor: COLORS.successSoft },
  transitBadgeText: { ...type('caption'), color: COLORS.success },

  progressBlock: { marginBottom: 16 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressMetaVal: { ...type('smallBold'), color: COLORS.ink },
  progressTrack: { flexDirection: 'row', alignItems: 'center', height: 20 },
  progressDone: { height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
  progressLeft: { height: 4, borderRadius: 2, backgroundColor: COLORS.ink },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  progressLabel: { ...type('caption'), color: COLORS.muted, flex: 1 },
  progressLabelRight: { ...type('caption'), color: COLORS.muted },


  // Driver Card
  driverCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: 12, marginBottom: 16, gap: 12,
  },
  driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  driverAvatarText: { ...type('smallBold'), color: COLORS.white },
  driverName: { ...type('smallBold'), color: COLORS.ink },
  driverRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  driverStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.successSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill,
  },
  driverStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  driverStatusText: { ...type('caption'), color: COLORS.success },

  // ─── Home Screen ────────────────────────────────────────
  homeScroll: { paddingBottom: 120 },
  homeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: TOP_INSET },
  homeHeaderText: { flex: 1 },
  homeGreeting: { ...type('small'), color: COLORS.ink },
  homeUserName: { ...type('h1'), color: COLORS.ink },
  homeHeaderBus: { position: "absolute", right: 12, bottom: 34 },
  homeSheet: { minHeight: 600 },

  travelCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 16, marginBottom: 24,
    ...SHADOWS.sm,
  },
  travelCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  travelIcon: { width: 44, height: 44, borderRadius: RADII.sm, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  travelCardLabel: { ...type('caption'), color: COLORS.muted },
  travelCardPlace: { ...type('bodyBold'), color: COLORS.ink },

  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickItem: { flex: 1, alignItems: 'center', gap: 8 },
  quickTile: {
    width: 64, height: 64, borderRadius: RADII.lg, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  quickLabel: { ...type('caption'), color: COLORS.ink, textAlign: 'center' },

  sectionTitle: { ...type('h3'), color: COLORS.ink, marginBottom: 12 },
  sectionTitleFlat: { ...type('h3'), color: COLORS.ink },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },

  journeyCard: { marginBottom: 24 },
  journeyPress: { padding: 20 },
  journeyCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 8 },
  journeyBus: { marginTop: 8, marginRight: -16 },
  journeyBusId: { ...type('h2'), color: COLORS.ink },
  journeyRouteName: { ...type('small'), color: COLORS.muted, marginTop: 2 },
  journeyKv: { flexDirection: 'row', gap: 24, marginTop: 12 },
  journeyKvLabel: { ...type('caption'), color: COLORS.muted },
  journeyKvVal: { ...type('smallBold'), color: COLORS.ink },

  journeyProgress: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  journeyDotStart: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
  journeyLine: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginHorizontal: 4 },
  journeyLineProgress: { width: '40%', height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },
  journeyBusPill: { backgroundColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADII.pill },
  journeyBusPillText: { ...type('caption'), color: COLORS.white },
  journeyDotEnd: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.ink },
  journeyTerminals: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  journeyTerminalRight: { flex: 1, alignItems: 'flex-end' },
  journeyTerminalLabel: { ...type('caption'), color: COLORS.muted },
  journeyTerminalName: { ...type('smallBold'), color: COLORS.ink },

  routeSummaryCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, ...SHADOWS.sm },
  routeSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  routeBadge: { backgroundColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADII.pill },
  routeBadgeText: { ...type('caption'), color: COLORS.white },
  routeSummaryMeta: { ...type('small'), color: COLORS.muted, flexShrink: 1 },
  routeSummaryName: { ...type('bodyBold'), color: COLORS.ink, marginBottom: 8 },
  routeTerminalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeTerminalText: { ...type('small'), color: COLORS.muted, flex: 1 },

  // ─── Routes Screen ──────────────────────────────────────
  routesScroll: { paddingBottom: 120 },
  screenTitle: { ...type('h1'), color: COLORS.ink, paddingTop: TOP_INSET },
  screenSubtitle: { ...type('small'), color: COLORS.ink, marginTop: 4, marginBottom: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADII.pill, paddingHorizontal: 20, minHeight: 52, gap: 12, ...SHADOWS.sm,
  },
  searchInput: { flex: 1, ...type('body'), color: COLORS.ink, minHeight: 48, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
  searchClearTap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  searchClear: { ...type('bodyBold'), color: COLORS.muted },

  activeRouteBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.accentSoft, borderRadius: RADII.md, padding: 16, marginBottom: 16,
  },
  activeRouteLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeRouteBannerText: { ...type('smallBold'), color: COLORS.accentText },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyStateTitle: { ...type('h3'), color: COLORS.ink, marginTop: 16 },
  emptyStateSub: { ...type('small'), color: COLORS.muted },

  routeCardWrap: { marginBottom: 16 },
  routeCardPlain: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, ...SHADOWS.sm },
  routeCard: { padding: 20 },
  routeCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  routeNumBadge: {
    width: 44, height: 44, borderRadius: RADII.sm, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  routeNumBadgeActive: { backgroundColor: COLORS.ink },
  routeNumText: { ...type('bodyBold'), color: COLORS.primaryDeep },
  routeNumTextActive: { color: COLORS.white },
  routeCardTitleBox: { flex: 1 },
  routeCardName: { ...type('smallBold'), color: COLORS.ink },
  routeCardMeta: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  trackingPill: { backgroundColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill },
  trackingPillText: { ...type('caption'), color: COLORS.white },
  trackRoutePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.primarySoft, borderRadius: RADII.pill },
  trackRoutePillText: { ...type('caption'), color: COLORS.primaryDeep },

  routeTerminalsCard: { marginBottom: 12 },
  terminalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  terminalDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primaryStrong },
  terminalDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ink },
  terminalDashedLine: { width: 2, height: 12, backgroundColor: COLORS.mutedLight, marginLeft: 4, borderRadius: 1 },
  terminalName: { ...type('small'), color: COLORS.inkSoft, flex: 1 },

  stopsScroll: { marginTop: 4 },
  stopChip: { backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8 },
  stopChipText: { ...type('caption'), color: COLORS.inkSoft },

  // ─── Profile Screen ─────────────────────────────────────
  profileScroll: { paddingBottom: 120 },
  profileHero: { alignItems: 'center', paddingTop: TOP_INSET + 8 },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...SHADOWS.md,
  },
  profileAvatarText: { ...type('display'), color: COLORS.primaryDeep },
  profileName: { ...type('h1'), color: COLORS.ink },
  profileUsername: { ...type('small'), color: COLORS.ink, marginTop: 4 },

  profileCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, marginBottom: 16, ...SHADOWS.sm },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  profileCardTitle: { ...type('h3'), color: COLORS.ink, marginBottom: 4 },
  profileCardTitleFlat: { ...type('h3'), color: COLORS.ink },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  profileRowLast: { borderBottomWidth: 0 },
  profileRowLabel: { ...type('small'), color: COLORS.muted, flexShrink: 0 },
  profileRowValue: { ...type('smallBold'), color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
  profileRowValueAccent: { color: COLORS.accentText },
  profileBtn: { marginBottom: 12 },

  // ─── Stop Selector Modal ─────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,20,25,0.45)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalHandleRow: { alignItems: 'center', paddingBottom: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { ...type('h2'), color: COLORS.ink },

  modalSectionLabel: { ...type('overline'), color: COLORS.muted, marginBottom: 12, textTransform: 'uppercase' },
  modalSectionGap: { marginTop: 24 },
  modalSectionGapLg: { marginTop: 32 },
  routeChipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingHorizontal: 16, minHeight: 52,
  },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownTriggerText: { ...type('bodyBold'), color: COLORS.ink },
  dropdownList: { backgroundColor: COLORS.surface, borderRadius: RADII.md, marginTop: 8, overflow: 'hidden', ...SHADOWS.md },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 16 },
  dropdownItemActive: { backgroundColor: COLORS.accentSoft },
  dropdownItemText: { ...type('body'), color: COLORS.ink },
  dropdownItemTextActive: { color: COLORS.accentText, fontWeight: '700' },

  // Timeline
  timelineContainer: { paddingVertical: 4 },
  timelineRow: { flexDirection: 'row', marginBottom: 8 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.mutedLight,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  dotPassed: { backgroundColor: COLORS.primaryStrong, borderColor: COLORS.primaryStrong },
  dotBoarding: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dotDestination: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  dotActive: { borderColor: COLORS.accent },
  timelineLineV: { width: 2, flex: 1, backgroundColor: COLORS.line, marginVertical: 4 },
  lineVPassed: { backgroundColor: COLORS.primaryStrong },
  timelineRight: { flex: 1, paddingTop: 0, paddingBottom: 8 },
  timelineStopName: { ...type('small'), color: COLORS.ink },
  timelineStopNameHighlight: { fontWeight: '700', color: COLORS.accentText },
  timelineTag: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
// ─── Live states ─────────────────────────────────────────
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  gap16: { height: 16 },
  liveChipOff: { backgroundColor: COLORS.muted },
  liveDotOff: { backgroundColor: COLORS.mutedLight },
  transitBadgeWarn: { backgroundColor: COLORS.warningSoft },
  transitBadgeTextWarn: { color: COLORS.warning },
  progressSummary: { ...type('smallBold'), color: COLORS.ink, marginTop: 8 },
  emptyBtn: { marginTop: 12, alignSelf: 'center' },

  // Arrival time at every stop
  etaList: { maxHeight: 176, marginBottom: 12 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: RADII.sm },
  etaRowOn: { backgroundColor: COLORS.accentSoft },
  etaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ink },
  etaDotPassed: { backgroundColor: COLORS.mutedLight },
  etaDotOn: { backgroundColor: COLORS.accent },
  etaStop: { ...type('small'), color: COLORS.ink, flex: 1 },
  etaVal: { ...type('smallBold'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
  etaPassed: { color: COLORS.muted },
});
