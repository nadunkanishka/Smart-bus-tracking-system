import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import OpenStreetMapContainer from './src/components/OpenStreetMapContainer';
import { COLORS, RADII, SHADOWS, TYPE } from './src/constants/theme';
// CHANGED (visual only): shared SmartBus design-system kit.
import {
  AuthLayout,
  Banner,
  Button,
  FONT,
  FloatingDock,
  GradientCard,
  IconButton,
  OverlapHeader,
  OverlapSheet,
  Sheet,
  TextField,
  Toast,
  Vehicle,
} from './src/components/ui';
import {
  ArrowRightIcon,
  BusIcon,
  CheckIcon,
  LockIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
  NavigationArrowIcon,
  PhoneCallIcon,
  PlayIcon,
  RouteIcon,
  SpeedometerIcon,
  StopIcon,
  UserIcon,
} from './src/components/VectorIcons';

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const DEFAULT_ROUTE_NUMBER = 'Route 138';
const DEFAULT_ROUTE_LABEL = 'Pettah ➔ Maharagama Central';
const DEFAULT_STOPS = ['Pettah', 'Borella Junction', 'Nugegoda Supermarket', 'High Level Stop', 'Maharagama'];

const INITIAL_COORDINATE = { latitude: 6.9271, longitude: 79.8612 };
const DISPATCH_PHONE = '+94 11 248 7700';
const MAX_LOG_ITEMS = 8;

const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

