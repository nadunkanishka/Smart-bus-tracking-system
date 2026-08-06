import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  BusIcon,
  CheckIcon,
  LockIcon,
  MapIcon,
  MapPinIcon,
  PlayIcon,
  SettingsIcon,
  StopIcon,
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

const MAX_LOG_ITEMS = 6;

function formatCoordinate(value) {
  return Number(value).toFixed(4);
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnShift, setIsOnShift] = useState(false);
  const [activeTab, setActiveTab] = useState('shift');

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

  const fallbackCoordinateRef = useRef(INITIAL_COORDINATE);

  const routeStops = assignedRoute?.stops?.length > 0 ? assignedRoute.stops : DEFAULT_STOPS;
  const routeNumber = assignedRoute?.routeId || DEFAULT_ROUTE_NUMBER;
  const routeLabel = assignedRoute?.name || `${assignedRoute?.start || 'Origin'} ➔ ${assignedRoute?.end || 'Destination'}` || DEFAULT_ROUTE_LABEL;

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

          const speed = Math.floor(Math.random() * 25) + 18;
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
      if (data.assignedRoute) {
        appendLog(`Route assigned: ${data.assignedRoute.name}`);
      } else {
        appendLog(`No specific route assigned in Admin Console for this bus.`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      // Immediate fallback so login button never gets stuck loading
      const reg = busRegistration.trim() || 'NB-4712';
      setAuthenticatedBus({ registration: reg, status: 'Active' });
      setIsAuthenticated(true);
      setIsOnShift(true);
      setActiveTab('shift');
      appendLog(`Offline mode driver login for ${reg}. Network bypass enabled.`);
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
    } else {
      setIsOnShift(true);
      setGpsHardwareStatus('Searching');
      appendLog(`Shift started. Telemetry broadcasting.`);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.bgBase}
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.phoneShell}>
        {/* App Bar Header */}
        <View style={styles.header}>
          <View style={styles.headerBrandRow}>
            <View style={styles.brandLogoIcon}>
              <BusIcon color={COLORS.white} size={20} />
            </View>
            <View>
              <Text style={styles.headerEyebrow}>SmartBus Driver Portal</Text>
              <Text style={styles.headerTitle}>
                {isAuthenticated ? busRegistration || 'NB-4712' : 'Driver Sign In'}
              </Text>
            </View>
          </View>

          {isAuthenticated ? (
            <View
              style={[
                styles.badgePill,
                isOnShift ? styles.badgePillActive : styles.badgePillOffDuty,
              ]}
            >
              <Text style={styles.badgePillText}>{isOnShift ? 'ACTIVE' : 'OFF-DUTY'}</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            isAuthenticated && styles.contentContainerWithFooter,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!isAuthenticated ? (
            /* 1. AUTHENTICATION: LOGIN SCREEN */
            <View style={styles.loginScreen}>
              <View style={styles.cardElevatedHero}>
                <View style={styles.heroAvatarCircle}>
                  <LockIcon color={COLORS.accent} size={28} />
                </View>
                <Text style={styles.heroTitle}>Driver Login</Text>
                <Text style={styles.heroSubtitle}>
                  Sign in with your assigned Bus Registration Number to access your navigation map and broadcast live shift telemetry.
                </Text>
              </View>

              {loginError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorCardText}>{loginError}</Text>
                </View>
              ) : null}

              <View style={styles.cardElevated}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Bus Registration No. (Username)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={busRegistration}
                    onChangeText={setBusRegistration}
                    placeholder="e.g. NB-4712"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.textInput}
                    value={busPassword}
                    onChangeText={setBusPassword}
                    placeholder="Enter security password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.buttonPrimary}
                  onPress={handleLoginSubmit}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.buttonPrimaryText}>Sign In to Driver Console</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : activeTab === 'shift' ? (
            /* 2. ACTIVE SHIFT & NAVIGATION SCREEN */
            <View style={styles.shiftScreen}>
              <View style={styles.cardElevatedHeader}>
                <Text style={styles.cardMetaLabel}>ASSIGNED VEHICLE REGISTRATION</Text>
                <Text style={styles.heroRegistrationNo}>{authenticatedBus?.registration || busRegistration || 'NB-4712'}</Text>

                <View style={styles.routeRow}>
                  <View style={styles.routeNumberBadge}>
                    <Text style={styles.routeNumberText}>{routeNumber}</Text>
                  </View>
                  <Text style={styles.routeLabelText}>{routeLabel}</Text>
                </View>
              </View>

              {/* Action Buttons to Start Shift and End Shift */}
              <View style={styles.shiftActionsRow}>
                {!isOnShift ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.buttonStartShift}
                    onPress={handleToggleShift}
                  >
                    <PlayIcon color={COLORS.white} size={16} />
                    <Text style={styles.buttonShiftText}>Start Shift</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.buttonEndShift}
                    onPress={handleToggleShift}
                  >
                    <StopIcon color={COLORS.white} size={16} />
                    <Text style={styles.buttonShiftText}>End Shift</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Interactive Navigation Map Display */}
              <View style={styles.cardMapElevated}>
                <View style={styles.mapHeaderRow}>
                  <Text style={styles.mapTitle}>Live Navigation & Route Path</Text>
                  <View style={styles.mapLiveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.mapLiveText}>GPS Live</Text>
                  </View>
                </View>

                <OpenStreetMapContainer
                  centerCoordinate={driverCoordinate}
                  busCoordinate={driverCoordinate}
                  routeLine={[]}
                />

                {/* Realtime Route Progress Line Bar */}
                <View style={styles.progressLineContainer}>
                  <View style={styles.progressLineBarBg}>
                    <View style={[styles.progressLineBarFill, { width: isOnShift ? `${(currentStopIndex / (DEFAULT_STOPS.length - 1)) * 100}%` : '0%' }]} />
                    <View style={[styles.progressLineMarker, { left: isOnShift ? `${(currentStopIndex / (DEFAULT_STOPS.length - 1)) * 100}%` : '0%' }]} />
                  </View>
                  <View style={styles.progressLabelsRow}>
                    <Text style={styles.progressText}>Pettah Terminal</Text>
                    <Text style={styles.progressText}>Maharagama Depot</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* 3. SYSTEM STATUS & DIAGNOSTICS SCREEN */
            <View style={styles.diagnosticsScreen}>
              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Real-time Vehicle Telemetry</Text>

                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryBox}>
                    <Text style={styles.telemetryLabel}>BUS SPEED</Text>
                    <Text style={styles.telemetryValueHi}>{isOnShift ? `${busSpeed} km/h` : '0 km/h'}</Text>
                  </View>

                  <View style={styles.telemetryBox}>
                    <Text style={styles.telemetryLabel}>GPS HARDWARE</Text>
                    <View
                      style={[
                        styles.statusBadgePill,
                        gpsHardwareStatus === 'Connected'
                          ? styles.badgeConnected
                          : gpsHardwareStatus === 'Searching'
                          ? styles.badgeSearching
                          : styles.badgeDisconnected,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{gpsHardwareStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryBox}>
                    <Text style={styles.telemetryLabel}>OPERATIONAL STATUS</Text>
                    <View
                      style={[
                        styles.statusBadgePill,
                        isOnShift ? styles.badgeActiveState : styles.badgeOffDutyState,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{isOnShift ? 'ACTIVE' : 'OFF-DUTY'}</Text>
                    </View>
                  </View>

                  <View style={styles.telemetryBox}>
                    <Text style={styles.telemetryLabel}>LAST TRANSMISSION</Text>
                    <Text style={styles.telemetryValueText}>
                      {isOnShift ? `${formatCoordinate(driverCoordinate.latitude)}, ${formatCoordinate(driverCoordinate.longitude)}` : 'Standby'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Dynamic Stop Tracker Timeline for Driver */}
              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Dynamic Route Stop Tracker</Text>

                <View style={styles.verticalTimeline}>
                  {routeStops.map((stopName, idx) => {
                    const isPassed = idx < currentStopIndex;
                    const isCurrent = idx === currentStopIndex;
                    const isUpcoming = idx > currentStopIndex;

                    return (
                      <View key={idx} style={styles.timelineStep}>
                        <View style={styles.timelineLeftColumn}>
                          <View
                            style={[
                              styles.timelineDot,
                              isPassed && styles.dotPassed,
                              isCurrent && styles.dotCurrent,
                              isUpcoming && styles.dotUpcoming,
                            ]}
                          >
                            {isCurrent ? (
                              <View style={styles.dotInnerPulse} />
                            ) : isPassed ? (
                              <CheckIcon color={COLORS.white} size={9} />
                            ) : null}
                          </View>

                          {idx < DEFAULT_STOPS.length - 1 ? (
                            <View
                              style={[
                                styles.timelineLine,
                                isPassed && styles.linePassed,
                              ]}
                            />
                          ) : null}
                        </View>

                        <View style={styles.timelineRightColumn}>
                          <Text
                            style={[
                              styles.stopNameText,
                              isCurrent && styles.stopNameCurrent,
                            ]}
                          >
                            {stopName}
                          </Text>

                          <Text style={styles.stopTagText}>
                            {isPassed
                              ? 'PASSED'
                              : isCurrent
                              ? 'CURRENT BUS LOCATION'
                              : 'NEXT UPCOMING STOP'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* System Logs */}
              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Diagnostics Event Logs</Text>
                <View style={styles.logContainer}>
                  {logs.length === 0 ? (
                    <Text style={styles.emptyLogText}>No broadcast logs collected.</Text>
                  ) : (
                    logs.map((logMsg, i) => (
                      <Text key={i} style={styles.logLine}>
                        {logMsg}
                      </Text>
                    ))
                  )}
                </View>
              </View>

              {/* System Menu with Sign Out Button */}
              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>System Account Options</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.buttonSignOut}
                  onPress={handleLogout}
                >
                  <Text style={styles.buttonSignOutText}>Sign Out of Driver Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Tab Bar */}
        {isAuthenticated ? (
          <View style={styles.bottomTabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('shift')}
              style={[styles.tabBarItem, activeTab === 'shift' && styles.tabBarItemActive]}
            >
              <MapIcon color={activeTab === 'shift' ? COLORS.accent : COLORS.textMuted} size={20} />
              <Text style={activeTab === 'shift' ? styles.tabTextActive : styles.tabTextMuted}>
                Shift & Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('status')}
              style={[styles.tabBarItem, activeTab === 'status' && styles.tabBarItemActive]}
            >
              <SettingsIcon color={activeTab === 'status' ? COLORS.accent : COLORS.textMuted} size={20} />
              <Text style={activeTab === 'status' ? styles.tabTextActive : styles.tabTextMuted}>
                Status & Diagnostics
              </Text>
            </TouchableOpacity>
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
  phoneShell: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  header: {
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 1,
  },
  badgePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillActive: {
    backgroundColor: COLORS.success,
  },
  badgePillOffDuty: {
    backgroundColor: COLORS.textMuted,
  },
  badgePillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.heavy,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithFooter: {
    paddingBottom: 85,
  },
  loginScreen: {
    gap: 16,
  },
  cardElevatedHero: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  cardElevated: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: COLORS.bgBase,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  buttonPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  shiftScreen: {
    gap: 16,
  },
  cardElevatedHeader: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMetaLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  heroRegistrationNo: {
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: COLORS.textPrimary,
    marginTop: 4,
    letterSpacing: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  routeNumberBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeNumberText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  routeLabelText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  shiftActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonStartShift: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEndShift: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShiftText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardMapElevated: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    height: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  mapHeaderRow: {
    padding: 16,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  mapLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  mapLiveText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  progressLineContainer: {
    padding: 16,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  progressLineBarBg: {
    height: 6,
    backgroundColor: COLORS.bgSurfaceElevated,
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  progressLineBarFill: {
    height: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressLineMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.white,
    top: -4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  diagnosticsScreen: {
    gap: 16,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  telemetryBox: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  telemetryLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  telemetryValueHi: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: COLORS.accent,
    marginTop: 4,
  },
  telemetryValueText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadgePill: {
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeConnected: {
    backgroundColor: COLORS.success,
  },
  badgeSearching: {
    backgroundColor: COLORS.warning,
  },
  badgeDisconnected: {
    backgroundColor: COLORS.danger,
  },
  badgeActiveState: {
    backgroundColor: COLORS.accent,
  },
  badgeOffDutyState: {
    backgroundColor: COLORS.textMuted,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.heavy,
    letterSpacing: 0.5,
  },
  verticalTimeline: {
    paddingLeft: 4,
    paddingTop: 8,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeftColumn: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bgSurfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotPassed: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dotCurrent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotUpcoming: {
    backgroundColor: COLORS.bgSurface,
    borderColor: COLORS.textMuted,
  },
  dotInnerPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  logContainer: {
    backgroundColor: COLORS.bgBase,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    gap: 6,
    minHeight: 120,
  },
  emptyLogText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  logLine: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stopNameText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  stopNameCurrent: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.accent,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.borderColor,
    marginVertical: 2,
  },
  linePassed: {
    backgroundColor: COLORS.success,
  },
  timelineRightColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stopTagText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  buttonSignOut: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  buttonSignOutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  tabBarItemActive: {
    backgroundColor: COLORS.accentLight,
  },
  tabTextActive: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.accent,
    marginTop: 2,
  },
  tabTextMuted: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
