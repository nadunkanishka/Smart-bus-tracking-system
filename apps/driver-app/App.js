import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LiveMap from './src/components/LiveMap';
import { request, toRoute } from './src/api';
import * as telemetry from './src/telemetry';
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
  NavigationArrowIcon,
  PhoneCallIcon,
  PlayIcon,
  RouteIcon,
  SpeedometerIcon,
  StopIcon,
  UserIcon,
} from './src/components/VectorIcons';

// ─── Constants ──────────────────────────────────────────────────────────────

const DISPATCH_PHONE = process.env.EXPO_PUBLIC_DISPATCH_PHONE || '+94 11 248 7700';
const MAX_LOG_ITEMS = 8;
const MAP_PADDING = { top: 24, bottom: 24 };

const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

function formatCoord(val) { return Number(val).toFixed(4); }

// ─── App ────────────────────────────────────────────────────────────────────

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

  // Live telemetry state (connection, duty, offline queue, last GPS fix) comes from src/telemetry.js
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
        <AuthLayout
          scene="driver"
          brand="SmartBus Driver"
          tagline="Broadcast live GPS to passengers"
          title="Driver sign in"
          subtitle="Enter your bus registration details."
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
          <Button title="Sign in" onPress={handleLogin} loading={loginLoading} />
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

// ─── Duty Screen ──────────────────────────────────────────────────────────────
// Intentionally minimal: one large On Duty / Off Duty toggle and the status a driver needs at a glance.

function ShiftScreen({
  isOnShift, busy, hasRoute, busRegistration, driverName, routeLabel, routeNumber, nextStop,
  busSpeed, gpsStatus, connected, queued, mode, onToggleShift,
}) {
  const gpsOk = gpsStatus === 'Connected';
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.routeScroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>{busRegistration}</Text>
        <Text style={D.screenSubHeader}>{driverName ? `${driverName} · ` : ''}{routeNumber}</Text>
        {/* CHANGED (illustration only): the bus shows a z while off duty; the toggle text still states the status. */}
        <Vehicle name="bus" status={isOnShift ? undefined : 'idle'} running={isOnShift} width={124} style={D.headerBus} />
      </OverlapHeader>

      <OverlapSheet>
        {!hasRoute ? (
          <Banner tone="danger">This bus has no route with a map path and stops yet. Ask the admin to assign one before going on duty.</Banner>
        ) : null}

        <Pressable
          onPress={onToggleShift}
          disabled={busy || (!hasRoute && !isOnShift)}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOnShift, busy, disabled: !hasRoute && !isOnShift }}
          accessibilityLabel={isOnShift ? 'On duty. Tap to go off duty' : 'Off duty. Tap to go on duty'}
          style={({ pressed }) => [
            D.dutyBtn,
            isOnShift ? D.dutyBtnOn : D.dutyBtnOff,
            !hasRoute && !isOnShift && D.dutyBtnDisabled,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={D.dutyIcon}>
            {busy
              ? <ActivityIndicator color={COLORS.ink} />
              : isOnShift ? <StopIcon color={COLORS.ink} size={24} /> : <PlayIcon color={COLORS.ink} size={24} />}
          </View>
          <Text style={D.dutyState}>{isOnShift ? 'ON DUTY' : 'OFF DUTY'}</Text>
          <Text style={D.dutyHint}>{isOnShift ? 'Tap to go off duty' : 'Tap to go on duty'}</Text>
        </Pressable>

        {/* Three-column status panel */}
        <View style={D.specsRow}>
          <View style={D.specBlock}>
            <Text style={D.specLabel}>Server</Text>
            <Text style={[D.specVal, { color: connected ? COLORS.success : COLORS.danger }]}>{connected ? 'Connected' : 'Offline'}</Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>GPS</Text>
            <Text style={[D.specVal, { color: gpsOk ? COLORS.success : isOnShift ? COLORS.warning : COLORS.muted }]}>
              {isOnShift ? gpsStatus : 'Off'}
            </Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>Buffered</Text>
            <Text style={[D.specVal, { color: queued ? COLORS.warning : COLORS.ink }]}>{queued}</Text>
          </View>
        </View>

        {queued > 0 ? (
          <Text style={D.dutyNote}>
            {connected ? 'Sending saved positions…' : `No connection. ${queued} position${queued === 1 ? '' : 's'} saved and will be sent when the signal returns.`}
          </Text>
        ) : null}

        {isOnShift ? (
          <View style={D.profileCard}>
            <PRow label="Route" value={routeLabel} />
            <PRow label="Next stop" value={nextStop || '—'} accent />
            <PRow label="Speed" value={`${busSpeed} km/h`} />
            <PRow label="Tracking" value={mode === 'background' ? 'Continues with the screen off' : 'While this screen is open'} last />
          </View>
        ) : null}
      </OverlapSheet>
    </ScrollView>
  );
}

// ─── Route Screen ────────────────────────────────────────────────────────────

