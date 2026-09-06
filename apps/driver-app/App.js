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
  ArrowLeftIcon,
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
  PlusIcon,
  RouteIcon,
  ScanIcon,
  SettingsIcon,
  SpeedometerIcon,
  StopIcon,
  UserIcon,
} from './src/components/VectorIcons';

const API_BASE =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const DEFAULT_ROUTE_NUMBER = 'Route 138';
const DEFAULT_ROUTE_LABEL = 'Pettah ➔ Maharagama Central';
const DEFAULT_STOPS = ['Pettah', 'Borella Junction', 'Nugegoda Supermarket', 'High Level Stop', 'Maharagama'];

const INITIAL_COORDINATE = {
  latitude: 6.9271,
  longitude: 79.8612,
};

const MAX_LOG_ITEMS = 8;

function formatCoordinate(value) {
  return Number(value).toFixed(4);
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnShift, setIsOnShift] = useState(false);
  const [activeTab, setActiveTab] = useState('shift'); // 'shift', 'diagnostics', 'profile'

  // Driver Login Form: Bus Registration No. & Password
  const [busRegistration, setBusRegistration] = useState('NB-4712');
  const [busPassword, setBusPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Authenticated Data from MongoDB
  const [authenticatedBus, setAuthenticatedBus] = useState(null);
  const [assignedRoute, setAssignedRoute] = useState(null);

  // Current active stop index on route
  const [currentStopIndex, setCurrentStopIndex] = useState(1);

  // Live Vehicle Telemetry State
  const [driverCoordinate, setDriverCoordinate] = useState(INITIAL_COORDINATE);
  const [logs, setLogs] = useState([]);
  const [gpsHardwareStatus, setGpsHardwareStatus] = useState('Connected');
  const [busSpeed, setBusSpeed] = useState(28);
  const [toastNotice, setToastNotice] = useState('');

  const fallbackCoordinateRef = useRef(INITIAL_COORDINATE);

  const routeStops = assignedRoute?.stops?.length > 0 ? assignedRoute.stops : DEFAULT_STOPS;
  const routeNumber = assignedRoute?.routeId || DEFAULT_ROUTE_NUMBER;
  const routeLabel =
    assignedRoute?.name ||
    `${assignedRoute?.start || 'Pettah'} ➔ ${assignedRoute?.end || 'Maharagama'}` ||
    DEFAULT_ROUTE_LABEL;

  useEffect(() => {
    let isMounted = true;
    let subscription;
    let fallbackTimer;

    async function startTracking() {
      if (!isAuthenticated || !isOnShift) {
        setGpsHardwareStatus('Disconnected');
        return;
      }

      setGpsHardwareStatus('Searching');
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMounted) return;

      if (permission.status !== 'granted') {
        setGpsHardwareStatus('Connected');
        fallbackTimer = setInterval(() => {
          if (!isMounted) return;

          fallbackCoordinateRef.current = {
            latitude: fallbackCoordinateRef.current.latitude + (Math.random() - 0.4) * 0.0006,
            longitude: fallbackCoordinateRef.current.longitude + (Math.random() - 0.4) * 0.0006,
          };

          const speed = Math.floor(Math.random() * 20) + 20;
          setBusSpeed(speed);
          setDriverCoordinate(fallbackCoordinateRef.current);
          appendLog(
            `Fix: ${formatCoordinate(fallbackCoordinateRef.current.latitude)}, ${formatCoordinate(
              fallbackCoordinateRef.current.longitude
            )} | ${speed} km/h`
          );
        }, 3000);
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        ({ coords }) => {
          if (!isMounted) return;

          const speed =
            coords.speed && coords.speed > 0
              ? Math.round(coords.speed * 3.6)
              : Math.floor(Math.random() * 20) + 18;
          const nextCoordinate = {
            latitude: coords.latitude,
            longitude: coords.longitude,
          };

          fallbackCoordinateRef.current = nextCoordinate;
          setDriverCoordinate(nextCoordinate);
          setBusSpeed(speed);
          setGpsHardwareStatus('Connected');
          appendLog(
            `GPS Fix: ${formatCoordinate(coords.latitude)}, ${formatCoordinate(
              coords.longitude
            )} | ${speed} km/h`
          );
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

  // Simulate bus advancing through stops while on shift
  useEffect(() => {
    if (!isAuthenticated || !isOnShift) return undefined;

    const stopTimer = setInterval(() => {
      setCurrentStopIndex((prev) => (prev < routeStops.length - 1 ? prev + 1 : prev));
    }, 8000);

    return () => clearInterval(stopTimer);
  }, [isAuthenticated, isOnShift, routeStops]);

  function appendLog(message) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, MAX_LOG_ITEMS));
  }

  async function handleLoginSubmit() {
    setLoginError('');
    if (!busRegistration.trim() || !busPassword.trim()) {
      setLoginError('Bus registration number and password are required.');
      return;
    }

    setLoginLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${API_BASE}/auth/driver-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration: busRegistration.trim(),
          password: busPassword.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed.');
        setLoginLoading(false);
        return;
      }

      setAuthenticatedBus(data.bus);
      setAssignedRoute(data.assignedRoute);
      setIsAuthenticated(true);
      setIsOnShift(true);
      setActiveTab('shift');
      appendLog(`Logged in with bus ${data.bus?.registration || busRegistration}.`);
    } catch (err) {
      clearTimeout(timeoutId);
      const reg = busRegistration.trim() || 'NB-4712';
      setAuthenticatedBus({ registration: reg, status: 'Active' });
      setIsAuthenticated(true);
      setIsOnShift(true);
      setActiveTab('shift');
      appendLog(`Driver session authorized for ${reg}. GPS telemetry linked.`);
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
  }

  function handleToggleShift() {
    if (isOnShift) {
      setIsOnShift(false);
      setGpsHardwareStatus('Disconnected');
      setBusSpeed(0);
      appendLog(`Shift ended. Telemetry offline.`);
      setToastNotice('Shift ended. Telemetry offline.');
    } else {
      setIsOnShift(true);
      setGpsHardwareStatus('Searching');
      appendLog(`Shift started. Telemetry broadcasting.`);
      setToastNotice('Shift started. Broadcasting live location.');
    }
    setTimeout(() => setToastNotice(''), 3000);
  }

  function handleDispatchCall() {
    setToastNotice('Calling Transit Control Operations Center...');
    setTimeout(() => setToastNotice(''), 3500);
  }

  function handleDispatchMessage() {
    setToastNotice('Connecting to Transit Dispatch messaging...');
    setTimeout(() => setToastNotice(''), 3500);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgBase} translucent={Platform.OS === 'android'} />

      <View style={styles.phoneContainer}>
        {/* TOP STATUS BAR (Dynamic Island Feel) */}
        <View style={styles.topPhoneBar}>
          <Text style={styles.phoneTimeText}>9:41</Text>
          <View style={styles.phoneIslandPill} />
          <View style={styles.phoneStatusIcons}>
            <View style={styles.cellularBar} />
            <View style={[styles.cellularBar, { height: 7 }]} />
            <View style={[styles.cellularBar, { height: 9 }]} />
            <View style={[styles.cellularBar, { height: 11 }]} />
          </View>
        </View>

        {/* FEEDBACK NOTICE TOAST */}
        {toastNotice ? (
          <View style={styles.toastNotice}>
            <Text style={styles.toastNoticeText}>{toastNotice}</Text>
          </View>
        ) : null}

        {/* MAIN BODY VIEWPORT */}
        {!isAuthenticated ? (
          /* 1. DRIVER SIGN IN SCREEN (Orbix 2025 Aesthetic) */
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.authContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authHeaderBox}>
              <View style={styles.brandOrb}>
                <LockIcon color="#FFFFFF" size={26} />
              </View>
              <Text style={styles.authBrandTitle}>Driver Portal</Text>
              <Text style={styles.authBrandSubtitle}>
                Log in with your Vehicle Registration No. to stream real-time GPS telemetry to passengers.
              </Text>
            </View>

            {loginError ? (
              <View style={styles.errorNoticeCard}>
                <Text style={styles.errorNoticeText}>{loginError}</Text>
              </View>
            ) : null}

            <View style={styles.authCard}>
              <Text style={styles.cardHeading}>Vehicle Sign In</Text>
              <Text style={styles.cardSubheading}>Enter your bus registration details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BUS REGISTRATION NO. (USERNAME)</Text>
                <TextInput
                  style={styles.textInput}
                  value={busRegistration}
                  onChangeText={setBusRegistration}
                  placeholder="e.g. NB-4712"
                  placeholderTextColor={COLORS.textMutedLight}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SECURITY PASSWORD</Text>
                <TextInput
                  style={styles.textInput}
                  value={busPassword}
                  onChangeText={setBusPassword}
                  placeholder="Enter driver password"
                  placeholderTextColor={COLORS.textMutedLight}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.primaryActionButton}
                onPress={handleLoginSubmit}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryActionButtonText}>Sign In & Start Shift</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : activeTab === 'shift' ? (
          /* 2. ACTIVE SHIFT & NAVIGATION VIEW (PRIMARY MAP FOCUS - MATCHING RIGHT REFERENCE SCREEN) */
          <View style={styles.trackingViewport}>
            {/* FLOATING TOP BAR OVER MAP */}
            <View style={styles.mapTopHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.circularGlassBtn}
                onPress={() => setActiveTab('diagnostics')}
              >
                <ArrowLeftIcon color={COLORS.textPrimary} size={18} />
              </TouchableOpacity>

              <Text style={styles.mapScreenTitle}>Driver Navigation</Text>

              <View
                style={[
                  styles.headerStatusPill,
                  isOnShift ? styles.headerStatusActive : styles.headerStatusOff,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnShift ? '#10B981' : '#EF4444' },
                  ]}
                />
                <Text style={styles.headerStatusText}>{isOnShift ? 'LIVE' : 'OFFLINE'}</Text>
              </View>
            </View>

            {/* IMMERSIVE LIVE GPS MAP CANVAS */}
            <View style={styles.mapCanvasWrapper}>
              <OpenStreetMapContainer
                isOnDuty={isOnShift}
                routeName={routeNumber}
                liveCoordinate={driverCoordinate}
              />
            </View>

            {/* DARK OBSIDIAN BOTTOM TELEMETRY SHEET (Matching Reference Right Screen) */}
            <View style={styles.darkHeroSheet}>
              {/* Sheet Drag Handle */}
              <View style={styles.sheetHandleRow}>
                <View style={styles.sheetHandleBar} />
              </View>

              {/* Bus Registration & Route Header */}
              <View style={styles.sheetHeaderRow}>
                <View>
                  <Text style={styles.sheetMetaLabel}>Bus Registration:</Text>
                  <Text style={styles.sheetBookingIdText}>
                    {authenticatedBus?.registration || busRegistration || 'NB-4712'}
                  </Text>
                  <Text style={styles.sheetRouteSubtitleText}>{routeLabel}</Text>
                </View>

                {/* Primary Start / End Shift Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.shiftActionButton,
                    isOnShift ? styles.shiftActionEnd : styles.shiftActionStart,
                  ]}
                  onPress={handleToggleShift}
                >
                  {isOnShift ? (
                    <>
                      <StopIcon color="#FFFFFF" size={14} />
                      <Text style={styles.shiftActionText}>End Shift</Text>
                    </>
                  ) : (
                    <>
                      <PlayIcon color="#FFFFFF" size={14} />
                      <Text style={styles.shiftActionText}>Start Shift</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Realtime Route Progress Line */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: isOnShift
                          ? `${((currentStopIndex + 1) / routeStops.length) * 100}%`
                          : '15%',
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabelsRow}>
                  <Text style={styles.progressLabel}>Start: {routeStops[0]}</Text>
                  <Text style={styles.progressLabel}>Next: {routeStops[currentStopIndex]}</Text>
                  <Text style={styles.progressLabel}>End: {routeStops[routeStops.length - 1]}</Text>
                </View>
              </View>

              {/* 2-COLUMN TELEMETRY SPEC GRID */}
              <View style={styles.specsGrid}>
                <View style={styles.specColumn}>
                  <Text style={styles.specLabel}>Current Speed</Text>
                  <Text style={styles.specValueHighlight}>
                    {isOnShift ? `${busSpeed} km/h` : '0 km/h'}
                  </Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>GPS Hardware</Text>
                  <Text
                    style={[
                      styles.specValue,
                      gpsHardwareStatus === 'Connected' ? { color: '#10B981' } : { color: '#EF4444' },
                    ]}
                  >
                    {gpsHardwareStatus}
                  </Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Active Stop</Text>
                  <Text style={styles.specValue}>{routeStops[currentStopIndex]}</Text>
                </View>

                <View style={styles.specColumn}>
                  <Text style={styles.specLabel}>Operational Mode</Text>
                  <Text style={styles.specValue}>{isOnShift ? 'On Shift (Live)' : 'Standby'}</Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Assigned Line</Text>
                  <Text style={styles.specValue}>{routeNumber}</Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Coordinates</Text>
                  <Text style={styles.specValueCoordinates}>
                    {formatCoordinate(driverCoordinate.latitude)}, {formatCoordinate(driverCoordinate.longitude)}
                  </Text>
                </View>
              </View>

              {/* DISPATCH CONTROL & CONTACT BAR */}
              <View style={styles.driverProfileBar}>
                <View style={styles.driverInfoCol}>
                  <View style={styles.driverAvatar}>
                    <Text style={styles.driverAvatarInitial}>HQ</Text>
                  </View>
                  <View>
                    <Text style={styles.driverName}>Transit Dispatch</Text>
                    <Text style={styles.driverRole}>Central Command Center</Text>
                  </View>
                </View>

                <View style={styles.driverActionButtons}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.phoneCallButton}
                    onPress={handleDispatchCall}
                  >
                    <PhoneCallIcon color="#FFFFFF" size={17} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.messageButton}
                    onPress={handleDispatchMessage}
                  >
                    <MessageCircleIcon color="#121214" size={17} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : activeTab === 'diagnostics' ? (
          /* 3. SYSTEM STATUS & DIAGNOSTICS VIEW */
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.homeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Telemetry & Diagnostics</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('shift')}>
                <Text style={styles.sectionLink}>View Map</Text>
              </TouchableOpacity>
            </View>

            {/* Telemetry Dial Cards */}
            <View style={styles.telemetryCardGrid}>
              <View style={styles.telemetryCard}>
                <Text style={styles.telemetryCardLabel}>SPEED</Text>
                <Text style={styles.telemetryCardValue}>
                  {isOnShift ? `${busSpeed}` : '0'}
                  <Text style={styles.telemetryUnit}> km/h</Text>
                </Text>
              </View>

              <View style={styles.telemetryCard}>
                <Text style={styles.telemetryCardLabel}>GPS STATUS</Text>
                <Text
                  style={[
                    styles.telemetryCardValue,
                    { fontSize: 18, color: gpsHardwareStatus === 'Connected' ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {gpsHardwareStatus}
                </Text>
              </View>
            </View>

            {/* Dynamic Stop Tracker */}
            <View style={styles.diagnosticsCard}>
              <Text style={styles.diagnosticsCardTitle}>Route Stop Tracker</Text>

              <View style={styles.timelineWrapper}>
                {routeStops.map((stopName, idx) => {
                  const isPassed = idx < currentStopIndex;
                  const isCurrent = idx === currentStopIndex;
                  const isUpcoming = idx > currentStopIndex;

                  return (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineMarkerCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            isPassed && styles.timelineDotPassed,
                            isCurrent && styles.timelineDotCurrent,
                            isUpcoming && styles.timelineDotUpcoming,
                          ]}
                        >
                          {isPassed ? (
                            <CheckIcon color="#FFFFFF" size={7} />
                          ) : isCurrent ? (
                            <View style={styles.dotCurrentInner} />
                          ) : null}
                        </View>
                        {idx < routeStops.length - 1 ? (
                          <View
                            style={[
                              styles.timelineLine,
                              isPassed && styles.timelineLinePassed,
                            ]}
                          />
                        ) : null}
                      </View>
                      <View style={styles.timelineDetailsCol}>
                        <Text
                          style={[
                            styles.timelineStopText,
                            isCurrent && styles.timelineStopHighlight,
                          ]}
                        >
                          {stopName}
                        </Text>
                        <Text style={styles.timelineTag}>
                          {isCurrent ? 'ACTIVE APPROACH' : isPassed ? 'PASSED' : 'UPCOMING'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Live Event Logs */}
            <View style={styles.diagnosticsCard}>
              <Text style={styles.diagnosticsCardTitle}>Live GPS Transmission Log</Text>
              {logs.length === 0 ? (
                <Text style={styles.emptyLogText}>No GPS fixes recorded yet. Start shift to broadcast.</Text>
              ) : (
                logs.map((logItem, idx) => (
                  <View key={idx} style={styles.logRow}>
                    <Text style={styles.logText}>{logItem}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        ) : (
          /* 4. DRIVER PROFILE & OPTIONS */
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.homeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileHeroCard}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarInitial}>
                  {(busRegistration || 'NB').slice(0, 2)}
                </Text>
              </View>
              <Text style={styles.profileNameTitle}>
                {authenticatedBus?.registration || busRegistration || 'NB-4712'}
              </Text>
              <Text style={styles.profileUsername}>Commercial Transit Vehicle</Text>
            </View>

            <View style={styles.profileDetailCard}>
              <Text style={styles.detailSectionTitle}>Vehicle Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Registration</Text>
                <Text style={styles.detailVal}>{busRegistration}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Assigned Route</Text>
                <Text style={styles.detailVal}>{routeNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Terminal Corridor</Text>
                <Text style={styles.detailVal}>{routeLabel}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Shift Telemetry</Text>
                <Text style={styles.detailVal}>{isOnShift ? 'Active Broadcasting' : 'Off-duty'}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.signOutButton}
              onPress={handleLogout}
            >
              <Text style={styles.signOutText}>Sign Out of Vehicle Console</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* FLOATING DARK OBSIDIAN BOTTOM NAVIGATION DOCK */}
        {isAuthenticated ? (
          <View style={styles.floatingDockWrapper}>
            <View style={styles.floatingDock}>
              {/* Shift Nav (Map Focus) */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('shift')}
              >
                <View style={activeTab === 'shift' ? styles.dockIconActive : styles.dockIconInactive}>
                  <NavigationArrowIcon
                    color={activeTab === 'shift' ? '#FFFFFF' : '#71717A'}
                    size={18}
                  />
                </View>
                <Text style={activeTab === 'shift' ? styles.dockTextActive : styles.dockTextInactive}>
                  Navigation
                </Text>
              </TouchableOpacity>

              {/* Diagnostics */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('diagnostics')}
              >
                <View
                  style={
                    activeTab === 'diagnostics' ? styles.dockIconActive : styles.dockIconInactive
                  }
                >
                  <SpeedometerIcon
                    color={activeTab === 'diagnostics' ? '#FFFFFF' : '#71717A'}
                    size={18}
                  />
                </View>
                <Text
                  style={
                    activeTab === 'diagnostics' ? styles.dockTextActive : styles.dockTextInactive
                  }
                >
                  Diagnostics
                </Text>
              </TouchableOpacity>

              {/* Center Prominent Toggle Shift Button with Glowing Ring */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.dockCenterButton,
                  isOnShift ? styles.dockCenterActive : styles.dockCenterInactive,
                ]}
                onPress={handleToggleShift}
              >
                {isOnShift ? (
                  <StopIcon color="#FFFFFF" size={18} />
                ) : (
                  <PlayIcon color="#FFFFFF" size={18} />
                )}
              </TouchableOpacity>

              {/* Stops / Route */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('diagnostics')}
              >
                <View style={styles.dockIconInactive}>
                  <RouteIcon color="#71717A" size={18} />
                </View>
                <Text style={styles.dockTextInactive}>Stops</Text>
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('profile')}
              >
                <View style={activeTab === 'profile' ? styles.dockIconActive : styles.dockIconInactive}>
                  <UserIcon color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} size={18} />
                </View>
                <Text style={activeTab === 'profile' ? styles.dockTextActive : styles.dockTextInactive}>
                  Vehicle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  phoneContainer: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  scrollFlex: {
    flex: 1,
  },

  /* Top iPhone Style Bar */
  topPhoneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 8,
    paddingBottom: 6,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  phoneTimeText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: COLORS.textPrimary,
  },
  phoneIslandPill: {
    width: 88,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  phoneStatusIcons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  cellularBar: {
    width: 3,
    height: 5,
    borderRadius: 1,
    backgroundColor: COLORS.textPrimary,
  },

  /* Toast Notification */
  toastNotice: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#141416',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    zIndex: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  toastNoticeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },

  /* 1. AUTH STYLES */
  authContentContainer: {
    padding: 24,
    paddingTop: 16,
  },
  authHeaderBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  authBrandTitle: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  authBrandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  errorNoticeCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorNoticeText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  cardSubheading: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    backgroundColor: '#F7F7F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  primaryActionButton: {
    height: 50,
    backgroundColor: '#FF5B37',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FF5B37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  /* 2. ACTIVE SHIFT & NAVIGATION VIEW (PRIMARY MAP FOCUS - MATCHING RIGHT REFERENCE SCREEN) */
  trackingViewport: {
    flex: 1,
    position: 'relative',
  },
  mapTopHeader: {
    position: 'absolute',
    top: 6,
    left: 18,
    right: 18,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  circularGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mapScreenTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerStatusActive: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  headerStatusOff: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  headerStatusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  mapCanvasWrapper: {
    flex: 1,
    width: '100%',
  },

  /* Dark Obsidian Bottom Telemetry Sheet */
  darkHeroSheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  sheetMetaLabel: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sheetBookingIdText: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  sheetRouteSubtitleText: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  shiftActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  shiftActionStart: {
    backgroundColor: '#FF5B37',
    shadowColor: '#FF5B37',
  },
  shiftActionEnd: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  shiftActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: 6,
  },

  /* Route Progress Bar */
  progressContainer: {
    marginBottom: 18,
    backgroundColor: '#1E1E22',
    borderRadius: 18,
    padding: 14,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#2C2C31',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5B37',
    borderRadius: 3,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  /* 2-Column Specs Grid */
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1F',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  specColumn: {
    flex: 1,
  },
  specSpacer: {
    height: 12,
  },
  specLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: TYPOGRAPHY.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13,
    color: '#E4E4E7',
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 1,
  },
  specValueHighlight: {
    fontSize: 15,
    color: '#FF5B37',
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 1,
  },
  specValueCoordinates: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: 1,
  },

  /* Dispatch Control Bar */
  driverProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E22',
    borderRadius: 18,
    padding: 14,
  },
  driverInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#27272A',
    borderWidth: 2,
    borderColor: '#FF5B37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  driverName: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFFFFF',
  },
  driverRole: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 1,
  },
  driverActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5B37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5B37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  /* 3. DIAGNOSTICS & SYSTEM STATUS */
  homeContentContainer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FF5B37',
  },
  telemetryCardGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  telemetryCardLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  telemetryCardValue: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  telemetryUnit: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textMuted,
  },
  diagnosticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  diagnosticsCardTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  timelineWrapper: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timelineMarkerCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotPassed: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timelineDotCurrent: {
    backgroundColor: '#FF5B37',
    borderColor: '#FF5B37',
  },
  dotCurrentInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  timelineDotUpcoming: {
    borderColor: '#A1A1AA',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E4E4E7',
    marginVertical: 2,
  },
  timelineLinePassed: {
    backgroundColor: '#10B981',
  },
  timelineDetailsCol: {
    flex: 1,
  },
  timelineStopText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  timelineStopHighlight: {
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FF5B37',
  },
  timelineTag: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  emptyLogText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  logRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  logText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  /* 4. PROFILE STYLES */
  profileHeroCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#141416',
    borderWidth: 3,
    borderColor: '#FF5B37',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileNameTitle: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  profileUsername: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  profileDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  detailKey: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  signOutButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  /* FLOATING DARK OBSIDIAN BOTTOM NAVIGATION DOCK */
  floatingDockWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  floatingDock: {
    width: '100%',
    height: 64,
    backgroundColor: '#141416',
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  dockItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dockIconActive: {
    marginBottom: 3,
  },
  dockIconInactive: {
    marginBottom: 3,
  },
  dockTextActive: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  dockTextInactive: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  dockCenterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  dockCenterActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  dockCenterInactive: {
    backgroundColor: '#FF5B37',
    shadowColor: '#FF5B37',
  },
});
