import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const ROUTE_DATABASE = {
  '138': {
    name: 'Route 138: Pettah ➔ Maharagama',
    shortName: 'Route 138',
    stops: ['Borella Junction', 'Nugegoda Supermarket', 'High Level Road Stop', 'Maharagama Depot'],
  },
  '100': {
    name: 'Route 100: Panadura ➔ Colombo Fort',
    shortName: 'Route 100',
    stops: ['Panadura Stand', 'Moratuwa Junction', 'Ratmalana Stop', 'Kollupitiya', 'Colombo Fort'],
  },
  '177': {
    name: 'Route 177: Kaduwela ➔ Kollupitiya',
    shortName: 'Route 177',
    stops: ['Kaduwela Clock Tower', 'Malabe Junction', 'Battaramulla', 'Rajagiriya', 'Kollupitiya'],
  },
};

const INITIAL_BUSES = [
  {
    id: 'ND-4589',
    latitude: 6.915,
    longitude: 79.875,
    speed: 28,
    eta: 3,
    status: 'active',
  },
  {
    id: 'NB-8821',
    latitude: 6.901,
    longitude: 79.89,
    speed: 14,
    eta: 9,
    status: 'warning',
  },
];

const FALLBACK_PASSENGER_COORDINATE = {
  latitude: 6.89,
  longitude: 79.875,
};