function RouteScreen({ route, busMarkers, routeNumber, routeLabel, routeStops, currentStopIndex, isOnShift }) {
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>Route Overview</Text>
        <Text style={D.screenSubHeader}>{routeNumber} · {routeStops.length} stops</Text>
        <Vehicle name="bus" width={124} style={D.headerBus} label="Illustrated city bus" />
      </OverlapHeader>

      <OverlapSheet>
        {/* Route Badge Card: pastel gradient */}
        <GradientCard tint="bus" style={D.routeHeaderCardWrap}>
          <View style={D.routeHeaderCard}>
            <View style={D.routeHeaderLeft}>
              <View style={D.routeNumBadge}>
                <Text style={D.routeNumText}>{route?.number || '–'}</Text>
              </View>
              <View style={D.flex}>
                <Text style={D.routeCardLabel}>{routeNumber}</Text>
                <Text style={D.routeCardSub} numberOfLines={2}>{routeLabel}</Text>
              </View>
            </View>
            <View style={[D.statusPill, isOnShift ? D.statusPillActive : D.statusPillOff]}>
              <Text style={[D.statusPillText, isOnShift ? D.statusPillTextActive : D.statusPillTextOff]}>
                {isOnShift ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
          </View>
        </GradientCard>

        {route?.trackable ? (
          <View style={D.mapCard}>
            <LiveMap path={route.path} stops={route.stopPoints} buses={busMarkers} highlightStop={isOnShift ? currentStopIndex : -1} padding={MAP_PADDING} />
          </View>
        ) : null}

        {/* Stop Timeline */}
        <Text style={D.sectionLabel}>Stop timeline</Text>
        <View style={D.timelineCard}>
          {routeStops.length === 0 ? (
            <View style={D.emptyLogBox}>
              <Vehicle name="bus" width={100} label="No route assigned" />
              <Text style={D.emptyLog}>No route is assigned to this bus yet.</Text>
            </View>
          ) : routeStops.map((stop, idx) => {
            const isPassed = isOnShift && idx < currentStopIndex;
            const isCurrent = isOnShift && idx === currentStopIndex;
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
                    {isPassed ? 'Passed' : isCurrent ? '→ Next stop' : 'Upcoming'}
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
        <Vehicle name="minibus" livery="orange" width={108} style={D.headerBus} label="Illustrated minibus" />
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
            {driverCoordinate ? `${formatCoord(driverCoordinate.latitude)}, ${formatCoord(driverCoordinate.longitude)}` : 'No GPS fix yet'}
          </Text>
        </View>

        {/* Logs */}
        <Text style={D.sectionLabel}>GPS transmission log</Text>
        <View style={D.logCard}>
          {logs.length === 0 ? (
            <View style={D.emptyLogBox}>
              <Vehicle name="bus" status="idle" width={100} label="No GPS fixes yet" />
              <Text style={D.emptyLog}>No fixes recorded. Go on duty to broadcast.</Text>
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

function ProfileScreen({ busRegistration, driverName, routeNumber, routeLabel, isOnShift, onLogout, onOpenDispatch }) {
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
          <Text style={D.profileName}>{busRegistration}</Text>
          <Text style={D.profileSub}>{driverName || 'Commercial Transit Vehicle'}</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Vehicle Details */}
        <View style={D.profileCard}>
          <Text style={D.profileCardTitle}>Vehicle Details</Text>
          <PRow label="Registration" value={busRegistration} />
          <PRow label="Driver" value={driverName || 'Not assigned'} />
          <PRow label="Assigned Route" value={routeNumber} />
          <PRow label="Corridor" value={routeLabel} />
          <PRow label="Duty Status" value={isOnShift ? 'On duty (broadcasting)' : 'Off duty'} accent={isOnShift} last />
        </View>

        {/* Dispatch Contact (kept off the duty screen so it does not distract while driving) */}
        <View style={[D.dispatchCard, D.dispatchCardSpaced]}>
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
    { id: 'shift', label: 'Duty', icon: icon(NavigationArrowIcon, 18) },
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

  // ─── Duty Screen ─────────────────────────────────────────
  dutyBtn: { minHeight: 220, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, padding: 24, ...SHADOWS.md },
  dutyBtnOn: { backgroundColor: COLORS.success },
  dutyBtnOff: { backgroundColor: COLORS.ink },
  dutyBtnDisabled: { opacity: 0.5 },
  dutyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dutyState: { ...type('display'), color: COLORS.white, letterSpacing: 1 },
  dutyHint: { ...type('body'), color: COLORS.white },
  dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: 16 },
  mapCard: { height: 260, borderRadius: RADII.lg, overflow: 'hidden', marginTop: 16, backgroundColor: COLORS.surfaceSoft, ...SHADOWS.sm },

  specsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADII.lg, paddingVertical: 16, marginBottom: 16, ...SHADOWS.sm,
  },
  specBlock: { flex: 1, alignItems: 'center', gap: 4 },
  specDivider: { width: 1, height: 32, backgroundColor: COLORS.line },
  specLabel: { ...type('caption'), color: COLORS.muted },
  specVal: { ...type('bodyBold'), color: COLORS.ink, textAlign: 'center' },

  dispatchCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: 12,
  },
  dispatchCardSpaced: { backgroundColor: COLORS.surface, marginBottom: 16, padding: 16, borderRadius: RADII.lg, ...SHADOWS.sm },
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
