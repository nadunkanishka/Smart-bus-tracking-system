import React, { useEffect, useRef, useState } from 'react';
import {
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

const DEFAULT_ROUTE_NUMBER = '138';
const DEFAULT_ROUTE_LABEL = 'Route 138 (Pettah - Maharagama)';

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
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [activeTab, setActiveTab] = useState('drive');
  const [driverId, setDriverId] = useState('DRV-9082');
  const [busNumber, setBusNumber] = useState('ND-4589');
  const [driverCoordinate, setDriverCoordinate] = useState(INITIAL_COORDINATE);
  const [logs, setLogs] = useState([]);
  const [gpsStatus, setGpsStatus] = useState('Standby');
  const [lastSpeed, setLastSpeed] = useState(0);

  const fallbackCoordinateRef = useRef(INITIAL_COORDINATE);

  const headerTitle = isAuthenticated ? `Bus ${busNumber || 'ND-4589'}` : 'Driver Authentication';

  useEffect(() => {
    let isMounted = true;
    let subscription;
    let fallbackTimer;

    async function startTracking() {
      if (!isAuthenticated || !isOnDuty) {
        setGpsStatus('Standby');
        return;
      }

      setGpsStatus('Acquiring GPS');
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMounted) {
        return;
      }

      if (permission.status !== 'granted') {
        setGpsStatus('Permission denied, using simulated feed');
        fallbackTimer = setInterval(() => {
          if (!isMounted) {
            return;
          }

          fallbackCoordinateRef.current = {
            latitude: fallbackCoordinateRef.current.latitude + (Math.random() - 0.4) * 0.0006,
            longitude: fallbackCoordinateRef.current.longitude + (Math.random() - 0.4) * 0.0006,
          };

          const speed = Math.floor(Math.random() * 30) + 12;
          setLastSpeed(speed);
          setDriverCoordinate(fallbackCoordinateRef.current);
          appendLog(
            `TX Fix: ${formatCoordinate(fallbackCoordinateRef.current.latitude)}, ${formatCoordinate(
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
          if (!isMounted) {
            return;
          }

          const speed = coords.speed && coords.speed > 0 ? Math.round(coords.speed * 3.6) : Math.floor(Math.random() * 18) + 18;
          const nextCoordinate = {
            latitude: coords.latitude,
            longitude: coords.longitude,
          };

          fallbackCoordinateRef.current = nextCoordinate;
          setDriverCoordinate(nextCoordinate);
          setLastSpeed(speed);
          setGpsStatus(`High Fix (${Math.round(coords.accuracy || 0)}m accuracy)`);
          appendLog(
            `TX Fix: ${formatCoordinate(coords.latitude)}, ${formatCoordinate(coords.longitude)} | ${speed} km/h`
          );
        }
      );
    }

    startTracking();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [isAuthenticated, isOnDuty]);

  function appendLog(message) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((currentLogs) => [`[${time}] ${message}`, ...currentLogs].slice(0, MAX_LOG_ITEMS));
  }

  function handleLogin() {
    setIsAuthenticated(true);
    setIsOnDuty(false);
    setActiveTab('drive');
    setLogs([]);
    setGpsStatus('Standby');
    setLastSpeed(0);
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setIsOnDuty(false);
    setActiveTab('drive');
    setLogs([]);
    setGpsStatus('Standby');
    setLastSpeed(0);
  }

  function handleToggleDuty() {
    if (isOnDuty) {
      setIsOnDuty(false);
      setGpsStatus('Standby');
      appendLog('GPS stream paused. Driver is now off duty.');
      return;
    }

    setIsOnDuty(true);
    appendLog(`Duty confirmed for ${busNumber}. Starting GPS broadcast.`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.zinc900}
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.phoneShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>Smart Bus Driver</Text>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          </View>

          <View style={styles.headerBadge}>
            <View style={[styles.headerBadgeDot, isOnDuty ? styles.headerBadgeDotActive : styles.headerBadgeDotInactive]} />
            <Text style={styles.headerBadgeText}>{isOnDuty ? 'On duty' : 'Standby'}</Text>
          </View>
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
            <View style={styles.loginScreen}>
              <View style={styles.loginHeroCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarIcon}>🚌</Text>
                </View>
                <Text style={styles.sectionTitle}>Start your driver session</Text>
                <Text style={styles.sectionSubtitle}>
                  Use the same clean mobile layout as the passenger app, with a simpler drive-first dashboard.
                </Text>
              </View>

              <View style={styles.loginInfoCard}>
                <Text style={styles.loginInfoLabel}>Assigned route</Text>
                <Text style={styles.loginInfoValue}>{DEFAULT_ROUTE_LABEL}</Text>
                <Text style={styles.loginInfoHint}>Ready for a compact 6-inch driver display.</Text>
              </View>

              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>Driver ID / License</Text>
                <TextInput
                  style={styles.input}
                  value={driverId}
                  onChangeText={setDriverId}
                  placeholder="DRV-9082"
                  placeholderTextColor={COLORS.zinc400}
                />
              </View>

              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>Assigned Bus Registration</Text>
                <TextInput
                  style={styles.input}
                  value={busNumber}
                  onChangeText={setBusNumber}
                  placeholder="ND-4589"
                  placeholderTextColor={COLORS.zinc400}
                />
              </View>

              <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Open driver dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.terminalScreen}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <View>
                    <Text style={styles.sectionLabel}>Assigned bus</Text>
                    <Text style={styles.summaryTitle}>{busNumber}</Text>
                  </View>
                  <Text style={styles.routeTag}>{DEFAULT_ROUTE_NUMBER}</Text>
                </View>

                <View style={styles.summaryMetaRow}>
                  <View style={styles.summaryMetaItem}>
                    <Text style={styles.cardLabel}>Driver</Text>
                    <Text style={styles.metaValueStrong}>{driverId}</Text>
                  </View>
                  <View style={styles.summaryMetaItem}>
                    <Text style={styles.cardLabel}>State</Text>
                    <Text style={styles.metaValueStrong}>{isOnDuty ? 'Broadcasting' : 'Paused'}</Text>
                  </View>
                </View>
              </View>

              {activeTab === 'drive' ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.92}
                    style={[styles.toggleButton, isOnDuty ? styles.toggleButtonStop : styles.toggleButtonStart]}
                    onPress={handleToggleDuty}
                  >
                    <Text style={styles.toggleButtonIcon}>{isOnDuty ? '■' : '▶'}</Text>
                    <View style={styles.toggleTextGroup}>
                      <Text style={styles.toggleButtonText}>{isOnDuty ? 'Stop GPS broadcast' : 'Start GPS broadcast'}</Text>
                      <Text style={styles.toggleButtonHint}>
                        {isOnDuty ? 'Switch off duty and pause location updates' : 'Go on duty and send live location'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.mapHeroCard}>
                    <View style={styles.mapHeroHeader}>
                      <View>
                        <Text style={styles.sectionLabel}>Drive map</Text>
                        <Text style={styles.mapHeroTitle}>OpenStreetMap live view</Text>
                      </View>

                      <View style={styles.statusChip}>
                        <View style={[styles.statusChipDot, isOnDuty ? styles.statusChipDotActive : styles.statusChipDotInactive]} />
                        <Text style={styles.statusChipText}>{isOnDuty ? 'Online' : 'Offline'}</Text>
                      </View>
                    </View>

                    <View style={styles.mapFrameLarge}>
                      <OpenStreetMapContainer
                        isOnDuty={isOnDuty}
                        routeName={DEFAULT_ROUTE_NUMBER}
                        liveCoordinate={driverCoordinate}
                      />
                    </View>

                    <View style={styles.metricRow}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>GPS</Text>
                        <Text style={styles.metricValue}>{gpsStatus}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Speed</Text>
                        <Text style={styles.metricValue}>{lastSpeed > 0 ? `${lastSpeed} km/h` : 'Waiting'}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Route</Text>
                        <Text style={styles.metricValue}>{DEFAULT_ROUTE_NUMBER}</Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.panelCard}>
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>Telemetry log</Text>
                      <Text style={styles.panelMeta}>Latest {MAX_LOG_ITEMS}</Text>
                    </View>

                    <View style={styles.consoleCard}>
                      {logs.length === 0 ? (
                        <Text style={styles.consolePlaceholder}>
                          Start GPS broadcast to begin the live stream.
                        </Text>
                      ) : (
                        logs.map((entry) => (
                          <View key={entry} style={styles.consoleRow}>
                            <Text style={styles.consoleText}>{entry}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                  <View style={styles.panelCard}>
                    <View style={styles.panelHeader}>
                      <Text style={styles.panelTitle}>Trip status</Text>
                      <Text style={styles.panelMeta}>Live summary</Text>
                    </View>

                    <View style={styles.metaGroup}>
                      <View style={styles.metaItem}>
                        <Text style={styles.cardLabel}>Route</Text>
                        <Text style={styles.metaValue}>{DEFAULT_ROUTE_LABEL}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.cardLabel}>GPS fix</Text>
                        <Text style={styles.metaValue}>{gpsStatus}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.cardLabel}>Last speed</Text>
                        <Text style={styles.metaValue}>{lastSpeed > 0 ? `${lastSpeed} km/h` : 'Awaiting feed'}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity activeOpacity={0.85} onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {isAuthenticated ? (
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('drive')}
              style={styles.footerTab}
            >
              <Text style={activeTab === 'drive' ? styles.footerIcon : styles.footerIconMuted}>⌖</Text>
              <Text style={activeTab === 'drive' ? styles.footerTextActive : styles.footerTextMuted}>
                Drive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('status')}
              style={styles.footerTab}
            >
              <Text style={activeTab === 'status' ? styles.footerIcon : styles.footerIconMuted}>☰</Text>
              <Text style={activeTab === 'status' ? styles.footerTextActive : styles.footerTextMuted}>
                Status
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
    backgroundColor: '#F4F7FB',
  },
  phoneShell: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: COLORS.zinc900,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 2,
  },
  headerBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerBadgeDotActive: {
    backgroundColor: COLORS.signalGreen,
  },
  headerBadgeDotInactive: {
    backgroundColor: '#93C5FD',
  },
  headerBadgeText: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 20,
    flexGrow: 1,
  },
  contentContainerWithFooter: {
    paddingBottom: 90,
  },
  loginScreen: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loginHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    color: COLORS.zinc900,
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 14,
    textAlign: 'center',
  },
  sectionSubtitle: {
    color: COLORS.zinc500,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },
  loginInfoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    marginBottom: 16,
  },
  loginInfoLabel: {
    color: COLORS.signalBlue,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  loginInfoValue: {
    color: COLORS.zinc900,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 6,
  },
  loginInfoHint: {
    color: COLORS.zinc500,
    fontSize: 12,
    marginTop: 4,
  },
  formBlock: {
    marginBottom: 12,
  },
  inputLabel: {
    color: COLORS.zinc500,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: COLORS.zinc900,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  terminalScreen: {
    gap: 14,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    padding: 14,
    gap: 14,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: COLORS.zinc900,
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  cardLabel: {
    color: COLORS.zinc500,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  routeTag: {
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryMetaItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
  },
  metaValueStrong: {
    color: COLORS.zinc900,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  toggleButton: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButtonStart: {
    backgroundColor: '#0F172A',
  },
  toggleButtonStop: {
    backgroundColor: '#DC2626',
  },
  toggleButtonIcon: {
    color: COLORS.white,
    fontSize: 14,
    marginRight: 10,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  toggleButtonHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  mapHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  mapHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: COLORS.zinc500,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  mapHeroTitle: {
    color: COLORS.zinc900,
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusChipDotActive: {
    backgroundColor: COLORS.signalGreen,
  },
  statusChipDotInactive: {
    backgroundColor: COLORS.signalRed,
  },
  statusChipText: {
    color: COLORS.zinc900,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  mapFrameLarge: {
    height: 270,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
  },
  metricLabel: {
    color: COLORS.zinc400,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricValue: {
    color: COLORS.zinc900,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 4,
  },
  panelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    color: COLORS.zinc900,
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  panelMeta: {
    color: COLORS.zinc500,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  consoleCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    minHeight: 118,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  consolePlaceholder: {
    color: COLORS.zinc500,
    fontSize: 11,
    fontStyle: 'italic',
  },
  consoleRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.75)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  consoleText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  metaGroup: {
    gap: 12,
  },
  metaItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
  },
  metaValue: {
    color: COLORS.zinc700,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  logoutButton: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#BE123C',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  footer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerTab: {
    alignItems: 'center',
    minWidth: 80,
  },
  footerIcon: {
    color: COLORS.white,
    fontSize: 16,
  },
  footerIconMuted: {
    color: '#94A3B8',
    fontSize: 16,
  },
  footerTextActive: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 3,
  },
  footerTextMuted: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },
});