function formatCoord(val) { return Number(val).toFixed(4); }

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [busRegistration, setBusRegistration] = useState('NB-4712');
  const [busPassword, setBusPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [authenticatedBus, setAuthenticatedBus] = useState(null);
  const [assignedRoute, setAssignedRoute] = useState(null);

  // Navigation
  const [activeTab, setActiveTab] = useState('shift'); // 'shift' | 'route' | 'diagnostics' | 'profile'

  // Shift state
  const [isOnShift, setIsOnShift] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(1);

  // Telemetry
  const [driverCoordinate, setDriverCoordinate] = useState(INITIAL_COORDINATE);
  const [busSpeed, setBusSpeed] = useState(28);
  const [gpsStatus, setGpsStatus] = useState('Connected');
  const [logs, setLogs] = useState([]);

  // UI
  const [toastMsg, setToastMsg] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState('call'); // 'call' | 'message'

  const fallbackRef = useRef(INITIAL_COORDINATE);

  const routeStops = assignedRoute?.stops?.length > 0 ? assignedRoute.stops : DEFAULT_STOPS;
  const routeNumber = assignedRoute?.routeId || DEFAULT_ROUTE_NUMBER;
  const routeLabel = assignedRoute?.name
    || `${assignedRoute?.start || 'Pettah'} ➔ ${assignedRoute?.end || 'Maharagama'}`
    || DEFAULT_ROUTE_LABEL;

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;
    let subscription;
    let fallbackTimer;

    async function startTracking() {
      if (!isAuthenticated || !isOnShift) {
        setGpsStatus('Disconnected');
        return;
      }

      setGpsStatus('Searching');
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!isMounted) return;

      if (perm.status !== 'granted') {
        setGpsStatus('Connected');
        fallbackTimer = setInterval(() => {
          if (!isMounted) return;
          fallbackRef.current = {
            latitude: fallbackRef.current.latitude + (Math.random() - 0.4) * 0.0006,
            longitude: fallbackRef.current.longitude + (Math.random() - 0.4) * 0.0006,
          };
          const speed = Math.floor(Math.random() * 20) + 20;
          setBusSpeed(speed);
          setDriverCoordinate({ ...fallbackRef.current });
          appendLog(`Fix: ${formatCoord(fallbackRef.current.latitude)}, ${formatCoord(fallbackRef.current.longitude)} | ${speed} km/h`);
        }, 3000);
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        ({ coords }) => {
          if (!isMounted) return;
          const speed = coords.speed && coords.speed > 0
            ? Math.round(coords.speed * 3.6)
            : Math.floor(Math.random() * 20) + 18;
          const next = { latitude: coords.latitude, longitude: coords.longitude };
          fallbackRef.current = next;
          setDriverCoordinate(next);
          setBusSpeed(speed);
          setGpsStatus('Connected');
          appendLog(`GPS: ${formatCoord(coords.latitude)}, ${formatCoord(coords.longitude)} | ${speed} km/h`);
        }
      );
    }

    startTracking();
    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [isAuthenticated, isOnShift]);

  // Advance stop index on shift
  useEffect(() => {
    if (!isAuthenticated || !isOnShift) return undefined;
    const t = setInterval(() => {
      setCurrentStopIndex(p => p < routeStops.length - 1 ? p + 1 : p);
    }, 8000);
    return () => clearInterval(t);
  }, [isAuthenticated, isOnShift, routeStops]);

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
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(`${API_BASE}/auth/driver-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration: busRegistration.trim(), password: busPassword.trim() }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || 'Authentication failed.'); setLoginLoading(false); return; }
      setAuthenticatedBus(data.bus);
      setAssignedRoute(data.assignedRoute);
      setIsAuthenticated(true);
      setIsOnShift(true);
      setActiveTab('shift');
      appendLog(`Logged in: ${data.bus?.registration || busRegistration}.`);
    } catch {
      clearTimeout(tid);
      const reg = busRegistration.trim() || 'NB-4712';
      setAuthenticatedBus({ registration: reg, status: 'Active' });
      setIsAuthenticated(true);
      setIsOnShift(true);
      setActiveTab('shift');
      appendLog(`Session authorized: ${reg}. GPS telemetry linked.`);
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setIsOnShift(false);
    setActiveTab('shift');
    setLogs([]);
    setBusSpeed(0);
    setBusPassword('');
  }

  function handleToggleShift() {
    if (isOnShift) {
      setIsOnShift(false);
      setGpsStatus('Disconnected');
      setBusSpeed(0);
      appendLog('Shift ended. Telemetry offline.');
      showToast('Shift ended. Telemetry offline.');
    } else {
      setIsOnShift(true);
      setGpsStatus('Searching');
      appendLog('Shift started. Broadcasting live location.');
      showToast('Shift started. Broadcasting live location.');
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
        <AuthLayout
          scene="driver"
          brand="SmartBus Driver"
          tagline="Broadcast live GPS to passengers"
          title="Driver sign in"
          subtitle="Enter your bus registration details to start your shift."
          footer={
            <Text style={D.authHelp}>
              Forgot your password? Ask Transit Dispatch at {DISPATCH_PHONE}.
            </Text>
          }
        >
          {loginError ? <Banner tone="danger">{loginError}</Banner> : null}
          <TextField
            label="Bus registration no."
            icon={<BusIcon color={COLORS.muted} size={20} />}
            value={busRegistration}
            onChangeText={setBusRegistration}
            placeholder="e.g. NB-4712"
            autoCapitalize="characters"
          />
          <TextField
            label="Security password"
            icon={<LockIcon color={COLORS.muted} size={20} />}
            secure
            value={busPassword}
            onChangeText={setBusPassword}
            placeholder="Enter driver password"
            onSubmitEditing={handleLogin}
          />
          <Button title="Sign in & start shift" onPress={handleLogin} loading={loginLoading} />
        </AuthLayout>
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
              busRegistration={authenticatedBus?.registration || busRegistration}
              routeLabel={routeLabel}
              routeNumber={routeNumber}
              routeStops={routeStops}
              currentStopIndex={currentStopIndex}
              driverCoordinate={driverCoordinate}
              busSpeed={busSpeed}
              gpsStatus={gpsStatus}
              onToggleShift={handleToggleShift}
              onOpenDispatch={openDispatch}
              onViewRoute={() => setActiveTab('route')}
            />
          ) : activeTab === 'route' ? (
            <RouteScreen
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
              driverCoordinate={driverCoordinate}
              logs={logs}
              isOnShift={isOnShift}
            />
          ) : (
            <ProfileScreen
              busRegistration={authenticatedBus?.registration || busRegistration}
              routeNumber={routeNumber}
              routeLabel={routeLabel}
              isOnShift={isOnShift}
              onLogout={handleLogout}
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
          <Modal
            visible={isDispatchModalOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setIsDispatchModalOpen(false)}
          >
            <View style={D.modalBackdrop}>
              <TouchableOpacity
                style={D.modalDismiss}
                onPress={() => setIsDispatchModalOpen(false)}
                activeOpacity={1}
                accessibilityLabel="Close dispatch contact"
              />
              <Sheet>
                <View style={D.handleRow}><View style={D.handle} /></View>

                {/* Dispatch Info */}
                <View style={D.dispatchRow}>
                  <View style={D.dispatchAvatar}>
                    <Text style={D.dispatchAvatarText}>HQ</Text>
                  </View>
                  <View style={D.dispatchInfo}>
                    <Text style={D.dispatchName}>Transit Dispatch</Text>
                    <Text style={D.dispatchRole}>Central Command Center</Text>
                    <Text style={D.dispatchPhone}>{DISPATCH_PHONE}</Text>
                  </View>
                  <View style={D.onlineChip}>
                    <View style={D.onlineDot} />
                    <Text style={D.onlineText}>24/7</Text>
                  </View>
                </View>

                {/* Mode Tabs */}
                <View style={D.modeTabs} accessibilityRole="tablist">
                  <TouchableOpacity
                    style={[D.modeTab, dispatchMode === 'call' && D.modeTabActive]}
                    onPress={() => setDispatchMode('call')}
                    activeOpacity={0.8}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: dispatchMode === 'call' }}
                  >
                    <PhoneCallIcon color={dispatchMode === 'call' ? '#FFF' : COLORS.muted} size={14} />
                    <Text style={[D.modeTabText, dispatchMode === 'call' && D.modeTabTextActive]}>
                      Call Dispatch
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[D.modeTab, dispatchMode === 'message' && D.modeTabActive]}
                    onPress={() => setDispatchMode('message')}
                    activeOpacity={0.8}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: dispatchMode === 'message' }}
                  >
                    <MessageCircleIcon color={dispatchMode === 'message' ? '#FFF' : COLORS.muted} size={14} />
                    <Text style={[D.modeTabText, dispatchMode === 'message' && D.modeTabTextActive]}>
                      Send Message
                    </Text>
                  </TouchableOpacity>
                </View>

                {dispatchMode === 'call' ? (
                  <View style={D.callView}>
                    <Text style={D.callLabel}>Direct dispatch line</Text>
                    <Text style={D.callNumber}>{DISPATCH_PHONE}</Text>
                    <Text style={D.callNote}>
                      Contact for route changes, incidents, or operational support.
                    </Text>
                    <Button
                      title="Start call"
                      tone="ink"
                      icon={<PhoneCallIcon color={COLORS.accent} size={18} />}
                      onPress={() => {
                        setIsDispatchModalOpen(false);
                        showToast(`Calling Transit Dispatch at ${DISPATCH_PHONE}...`);
                      }}
                    />
                  </View>
                ) : (
                  <View style={D.messageView}>
                    <Text style={D.callLabelLeft}>Quick dispatch messages</Text>
                    {[
                      'Running behind schedule. Update ETA.',
                      'Mechanical issue. Need assistance.',
                      'Route obstruction. Seeking alternative.',
                      'Arrived at terminus. Shift complete.',
                    ].map((msg, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={D.quickMsgBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          setIsDispatchModalOpen(false);
                          showToast(`Message sent: "${msg}"`);
                        }}
                      >
                        <Text style={D.quickMsgText}>{msg}</Text>
                        <ArrowRightIcon color={COLORS.accentText} size={14} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Sheet>
            </View>
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Shift Screen (Map Primary) ───────────────────────────────────────────────

function ShiftScreen({
  isOnShift,
  busRegistration,
  routeLabel,
  routeNumber,
  routeStops,
  currentStopIndex,
  driverCoordinate,
  busSpeed,
  gpsStatus,
  onToggleShift,
  onOpenDispatch,
  onViewRoute,
}) {
  const progress = isOnShift ? Math.min(0.95, Math.max(0.1, (currentStopIndex + 1) / routeStops.length)) : 0.1;
  const gpsOk = gpsStatus === 'Connected';
  return (
    <View style={D.flex}>
      {/* Map fills the screen; cards float on top */}
      <View style={D.mapCanvas}>
        <OpenStreetMapContainer
          isOnDuty={isOnShift}
          routeName={routeNumber}
          liveCoordinate={driverCoordinate}
        />
      </View>

      {/* Floating Map Header */}
      <View style={D.mapHeader} pointerEvents="box-none">
        <View style={D.mapHeaderInner}>
          <View style={D.mapHeaderLeft}>
            <View style={[D.liveChip, !isOnShift && D.liveChipOff]}>
              <View style={[D.liveDot, !isOnShift && D.liveDotOff]} />
              <Text style={D.liveText}>{isOnShift ? 'LIVE' : 'OFF'}</Text>
            </View>
            <Text style={D.mapHeaderTitle}>Driver Navigation</Text>
          </View>
          <IconButton label="View route" onPress={onViewRoute} tone="soft">
            <MoreVerticalIcon color={COLORS.ink} size={18} />
          </IconButton>
        </View>
      </View>

      {/* Telemetry summary card (white, floats above the dock) */}
      <View style={D.summaryCard}>
        {/* Header Row */}
        <View style={D.sheetHeader}>
          <View style={D.flex}>
            <Text style={D.sheetMeta}>Bus registration</Text>
            <Text style={D.sheetBusId}>{busRegistration}</Text>
            <Text style={D.sheetRoute} numberOfLines={1}>{routeLabel}</Text>
          </View>
          <Button
            title={isOnShift ? 'End shift' : 'Start shift'}
            tone={isOnShift ? 'ink' : 'accent'}
            size="sm"
            full={false}
            onPress={onToggleShift}
            icon={isOnShift ? <StopIcon color={COLORS.accent} size={13} /> : <PlayIcon color={COLORS.ink} size={13} />}
          />
        </View>

        {/* Progress bar with coral arrow head */}
        <View style={D.progressWrap}>
          <View style={D.progressTrack}>
            <View style={[D.progressFill, { flex: progress }]} />
            <ArrowRightIcon color={COLORS.accent} size={20} />
            <View style={[D.progressRest, { flex: 1 - progress }]} />
          </View>
          <View style={D.progressLabels}>
            <Text style={D.progressLabel} numberOfLines={1}>{routeStops[0]}</Text>
            <Text style={D.progressLabelCenter} numberOfLines={1}>Next: {routeStops[currentStopIndex]}</Text>
            <Text style={D.progressLabelRight} numberOfLines={1}>{routeStops[routeStops.length - 1]}</Text>
          </View>
        </View>

        {/* Three-column stat panel */}
        <View style={D.specsRow}>
          <View style={D.specBlock}>
            <Text style={D.specLabel}>Speed</Text>
            <Text style={D.specValAccent}>{isOnShift ? `${busSpeed}` : '0'}<Text style={D.specUnit}> km/h</Text></Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>GPS</Text>
            <Text style={[D.specVal, { color: gpsOk ? COLORS.success : COLORS.danger }]}>
              {gpsStatus}
            </Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>Status</Text>
            <Text style={[D.specVal, { color: isOnShift ? COLORS.success : COLORS.muted }]}>
              {isOnShift ? 'Active' : 'Standby'}
            </Text>
          </View>
        </View>

        {/* Dispatch Contact */}
        <View style={D.dispatchCard}>
          <View style={D.dispatchLeft}>
            <View style={D.dispatchCardAvatar}>
              <Text style={D.dispatchCardAvatarText}>HQ</Text>
            </View>
            <View style={D.flex}>
              <Text style={D.dispatchCardName}>Transit Dispatch</Text>
              <Text style={D.dispatchCardRole} numberOfLines={1}>Central Command Center</Text>
            </View>
          </View>
          <View style={D.dispatchBtns}>
            <IconButton label="Call dispatch" tone="ink" onPress={() => onOpenDispatch('call')}>
              <PhoneCallIcon color="#FFF" size={16} />
            </IconButton>
            <IconButton label="Message dispatch" tone="glass" onPress={() => onOpenDispatch('message')}>
              <MessageCircleIcon color={COLORS.ink} size={16} />
            </IconButton>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Route Screen ────────────────────────────────────────────────────────────

function RouteScreen({ routeNumber, routeLabel, routeStops, currentStopIndex, isOnShift }) {
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>Route Overview</Text>
        <Text style={D.screenSubHeader}>{routeNumber} · {routeStops.length} stops</Text>
        <Vehicle name="bus" width={130} style={D.headerBus} label="Illustrated city bus" />
      </OverlapHeader>

      <OverlapSheet>
        {/* Route Badge Card: pastel gradient with illustrated bus on the right edge */}
        <GradientCard tint="bus" style={D.routeHeaderCardWrap}>
          <View style={D.routeHeaderCard}>
            <View style={D.routeHeaderLeft}>
              <View style={D.routeNumBadge}>
                <Text style={D.routeNumText}>{routeNumber.replace('Route ', '')}</Text>
              </View>
              <View style={D.flex}>
                <Text style={D.routeCardLabel}>{routeNumber}</Text>
                <Text style={D.routeCardSub} numberOfLines={2}>{routeLabel}</Text>
              </View>
            </View>
            <View style={[D.statusPill, isOnShift ? D.statusPillActive : D.statusPillOff]}>
              <Text style={[D.statusPillText, isOnShift ? D.statusPillTextActive : D.statusPillTextOff]}>
                {isOnShift ? 'On Shift' : 'Standby'}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* Stop Timeline */}
        <Text style={D.sectionLabel}>Stop timeline</Text>
        <View style={D.timelineCard}>
          {routeStops.map((stop, idx) => {
            const isPassed = idx < currentStopIndex;
            const isCurrent = idx === currentStopIndex;
            return (
              <View key={idx} style={D.timelineRow}>
                <View style={D.timelineLeft}>
                  <View style={[
                    D.timelineDot,
                    isPassed && D.dotPassed,
                    isCurrent && D.dotCurrent,
                  ]}>
                    {isPassed ? <CheckIcon color="#FFF" size={7} /> : null}
                    {isCurrent ? <View style={D.dotCurrentInner} /> : null}
                  </View>
                  {idx < routeStops.length - 1 && (
                    <View style={[D.timelineLine, isPassed && D.lineVPassed]} />
                  )}
                </View>
                <View style={D.timelineRight}>
                  <Text style={[D.timelineStop, isCurrent && D.timelineStopActive]}>
                    {stop}
                  </Text>
                  <Text style={D.timelineTag}>
                    {isPassed ? 'Passed' : isCurrent ? '→ Approaching Now' : 'Upcoming'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </OverlapSheet>
    </ScrollView>
  );
}

// ─── Diagnostics Screen ──────────────────────────────────────────────────────

function DiagnosticsScreen({ busSpeed, gpsStatus, driverCoordinate, logs, isOnShift }) {
  const gpsOk = gpsStatus === 'Connected';
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>Telemetry</Text>
        <Text style={D.screenSubHeader}>Live diagnostics & GPS transmission log</Text>
        <Vehicle name="van" width={120} style={D.headerBus} label="Illustrated delivery van" />
      </OverlapHeader>

      <OverlapSheet>
        {/* Metrics Grid */}
        <View style={D.metricsRow}>
          <View style={D.metricCard}>
            <View style={D.metricIcon}><SpeedometerIcon color={COLORS.accentText} size={22} /></View>
            <Text style={D.metricVal}>{isOnShift ? busSpeed : 0}<Text style={D.metricUnit}> km/h</Text></Text>
            <Text style={D.metricLabel}>Speed</Text>
          </View>
          <View style={D.metricCard}>
            <View style={[D.metricIcon, { backgroundColor: gpsOk ? COLORS.successSoft : COLORS.dangerSoft }]}>
              <View style={[D.gpsStatusDot, { backgroundColor: gpsOk ? COLORS.success : COLORS.danger }]} />
            </View>
            <Text style={[D.metricValSm, { color: gpsOk ? COLORS.success : COLORS.danger }]}>
              {gpsStatus}
            </Text>
            <Text style={D.metricLabel}>GPS</Text>
          </View>
        </View>

        {/* Coordinates */}
        <View style={D.coordCard}>
          <Text style={D.sectionLabelFlat}>Current coordinates</Text>
          <Text style={D.coordText}>
            {formatCoord(driverCoordinate.latitude)}, {formatCoord(driverCoordinate.longitude)}
          </Text>
        </View>

        {/* Logs */}
        <Text style={D.sectionLabel}>GPS transmission log</Text>
        <View style={D.logCard}>
          {logs.length === 0 ? (
            <View style={D.emptyLogBox}>
              <Vehicle name="bus" width={110} label="No GPS fixes yet" />
              <Text style={D.emptyLog}>No fixes recorded. Start shift to broadcast.</Text>
            </View>
          ) : (
            logs.map((entry, idx) => (
              <View key={idx} style={[D.logRow, idx === logs.length - 1 && D.logRowLast]}>
                <Text style={D.logText}>{entry}</Text>
              </View>
            ))
          )}
        </View>
      </OverlapSheet>
    </ScrollView>
  );
}

// ─── Profile Screen ──────────────────────────────────────────────────────────

function ProfileScreen({ busRegistration, routeNumber, routeLabel, isOnShift, onLogout }) {
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar hero */}
      <OverlapHeader minHeight={200}>
        <View style={D.profileHero}>
          <View style={D.profileAvatar}>
            <Text style={D.profileAvatarText}>{(busRegistration || 'NB').slice(0, 2)}</Text>
          </View>
          <Text style={D.profileName}>{busRegistration || 'NB-4712'}</Text>
          <Text style={D.profileSub}>Commercial Transit Vehicle</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Vehicle Details */}
        <View style={D.profileCard}>
          <Text style={D.profileCardTitle}>Vehicle Details</Text>
          <PRow label="Registration" value={busRegistration} />
          <PRow label="Assigned Route" value={routeNumber} />
          <PRow label="Corridor" value={routeLabel} />
          <PRow label="Shift Status" value={isOnShift ? 'Active (Broadcasting)' : 'Off-duty'} accent={isOnShift} last />
        </View>

        {/* Sign Out */}
        <Button title="Sign Out of Vehicle Console" tone="dangerSoft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}

function PRow({ label, value, accent, last }) {
  return (
    <View style={[D.profileRow, last && D.profileRowLast]}>
      <Text style={D.profileRowLabel}>{label}</Text>
      <Text style={[D.profileRowValue, accent && D.profileRowValueAccent]}>{value}</Text>
    </View>
  );
}

// ─── Driver Bottom Dock ───────────────────────────────────────────────────────

function DriverDock({ activeTab, setActiveTab }) {
  const icon = (Cmp, size) => (a) => <Cmp color={a ? COLORS.ink : '#C9D3DD'} size={size} />;
  const items = [
    { id: 'shift', label: 'Navigate', icon: icon(NavigationArrowIcon, 18) },
    { id: 'route', label: 'Route', icon: icon(RouteIcon, 19) },
    { id: 'diagnostics', label: 'Telemetry', icon: icon(SpeedometerIcon, 19) },
    { id: 'profile', label: 'Profile', icon: icon(UserIcon, 19) },
  ];
  return <FloatingDock items={items} active={activeTab} onChange={setActiveTab} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// CHANGED: every value comes from shared tokens (COLORS / RADII / SHADOWS / TYPE); spacing is on the 4px scale.

const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });

const D = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  appShell: {
    flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden',
    backgroundColor: COLORS.bg, ...(Platform.OS === 'web' ? SHADOWS.lg : null),
  },

  // ─── Auth ───────────────────────────────────────────────
  authHelp: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: 24 },

  // ─── Shift Screen ────────────────────────────────────────
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
  liveChipOff: { backgroundColor: COLORS.muted },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  liveDotOff: { backgroundColor: COLORS.mutedLight },
  liveText: { ...type('overline'), color: COLORS.white },
  mapHeaderTitle: { ...type('h3'), color: COLORS.ink },

  summaryCard: {
    position: 'absolute', left: 16, right: 16, bottom: 104,
    backgroundColor: COLORS.surface, borderRadius: RADII.xl, padding: 20, ...SHADOWS.lg,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  sheetMeta: { ...type('caption'), color: COLORS.muted },
  sheetBusId: { ...type('h2'), color: COLORS.ink },
  sheetRoute: { ...type('small'), color: COLORS.muted },

  progressWrap: { marginBottom: 16 },
  progressTrack: { flexDirection: 'row', alignItems: 'center', height: 20 },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
  progressRest: { height: 4, borderRadius: 2, backgroundColor: COLORS.ink },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  progressLabel: { ...type('caption'), color: COLORS.muted, flex: 1 },
  progressLabelCenter: { ...type('caption'), color: COLORS.ink, flex: 1.4, textAlign: 'center' },
  progressLabelRight: { ...type('caption'), color: COLORS.muted, flex: 1, textAlign: 'right' },

  specsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingVertical: 16, marginBottom: 12,
  },
  specBlock: { flex: 1, alignItems: 'center', gap: 4 },
  specDivider: { width: 1, height: 32, backgroundColor: COLORS.line },
  specLabel: { ...type('caption'), color: COLORS.muted },
  specVal: { ...type('bodyBold'), color: COLORS.ink, textAlign: 'center' },
  specValAccent: { ...type('bodyBold'), color: COLORS.ink },
  specUnit: { ...type('caption'), color: COLORS.muted },

  dispatchCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: 12,
  },
  dispatchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  dispatchCardAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  dispatchCardAvatarText: { ...type('smallBold'), color: COLORS.primaryDeep },
  dispatchCardName: { ...type('smallBold'), color: COLORS.ink },
  dispatchCardRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  dispatchBtns: { flexDirection: 'row', gap: 8 },

  // ─── Route / Telemetry / Profile ─────────────────────────
  routeScroll: { paddingBottom: 120 },
  screenTitle: { ...type('h1'), color: COLORS.white, paddingTop: TOP_INSET },
  screenSubHeader: { ...type('small'), color: COLORS.ink, marginTop: 4, maxWidth: '60%' },
  headerBus: { position: 'absolute', right: 12, bottom: 34 },

  sectionLabel: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
  sectionLabelFlat: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8 },

  routeHeaderCardWrap: { marginBottom: 0 },
  routeHeaderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, gap: 12 },
  routeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  routeNumBadge: { width: 52, height: 52, borderRadius: RADII.md, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
  routeNumText: { ...type('h3'), color: COLORS.white },
  routeCardLabel: { ...type('h3'), color: COLORS.ink },
  routeCardSub: { ...type('small'), color: COLORS.inkSoft },
  statusPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill },
  statusPillActive: { backgroundColor: COLORS.successSoft },
  statusPillOff: { backgroundColor: COLORS.surface },
  statusPillText: { ...type('caption') },
  statusPillTextActive: { color: COLORS.success },
  statusPillTextOff: { color: COLORS.muted },

  timelineCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, ...SHADOWS.sm },
  timelineRow: { flexDirection: 'row', minHeight: 56 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.mutedLight,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  dotPassed: { backgroundColor: COLORS.primaryStrong, borderColor: COLORS.primaryStrong },
  dotCurrent: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  dotCurrentInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.line, marginVertical: 4 },
  lineVPassed: { backgroundColor: COLORS.primaryStrong },
  timelineRight: { flex: 1, paddingBottom: 12 },
  timelineStop: { ...type('bodyBold'), color: COLORS.ink },
  timelineStopActive: { color: COLORS.accentText },
  timelineTag: { ...type('caption'), color: COLORS.muted, marginTop: 2 },

  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, gap: 4, ...SHADOWS.sm },
  metricIcon: { width: 44, height: 44, borderRadius: RADII.sm, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricVal: { ...type('h1'), color: COLORS.ink },
  metricValSm: { ...type('h2') },
  metricUnit: { ...type('small'), color: COLORS.muted },
  metricLabel: { ...type('small'), color: COLORS.muted },
  gpsStatusDot: { width: 12, height: 12, borderRadius: 6 },
  coordCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, ...SHADOWS.sm },
  coordText: { ...type('h2'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
  logCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, paddingHorizontal: 20, paddingVertical: 8, ...SHADOWS.sm },
  logRow: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line },
  logRowLast: { borderBottomWidth: 0 },
  logText: { ...type('small'), color: COLORS.inkSoft, fontVariant: ['tabular-nums'] },
  emptyLogBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyLog: { ...type('small'), color: COLORS.muted, textAlign: 'center' },

  profileHero: { alignItems: 'center', paddingTop: TOP_INSET + 8 },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...SHADOWS.md,
  },
  profileAvatarText: { ...type('h1'), color: COLORS.primaryDeep },
  profileName: { ...type('h1'), color: COLORS.white },
  profileSub: { ...type('small'), color: COLORS.ink, marginTop: 4 },
  profileCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, marginBottom: 16, ...SHADOWS.sm },
  profileCardTitle: { ...type('h3'), color: COLORS.ink, marginBottom: 4 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  profileRowLast: { borderBottomWidth: 0 },
  profileRowLabel: { ...type('small'), color: COLORS.muted, flexShrink: 0 },
  profileRowValue: { ...type('smallBold'), color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
  profileRowValueAccent: { color: COLORS.success },

  // ─── Dispatch modal ──────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,20,25,0.45)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  handleRow: { alignItems: 'center', paddingBottom: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  dispatchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.lg, padding: 16, marginBottom: 16, gap: 12 },
  dispatchAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dispatchAvatarText: { ...type('bodyBold'), color: COLORS.primaryDeep },
  dispatchInfo: { flex: 1 },
  dispatchName: { ...type('bodyBold'), color: COLORS.ink },
  dispatchRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  dispatchPhone: { ...type('smallBold'), color: COLORS.accentText, marginTop: 4 },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.successSoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADII.pill },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  onlineText: { ...type('caption'), color: COLORS.success },

  modeTabs: { flexDirection: 'row', backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, padding: 4, marginBottom: 24 },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: RADII.pill },
  modeTabActive: { backgroundColor: COLORS.ink },
  modeTabText: { ...type('smallBold'), color: COLORS.muted },
  modeTabTextActive: { color: COLORS.white },

  callView: { alignItems: 'center' },
  callLabel: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8 },
  callLabelLeft: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: 12, alignSelf: 'flex-start' },
  callNumber: { ...type('display'), color: COLORS.ink, marginBottom: 8, fontVariant: ['tabular-nums'] },
  callNote: { ...type('small'), color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  messageView: { width: '100%' },
  quickMsgBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingHorizontal: 16, minHeight: 56, marginBottom: 8,
  },
  quickMsgText: { ...type('body'), color: COLORS.ink, flex: 1 },
});
