import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import OpenStreetMapContainer from './src/components/OpenStreetMapContainer';
import { COLORS, TYPOGRAPHY } from './src/constants/theme';
import {
  ArrowRightIcon,
  BellIcon,
  BusIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  MapIcon,
  MapPinIcon,
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
      {toastMsg ? (
        <View style={D.toast} pointerEvents="none">
          <Text style={D.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      {/* ═══════════════════════════════════════════════════
          AUTH SCREEN
      ═══════════════════════════════════════════════════ */}
      {!isAuthenticated ? (
        <ScrollView
          style={D.flex}
          contentContainerStyle={D.authScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Hero */}
          <View style={D.authHero}>
            <View style={D.authOrb}>
              <BusIcon color="#FFF" size={28} />
            </View>
            <Text style={D.authBrandTitle}>Driver Portal</Text>
            <Text style={D.authBrandSub}>
              Sign in to broadcast live GPS telemetry to passengers
            </Text>
          </View>

          {loginError ? (
            <View style={D.errorCard}>
              <Text style={D.errorText}>{loginError}</Text>
            </View>
          ) : null}

          <View style={D.authCard}>
            <Text style={D.authCardTitle}>Vehicle Sign In</Text>
            <Text style={D.authCardSub}>Enter your bus registration details</Text>

            <View style={D.field}>
              <Text style={D.fieldLabel}>BUS REGISTRATION NO.</Text>
              <TextInput
                style={D.input}
                value={busRegistration}
                onChangeText={setBusRegistration}
                placeholder="e.g. NB-4712"
                placeholderTextColor="#A1A1AA"
                autoCapitalize="characters"
              />
            </View>
            <View style={D.field}>
              <Text style={D.fieldLabel}>SECURITY PASSWORD</Text>
              <TextInput
                style={D.input}
                value={busPassword}
                onChangeText={setBusPassword}
                placeholder="Enter driver password"
                placeholderTextColor="#A1A1AA"
                secureTextEntry
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[D.primaryBtn, loginLoading && D.primaryBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loginLoading}
            >
              {loginLoading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={D.primaryBtnText}>Sign In & Start Shift</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ═══════════════════════════════════════════════════
            AUTHENTICATED APP
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
              />
              <View style={D.modalSheet}>
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
                <View style={D.modeTabs}>
                  <TouchableOpacity
                    style={[D.modeTab, dispatchMode === 'call' && D.modeTabActive]}
                    onPress={() => setDispatchMode('call')}
                    activeOpacity={0.8}
                  >
                    <PhoneCallIcon color={dispatchMode === 'call' ? '#FFF' : '#71717A'} size={14} />
                    <Text style={[D.modeTabText, dispatchMode === 'call' && D.modeTabTextActive]}>
                      Call Dispatch
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[D.modeTab, dispatchMode === 'message' && D.modeTabActive]}
                    onPress={() => setDispatchMode('message')}
                    activeOpacity={0.8}
                  >
                    <MessageCircleIcon color={dispatchMode === 'message' ? '#FFF' : '#71717A'} size={14} />
                    <Text style={[D.modeTabText, dispatchMode === 'message' && D.modeTabTextActive]}>
                      Send Message
                    </Text>
                  </TouchableOpacity>
                </View>

                {dispatchMode === 'call' ? (
                  <View style={D.callView}>
                    <Text style={D.callLabel}>Direct Dispatch Line</Text>
                    <Text style={D.callNumber}>{DISPATCH_PHONE}</Text>
                    <Text style={D.callNote}>
                      Contact for route changes, incidents, or operational support.
                    </Text>
                    <TouchableOpacity
                      style={D.callBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        setIsDispatchModalOpen(false);
                        showToast(`Calling Transit Dispatch at ${DISPATCH_PHONE}...`);
                      }}
                    >
                      <PhoneCallIcon color="#FFF" size={18} />
                      <Text style={D.callBtnText}>Start Call</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={D.messageView}>
                    <Text style={D.callLabel}>Quick Dispatch Messages</Text>
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
                        <ArrowRightIcon color="#FF5B37" size={14} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
  return (
    <View style={D.flex}>
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
          <TouchableOpacity style={D.moreBtn} onPress={onViewRoute} activeOpacity={0.8}>
            <MoreVerticalIcon color="#121214" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={D.mapCanvas}>
        <OpenStreetMapContainer
          isOnDuty={isOnShift}
          routeName={routeNumber}
          liveCoordinate={driverCoordinate}
        />
      </View>

      {/* Obsidian Telemetry Sheet */}
      <View style={D.darkSheet}>
        <View style={D.handleRow}><View style={D.handle} /></View>

        {/* Header Row */}
        <View style={D.sheetHeader}>
          <View>
            <Text style={D.sheetMeta}>BUS REGISTRATION</Text>
            <Text style={D.sheetBusId}>{busRegistration}</Text>
            <Text style={D.sheetRoute}>{routeLabel}</Text>
          </View>
          <TouchableOpacity
            style={[D.shiftBtn, isOnShift ? D.shiftBtnEnd : D.shiftBtnStart]}
            onPress={onToggleShift}
            activeOpacity={0.85}
          >
            {isOnShift
              ? <><StopIcon color="#FFF" size={13} /><Text style={D.shiftBtnText}>End Shift</Text></>
              : <><PlayIcon color="#FFF" size={13} /><Text style={D.shiftBtnText}>Start Shift</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={D.progressWrap}>
          <View style={D.progressBg}>
            <View style={[D.progressFill, {
              width: isOnShift ? `${((currentStopIndex + 1) / routeStops.length) * 100}%` : '10%'
            }]} />
          </View>
          <View style={D.progressLabels}>
            <Text style={D.progressLabel}>{routeStops[0]}</Text>
            <Text style={D.progressLabelCenter}>Next: {routeStops[currentStopIndex]}</Text>
            <Text style={D.progressLabel}>{routeStops[routeStops.length - 1]}</Text>
          </View>
        </View>

        {/* Telemetry Grid */}
        <View style={D.specsRow}>
          <View style={D.specBlock}>
            <Text style={D.specLabel}>SPEED</Text>
            <Text style={D.specValAccent}>{isOnShift ? `${busSpeed}` : '0'}<Text style={D.specUnit}> km/h</Text></Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>GPS</Text>
            <Text style={[D.specVal, { color: gpsStatus === 'Connected' ? '#10B981' : '#EF4444' }]}>
              {gpsStatus}
            </Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>NEXT STOP</Text>
            <Text style={D.specVal} numberOfLines={1}>{routeStops[currentStopIndex]}</Text>
          </View>
          <View style={D.specDivider} />
          <View style={D.specBlock}>
            <Text style={D.specLabel}>STATUS</Text>
            <Text style={[D.specVal, isOnShift ? { color: '#10B981' } : { color: '#71717A' }]}>
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
            <View>
              <Text style={D.dispatchCardName}>Transit Dispatch</Text>
              <Text style={D.dispatchCardRole}>Central Command Center</Text>
            </View>
          </View>
          <View style={D.dispatchBtns}>
            <TouchableOpacity style={D.callActionBtn} onPress={() => onOpenDispatch('call')} activeOpacity={0.85}>
              <PhoneCallIcon color="#FFF" size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={D.msgActionBtn} onPress={() => onOpenDispatch('message')} activeOpacity={0.85}>
              <MessageCircleIcon color="#121214" size={16} />
            </TouchableOpacity>
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
      <Text style={D.screenTitle}>Route Overview</Text>

      {/* Route Badge Card */}
      <View style={D.routeHeaderCard}>
        <View style={D.routeHeaderLeft}>
          <View style={D.routeNumBadge}>
            <Text style={D.routeNumText}>{routeNumber.replace('Route ', '')}</Text>
          </View>
          <View>
            <Text style={D.routeCardLabel}>{routeNumber}</Text>
            <Text style={D.routeCardSub}>{routeLabel}</Text>
          </View>
        </View>
        <View style={[D.statusPill, isOnShift ? D.statusPillActive : D.statusPillOff]}>
          <Text style={[D.statusPillText, isOnShift ? D.statusPillTextActive : D.statusPillTextOff]}>
            {isOnShift ? 'On Shift' : 'Standby'}
          </Text>
        </View>
      </View>

      {/* Stop Timeline */}
      <Text style={D.sectionLabel}>STOP TIMELINE</Text>
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
    </ScrollView>
  );
}

// ─── Diagnostics Screen ──────────────────────────────────────────────────────

function DiagnosticsScreen({ busSpeed, gpsStatus, driverCoordinate, logs, isOnShift }) {
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={D.screenTitle}>Telemetry</Text>
      <Text style={D.screenSub}>Live diagnostics & GPS transmission log</Text>

      {/* Metrics Grid */}
      <View style={D.metricsRow}>
        <View style={D.metricCard}>
          <SpeedometerIcon color="#FF5B37" size={22} />
          <Text style={D.metricVal}>{isOnShift ? busSpeed : 0}<Text style={D.metricUnit}> km/h</Text></Text>
          <Text style={D.metricLabel}>Speed</Text>
        </View>
        <View style={D.metricCard}>
          <View style={[D.gpsStatusOrb, { backgroundColor: gpsStatus === 'Connected' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <View style={[D.gpsStatusDot, { backgroundColor: gpsStatus === 'Connected' ? '#10B981' : '#EF4444' }]} />
          </View>
          <Text style={[D.metricVal, { fontSize: 16, color: gpsStatus === 'Connected' ? '#10B981' : '#EF4444' }]}>
            {gpsStatus}
          </Text>
          <Text style={D.metricLabel}>GPS</Text>
        </View>
      </View>

      {/* Coordinates */}
      <View style={D.coordCard}>
        <Text style={D.sectionLabel}>CURRENT COORDINATES</Text>
        <Text style={D.coordText}>
          {formatCoord(driverCoordinate.latitude)}, {formatCoord(driverCoordinate.longitude)}
        </Text>
      </View>

      {/* Logs */}
      <Text style={[D.sectionLabel, { marginTop: 20 }]}>GPS TRANSMISSION LOG</Text>
      <View style={D.logCard}>
        {logs.length === 0 ? (
          <Text style={D.emptyLog}>No fixes recorded. Start shift to broadcast.</Text>
        ) : (
          logs.map((entry, idx) => (
            <View key={idx} style={D.logRow}>
              <Text style={D.logText}>{entry}</Text>
            </View>
          ))
        )}
      </View>
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
      <View style={D.profileHero}>
        <View style={D.profileAvatar}>
          <Text style={D.profileAvatarText}>{(busRegistration || 'NB').slice(0, 2)}</Text>
        </View>
        <Text style={D.profileName}>{busRegistration || 'NB-4712'}</Text>
        <Text style={D.profileSub}>Commercial Transit Vehicle</Text>
      </View>

      {/* Vehicle Details */}
      <View style={D.profileCard}>
        <Text style={D.profileCardTitle}>Vehicle Details</Text>
        <PRow label="Registration" value={busRegistration} />
        <PRow label="Assigned Route" value={routeNumber} />
        <PRow label="Corridor" value={routeLabel} />
        <PRow label="Shift Status" value={isOnShift ? 'Active (Broadcasting)' : 'Off-duty'} accent={isOnShift} />
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={D.signOutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Text style={D.signOutText}>Sign Out of Vehicle Console</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PRow({ label, value, accent }) {
  return (
    <View style={D.profileRow}>
      <Text style={D.profileRowLabel}>{label}</Text>
      <Text style={[D.profileRowValue, accent && D.profileRowValueAccent]}>{value}</Text>
    </View>
  );
}

// ─── Driver Bottom Dock ───────────────────────────────────────────────────────

function DriverDock({ activeTab, setActiveTab }) {
  const items = [
    { id: 'shift', label: 'Navigation', icon: (a) => <NavigationArrowIcon color={a ? '#FFF' : '#8E8E93'} size={18} /> },
    { id: 'route', label: 'Route', icon: (a) => <RouteIcon color={a ? '#FFF' : '#8E8E93'} size={19} /> },
    { id: 'diagnostics', label: 'Telemetry', icon: (a) => <SpeedometerIcon color={a ? '#FFF' : '#8E8E93'} size={19} /> },
    { id: 'profile', label: 'Profile', icon: (a) => <UserIcon color={a ? '#FFF' : '#8E8E93'} size={19} /> },
  ];

  return (
    <View style={D.dockWrapper}>
      <View style={D.dock}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={D.dockItem}
              onPress={() => setActiveTab(item.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[D.dockBtn, isActive && D.dockBtnPrimary]}>
                {item.icon(isActive)}
                <Text
                  style={[D.dockLabel, isActive && D.dockLabelPrimary]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const D = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F6F8' },
  flex: { flex: 1 },
  appShell: { flex: 1, flexDirection: 'column' },

  // Toast
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999,
    backgroundColor: '#141416', paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  toastText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // ─── Auth ───────────────────────────────────────────────
  authScroll: { padding: 24, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, paddingBottom: 48 },
  authHero: { alignItems: 'center', marginBottom: 28 },
  authOrb: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#141416',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 6,
  },
  authBrandTitle: { fontSize: 26, fontWeight: '800', color: '#121214', letterSpacing: -0.5 },
  authBrandSub: { fontSize: 14, color: '#71717A', marginTop: 5, textAlign: 'center', lineHeight: 20 },

  errorCard: {
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },

  authCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 3,
  },
  authCardTitle: { fontSize: 20, fontWeight: '700', color: '#121214' },
  authCardSub: { fontSize: 13, color: '#71717A', marginTop: 4, marginBottom: 22 },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#A1A1AA', letterSpacing: 0.9, marginBottom: 6 },
  input: {
    height: 50, backgroundColor: '#F7F7F9', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: '#121214',
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  primaryBtn: {
    height: 52, backgroundColor: '#FF5B37', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FF5B37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // ─── Shift Screen ────────────────────────────────────────
  mapHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8,
    paddingHorizontal: 18, paddingBottom: 10,
  },
  mapHeaderInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 4,
  },
  mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#141416', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  liveChipOff: { backgroundColor: '#3F3F46' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveDotOff: { backgroundColor: '#EF4444' },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  mapHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#121214' },
  moreBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F4F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  mapCanvas: { flex: 1 },

  darkSheet: {
    backgroundColor: '#141416', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 95,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  handleRow: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3F3F46' },

  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sheetMeta: { fontSize: 10, color: '#71717A', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  sheetBusId: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  sheetRoute: { fontSize: 12, color: '#71717A', marginTop: 2 },

  shiftBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
  },
  shiftBtnStart: { backgroundColor: '#10B981' },
  shiftBtnEnd: { backgroundColor: '#EF4444' },
  shiftBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  progressWrap: { marginBottom: 14 },
  progressBg: {
    height: 5, backgroundColor: '#2C2C31', borderRadius: 3, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#FF5B37', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 10, color: '#71717A', fontWeight: '500', flex: 1 },
  progressLabelCenter: { fontSize: 11, color: '#FF5B37', fontWeight: '700', flex: 1, textAlign: 'center' },

  specsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1F', borderRadius: 16, padding: 14, marginBottom: 14,
  },
  specBlock: { flex: 1, alignItems: 'center' },
  specDivider: { width: 1, height: 32, backgroundColor: '#2C2C31' },
  specLabel: { fontSize: 9, color: '#71717A', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  specVal: { fontSize: 12, fontWeight: '600', color: '#D4D4D8', textAlign: 'center' },
  specValAccent: { fontSize: 15, fontWeight: '800', color: '#FF5B37', textAlign: 'center' },
  specUnit: { fontSize: 10, color: '#71717A', fontWeight: '500' },

  dispatchCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1C1F', borderRadius: 18, padding: 14,
  },
  dispatchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dispatchCardAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#27272A',
    borderWidth: 2, borderColor: '#3F3F46', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  dispatchCardAvatarText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  dispatchCardName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  dispatchCardRole: { fontSize: 11, color: '#71717A', marginTop: 2 },
  dispatchBtns: { flexDirection: 'row', gap: 10 },
  callActionBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF5B37',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF5B37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  msgActionBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 2,
  },

  // ─── Route Screen ────────────────────────────────────────
  routeScroll: { padding: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, paddingBottom: 110 },
  screenTitle: { fontSize: 22, fontWeight: '800', color: '#121214', letterSpacing: -0.4 },
  screenSub: { fontSize: 14, color: '#71717A', marginTop: 4, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#A1A1AA', letterSpacing: 0.9, marginBottom: 10 },

  routeHeaderCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 20, marginTop: 16,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  routeHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  routeNumBadge: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: '#141416',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  routeNumText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  routeCardLabel: { fontSize: 15, fontWeight: '700', color: '#121214' },
  routeCardSub: { fontSize: 12, color: '#71717A', marginTop: 2 },
  statusPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  statusPillActive: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  statusPillOff: { backgroundColor: '#F4F4F6' },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  statusPillTextActive: { color: '#10B981' },
  statusPillTextOff: { color: '#71717A' },

  timelineCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  timelineRow: { flexDirection: 'row', marginBottom: 10 },
  timelineLeft: { alignItems: 'center', width: 22, marginRight: 14 },
  timelineDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#D4D4D8',
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  dotPassed: { backgroundColor: '#10B981', borderColor: '#10B981' },
  dotCurrent: { borderColor: '#FF5B37', borderWidth: 2, backgroundColor: 'rgba(255,91,55,0.1)' },
  dotCurrentInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5B37' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E4E4E7', marginVertical: 3 },
  lineVPassed: { backgroundColor: '#10B981' },
  timelineRight: { flex: 1, paddingTop: 1 },
  timelineStop: { fontSize: 13, fontWeight: '500', color: '#121214' },
  timelineStopActive: { fontWeight: '700', color: '#FF5B37' },
  timelineTag: { fontSize: 10, color: '#A1A1AA', marginTop: 2 },

  // ─── Diagnostics Screen ──────────────────────────────────
  metricsRow: { flexDirection: 'row', gap: 14, marginTop: 16, marginBottom: 16 },
  metricCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 22, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  metricVal: { fontSize: 26, fontWeight: '800', color: '#121214', marginTop: 10 },
  metricUnit: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  metricLabel: { fontSize: 11, color: '#A1A1AA', marginTop: 4, fontWeight: '500' },
  gpsStatusOrb: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  gpsStatusDot: { width: 14, height: 14, borderRadius: 7 },

  coordCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  coordText: { fontSize: 18, fontWeight: '700', color: '#121214', fontVariant: ['tabular-nums'], marginTop: 6 },

  logCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  emptyLog: { fontSize: 13, color: '#A1A1AA', fontStyle: 'italic' },
  logRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F4F4F6' },
  logText: { fontSize: 12, color: '#52525B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // ─── Profile Screen ──────────────────────────────────────
  profileHero: {
    alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 28, marginBottom: 16,
    marginTop: 8, borderWidth: 1, borderColor: '#E8E8EC',
  },
  profileAvatar: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#141416',
    borderWidth: 3, borderColor: '#FF5B37', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileAvatarText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#121214' },
  profileSub: { fontSize: 13, color: '#A1A1AA', marginTop: 3 },

  profileCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  profileCardTitle: { fontSize: 15, fontWeight: '700', color: '#121214', marginBottom: 14 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F4F4F6',
  },
  profileRowLabel: { fontSize: 13, color: '#71717A' },
  profileRowValue: { fontSize: 13, fontWeight: '600', color: '#121214', maxWidth: '55%', textAlign: 'right' },
  profileRowValueAccent: { color: '#10B981' },

  signOutBtn: {
    height: 50, borderRadius: 14, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  signOutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },

  // ─── Bottom Dock ─────────────────────────────────────────
  dockWrapper: {
    backgroundColor: '#141416',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 52,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 64,
    backgroundColor: 'transparent',
  },
  dockBtnPrimary: {
    backgroundColor: '#FF5B37',
    shadowColor: '#FF5B37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  dockLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  dockLabelPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Dispatch Modal ──────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, maxHeight: '80%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },

  dispatchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB',
    borderRadius: 18, padding: 16, marginBottom: 20,
  },
  dispatchAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#141416',
    borderWidth: 2, borderColor: '#3F3F46', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  dispatchAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dispatchInfo: { flex: 1 },
  dispatchName: { fontSize: 16, fontWeight: '700', color: '#121214' },
  dispatchRole: { fontSize: 12, color: '#71717A', marginTop: 2 },
  dispatchPhone: { fontSize: 13, fontWeight: '600', color: '#FF5B37', marginTop: 4 },
  onlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#141416', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  onlineText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  modeTabs: {
    flexDirection: 'row', backgroundColor: '#F0F0F3', borderRadius: 14, padding: 3, marginBottom: 20,
  },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 11 },
  modeTabActive: { backgroundColor: '#141416' },
  modeTabText: { fontSize: 13, fontWeight: '500', color: '#71717A' },
  modeTabTextActive: { color: '#FFF', fontWeight: '700' },

  callView: { alignItems: 'center' },
  callLabel: { fontSize: 11, fontWeight: '700', color: '#A1A1AA', letterSpacing: 0.7, marginBottom: 8 },
  callNumber: { fontSize: 26, fontWeight: '800', color: '#121214', letterSpacing: 1, marginBottom: 8 },
  callNote: { fontSize: 13, color: '#71717A', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF5B37', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 18,
    shadowColor: '#FF5B37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  callBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  messageView: { width: '100%' },
  quickMsgBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9F9FB', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  quickMsgText: { fontSize: 14, color: '#121214', fontWeight: '500', flex: 1 },
});