function findMatchingRouteKey(query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return '138';
  }

  return (
    Object.keys(ROUTE_DATABASE).find(
      (key) =>
        key.includes(normalized) ||
        ROUTE_DATABASE[key].name.toLowerCase().includes(normalized)
    ) || '138'
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passengerId, setPassengerId] = useState('PAS-2048');
  const [defaultStop, setDefaultStop] = useState('Borella Junction');
  const [routeSearch, setRouteSearch] = useState('138');
  const [selectedStop, setSelectedStop] = useState('Borella Junction');
  const [activeTab, setActiveTab] = useState('map');
  const [isStopDropdownOpen, setIsStopDropdownOpen] = useState(false);
  const [passengerCoordinate, setPassengerCoordinate] = useState(FALLBACK_PASSENGER_COORDINATE);
  const [activeBuses, setActiveBuses] = useState(INITIAL_BUSES);

  const fallbackCoordinateRef = useRef(FALLBACK_PASSENGER_COORDINATE);
  const matchedRouteKey = useMemo(() => findMatchingRouteKey(routeSearch), [routeSearch]);
  const matchedRoute = ROUTE_DATABASE[matchedRouteKey];
  const sortedBuses = useMemo(
    () => [...activeBuses].sort((firstBus, secondBus) => firstBus.eta - secondBus.eta),
    [activeBuses]
  );
  const primaryBus = sortedBuses[0];
  const selectedStopIndex = matchedRoute.stops.indexOf(selectedStop);
  const upcomingStops = useMemo(() => {
    if (selectedStopIndex < 0) {
      return matchedRoute.stops;
    }

    return matchedRoute.stops.slice(selectedStopIndex);
  }, [matchedRoute, selectedStopIndex]);
  const headerTitle = isAuthenticated ? 'Passenger Tracker' : 'Passenger Sign-In';

  useEffect(() => {
    if (!matchedRoute.stops.includes(selectedStop)) {
      setSelectedStop(defaultStop && matchedRoute.stops.includes(defaultStop) ? defaultStop : matchedRoute.stops[0]);
    }
  }, [matchedRoute, selectedStop, defaultStop]);

  useEffect(() => {
    setIsStopDropdownOpen(false);
  }, [matchedRouteKey]);

  useEffect(() => {
    let subscription;
    let fallbackTimer;

    async function watchPassengerLocation() {
      if (!isAuthenticated) {
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        fallbackTimer = setInterval(() => {
          fallbackCoordinateRef.current = {
            latitude: fallbackCoordinateRef.current.latitude + (Math.random() - 0.45) * 0.0002,
            longitude: fallbackCoordinateRef.current.longitude + (Math.random() - 0.45) * 0.0002,
          };
          setPassengerCoordinate(fallbackCoordinateRef.current);
        }, 5000);
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        ({ coords }) => {
          setPassengerCoordinate({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        }
      );
    }

    watchPassengerLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveBuses((currentBuses) =>
        currentBuses.map((bus) => ({
          ...bus,
          latitude: bus.latitude + (Math.random() - 0.2) * 0.0004,
          longitude: bus.longitude + (Math.random() - 0.2) * 0.0004,
          speed: Math.max(10, bus.speed + Math.floor((Math.random() - 0.5) * 8)),
          eta: Math.max(1, bus.eta - (Math.random() > 0.7 ? 1 : 0)),
          status: bus.speed > 18 ? 'active' : 'warning',
        }))
      );
    }, 3000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  function handleLogin() {
    const startingStop = defaultStop.trim() || 'Borella Junction';
    setDefaultStop(startingStop);
    setSelectedStop(startingStop);
    setRouteSearch('138');
    setActiveTab('map');
    setIsStopDropdownOpen(false);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setActiveTab('map');
    setIsStopDropdownOpen(false);
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
            <Text style={styles.headerEyebrow}>Smart Bus Passenger</Text>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          </View>

          <View style={styles.headerBadge}>
            <View style={styles.headerBadgeDot} />
            <Text style={styles.headerBadgeText}>Live map</Text>
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
                  <Text style={styles.avatarIcon}>🧍</Text>
                </View>

                <Text style={styles.sectionTitle}>Track your bus in real time</Text>
                <Text style={styles.sectionSubtitle}>
                  Save your stop, keep the map front and center, and watch the nearest bus move live.
                </Text>
              </View>

              <View style={styles.loginInfoCard}>
                <Text style={styles.loginInfoLabel}>Optimized for mobile</Text>
                <Text style={styles.loginInfoValue}>Compact layout for a 6-inch screen</Text>
                <Text style={styles.loginInfoHint}>The map stays as the main focus after sign-in.</Text>
              </View>

              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>Passenger ID / Mobile</Text>
                <TextInput
                  style={styles.input}
                  value={passengerId}
                  onChangeText={setPassengerId}
                  placeholder="PAS-2048"
                  placeholderTextColor={COLORS.zinc400}
                />
              </View>

              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>Default Bus Stop</Text>
                <TextInput
                  style={styles.input}
                  value={defaultStop}
                  onChangeText={setDefaultStop}
                  placeholder="Borella Junction"
                  placeholderTextColor={COLORS.zinc400}
                />
              </View>

              <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Open live tracker</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dashboardScreen}>
              {activeTab === 'map' ? (
                <>
                  <View style={styles.controlsCard}>
                    <View style={styles.controlBlock}>
                      <Text style={styles.sectionLabel}>Search route</Text>
                      <View style={styles.searchInputShell}>
                        <Text style={styles.searchIcon}>⌕</Text>
                        <TextInput
                          style={styles.searchInput}
                          value={routeSearch}
                          onChangeText={setRouteSearch}
                          placeholder="138 or destination"
                          placeholderTextColor={COLORS.zinc400}
                        />
                      </View>
                    </View>

                    <View style={styles.controlBlock}>
                      <View style={styles.stopHeaderRow}>
                        <Text style={styles.sectionLabel}>Target stop</Text>
                        <Text style={styles.tagPill}>Saved</Text>
                      </View>

                      <View style={styles.stopCard}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setIsStopDropdownOpen((currentValue) => !currentValue)}
                          style={styles.dropdownTrigger}
                        >
                          <View style={styles.dropdownLabelGroup}>
                            <Text style={styles.dropdownValue}>{selectedStop}</Text>
                            <Text style={styles.dropdownHint}>{matchedRoute.shortName} stop selection</Text>
                          </View>
                          <Text style={styles.dropdownCaret}>{isStopDropdownOpen ? '▴' : '▾'}</Text>
                        </TouchableOpacity>

                        {isStopDropdownOpen ? (
                          <View style={styles.dropdownMenu}>
                            {matchedRoute.stops.map((stop) => {
                              const isSelected = stop === selectedStop;

                              return (
                                <TouchableOpacity
                                  key={stop}
                                  activeOpacity={0.85}
                                  onPress={() => {
                                    setSelectedStop(stop);
                                    setIsStopDropdownOpen(false);
                                  }}
                                  style={[styles.stopOption, isSelected && styles.stopOptionSelected]}
                                >
                                  <Text
                                    style={[styles.stopOptionText, isSelected && styles.stopOptionTextSelected]}
                                  >
                                    {stop}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.mapHeroCard}>
                    <View style={styles.mapHeroHeader}>
                      <View>
                        <Text style={styles.sectionLabel}>Live route map</Text>
                        <Text style={styles.mapHeroTitle}>{matchedRoute.shortName}</Text>
                      </View>

                      <View style={styles.etaPill}>
                        <Text style={styles.etaPillLabel}>Nearest bus</Text>
                        <Text style={styles.etaPillValue}>{primaryBus?.eta || 4} min</Text>
                      </View>
                    </View>

                    <View style={styles.mapFrameLarge}>
                      <OpenStreetMapContainer
                        busLocationName={selectedStop}
                        etaMins={primaryBus?.eta || 4}
                        busCoordinate={
                          primaryBus
                            ? { latitude: primaryBus.latitude, longitude: primaryBus.longitude }
                            : undefined
                        }
                        passengerCoordinate={passengerCoordinate}
                      />
                    </View>

                    <View style={styles.metricRow}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Target</Text>
                        <Text style={styles.metricValue}>{selectedStop}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Live buses</Text>
                        <Text style={styles.metricValue}>{sortedBuses.length}</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Stops left</Text>
                        <Text style={styles.metricValue}>{Math.max(upcomingStops.length - 1, 0)}</Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.routeOnlyCard}>
                  <Text style={styles.sectionLabel}>Route</Text>
                  <Text style={styles.routeOnlyTitle}>{matchedRoute.name}</Text>
                </View>
              )}

              {activeTab === 'map' ? (
                <View style={styles.panelCard}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Nearby buses</Text>
                    <Text style={styles.panelMeta}>{matchedRoute.shortName}</Text>
                  </View>

                  <View style={styles.busCardList}>
                    {sortedBuses.map((bus) => {
                      const isFast = bus.status === 'active';

                      return (
                        <View key={bus.id} style={styles.busCard}>
                          <View style={styles.busCardLeft}>
                            <View style={styles.busCardTopRow}>
                              <Text style={styles.vehicleIdBadge}>{bus.id}</Text>
                              <View
                                style={[
                                  styles.statusPill,
                                  isFast ? styles.statusPillGood : styles.statusPillWarn,
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusPillDot,
                                    isFast ? styles.statusPillDotGood : styles.statusPillDotWarn,
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    isFast ? styles.statusPillTextGood : styles.statusPillTextWarn,
                                  ]}
                                >
                                  {isFast ? 'Moving well' : 'Slow traffic'}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.busSpeedText}>Speed {bus.speed} km/h</Text>
                          </View>

                          <View style={styles.etaBlock}>
                            <Text style={styles.etaValue}>{bus.eta}</Text>
                            <Text style={styles.etaLabel}>Min ETA</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.panelCard}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Upcoming stops</Text>
                    <Text style={styles.panelMeta}>{matchedRoute.shortName}</Text>
                  </View>

                  {upcomingStops.map((stop, index) => {
                    const isCurrentStop = index === 0;
                    const isLastStop = index === upcomingStops.length - 1;

                    return (
                      <View key={stop} style={styles.timelineRow}>
                        <View style={styles.timelineMarkerColumn}>
                          <View style={[styles.timelineDot, isCurrentStop && styles.timelineDotCurrent]} />
                          {!isLastStop ? <View style={styles.timelineLine} /> : null}
                        </View>

                        <View style={styles.timelineContent}>
                          <Text
                            style={[
                              styles.timelineStopName,
                              isCurrentStop && styles.timelineStopNameCurrent,
                            ]}
                          >
                            {stop}
                          </Text>
                          <Text style={styles.timelineStopMeta}>
                            {isCurrentStop ? 'You are here now' : `Upcoming stop ${index}`}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {activeTab === 'map' ? (
                <>
                  <View style={styles.accountCard}>
                    <View style={styles.accountBlock}>
                      <Text style={styles.inputLabel}>Matched route</Text>
                      <Text style={styles.accountValue}>{matchedRoute.name}</Text>
                    </View>
                    <View style={styles.accountBlock}>
                      <Text style={styles.inputLabel}>Passenger</Text>
                      <Text style={styles.accountValue}>{passengerId}</Text>
                    </View>
                  </View>

                  <TouchableOpacity activeOpacity={0.85} onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Sign out</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          )}
        </ScrollView>

        {isAuthenticated ? (
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('map')}
              style={styles.footerTab}
            >
              <Text style={activeTab === 'map' ? styles.footerIcon : styles.footerIconMuted}>⌖</Text>
              <Text style={activeTab === 'map' ? styles.footerTextActive : styles.footerTextMuted}>
                Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('stops')}
              style={styles.footerTab}
            >
              <Text style={activeTab === 'stops' ? styles.footerIcon : styles.footerIconMuted}>☰</Text>
              <Text style={activeTab === 'stops' ? styles.footerTextActive : styles.footerTextMuted}>
                Stops
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#93C5FD',
    marginRight: 6,
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
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
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
    backgroundColor: '#EEF2F7',
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
  dashboardScreen: {
    gap: 14,
  },
  controlsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 14,
    gap: 14,
  },
  controlBlock: {
    gap: 6,
  },
  sectionLabel: {
    color: COLORS.zinc500,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  searchInputShell: {
    backgroundColor: '#EEF2F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    color: COLORS.zinc400,
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.zinc900,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
    paddingVertical: 12,
  },
  stopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  stopCard: {
    gap: 6,
  },
  dropdownTrigger: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLabelGroup: {
    flex: 1,
    marginRight: 12,
  },
  dropdownValue: {
    color: COLORS.zinc900,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  dropdownHint: {
    color: COLORS.zinc400,
    fontSize: 10,
    marginTop: 3,
  },
  dropdownCaret: {
    color: COLORS.zinc500,
    fontSize: 14,
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  stopOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stopOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  stopOptionText: {
    color: COLORS.zinc600,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  stopOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  mapHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 14,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 1,
  },
  mapHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapHeroTitle: {
    color: COLORS.zinc900,
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  etaPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  etaPillLabel: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  etaPillValue: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 1,
  },
  mapFrameLarge: {
    height: 320,
    borderRadius: 22,
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
    borderRadius: 16,
    padding: 10,
  },
  routeOnlyCard: {
    paddingVertical: 6,
  },
  routeOnlyTitle: {
    color: COLORS.zinc900,
    fontSize: 20,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 4,
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
  busCardList: {
    gap: 10,
  },
  busCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  busCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  busCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  vehicleIdBadge: {
    color: COLORS.white,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginRight: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillGood: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillWarn: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillDotGood: {
    backgroundColor: COLORS.signalGreen,
  },
  statusPillDotWarn: {
    backgroundColor: '#F43F5E',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  statusPillTextGood: {
    color: '#047857',
  },
  statusPillTextWarn: {
    color: '#BE123C',
  },
  busSpeedText: {
    color: COLORS.zinc500,
    fontSize: 11,
  },
  etaBlock: {
    alignItems: 'flex-end',
  },
  etaValue: {
    color: COLORS.zinc900,
    fontSize: 28,
    fontWeight: TYPOGRAPHY.weights.bold,
    lineHeight: 30,
  },
  etaLabel: {
    color: COLORS.zinc400,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineMarkerColumn: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    marginTop: 5,
    zIndex: 1,
  },
  timelineDotCurrent: {
    backgroundColor: COLORS.signalBlue,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D9E2EC',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 14,
  },
  timelineStopName: {
    color: COLORS.zinc700,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  timelineStopNameCurrent: {
    color: COLORS.zinc900,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  timelineStopMeta: {
    color: COLORS.zinc400,
    fontSize: 11,
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
  accountBlock: {
    gap: 4,
  },
  accountValue: {
    color: COLORS.zinc700,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  logoutButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: COLORS.zinc600,
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
