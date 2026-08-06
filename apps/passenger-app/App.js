import React, { useEffect, useMemo, useState } from 'react';
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
import OpenStreetMapContainer from './src/components/OpenStreetMapContainer';
import { COLORS, TYPOGRAPHY } from './src/constants/theme';
import {
  ArrowRightIcon,
  BusIcon,
  CheckIcon,
  ChevronDownIcon,
  FlagIcon,
  LockIcon,
  MapIcon,
  MapPinIcon,
  UserIcon,
} from './src/components/VectorIcons';

const ROUTE_DATABASE = [
  {
    id: '138',
    name: 'Route 138: Pettah ➔ Maharagama',
    shortName: 'Route 138',
    startTerminal: 'Pettah Main Stand',
    endTerminal: 'Maharagama Depot',
    stops: ['Pettah', 'Borella Junction', 'Nugegoda Supermarket', 'High Level Stop', 'Maharagama'],
  },
  {
    id: '100',
    name: 'Route 100: Panadura ➔ Colombo Fort',
    shortName: 'Route 100',
    startTerminal: 'Panadura Bus Stand',
    endTerminal: 'Colombo Fort Station',
    stops: ['Panadura', 'Moratuwa Town', 'Ratmalana Stop', 'Kollupitiya', 'Colombo Fort'],
  },
  {
    id: '177',
    name: 'Route 177: Kaduwela ➔ Kollupitiya',
    shortName: 'Route 177',
    startTerminal: 'Kaduwela Clock Tower',
    endTerminal: 'Kollupitiya Station',
    stops: ['Kaduwela', 'Malabe Junction', 'Battaramulla', 'Rajagiriya', 'Kollupitiya'],
  },
];

const INITIAL_BUS_LOCATION = {
  id: 'NB-4712',
  latitude: 6.915,
  longitude: 79.875,
  speed: 28,
  etaMinutes: 4,
};

const PASSENGER_COORDINATE = {
  latitude: 6.89,
  longitude: 79.875,
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Registration Form Fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Login Form Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [userProfile, setUserProfile] = useState(null);

  // Core Flow States
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking', 'routes', 'profile'
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(ROUTE_DATABASE[0]);
  const [boardingStop, setBoardingStop] = useState(ROUTE_DATABASE[0].stops[1]);
  const [destinationStop, setDestinationStop] = useState(ROUTE_DATABASE[0].stops[4]);

  const [isBoardingDropdownOpen, setIsBoardingDropdownOpen] = useState(false);
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);

  const [liveBus, setLiveBus] = useState(INITIAL_BUS_LOCATION);

  // Filter routes based on query
  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return ROUTE_DATABASE;
    const query = routeSearchQuery.toLowerCase();
    return ROUTE_DATABASE.filter(
      (r) => r.id.includes(query) || r.name.toLowerCase().includes(query)
    );
  }, [routeSearchQuery]);

  // Live Bus Position Simulation
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const interval = setInterval(() => {
      setLiveBus((prev) => ({
        ...prev,
        latitude: prev.latitude + (Math.random() - 0.2) * 0.0004,
        longitude: prev.longitude + (Math.random() - 0.2) * 0.0004,
        speed: Math.max(12, prev.speed + Math.floor((Math.random() - 0.5) * 6)),
        etaMinutes: Math.max(1, prev.etaMinutes - (Math.random() > 0.75 ? 1 : 0)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  function handleRegisterSubmit() {
    setUserProfile({
      name: regFullName.trim() || 'Kasun Perera',
      username: regUsername.trim() || 'kasun_p',
      phone: regPhone.trim() || '+94 77 123 4567',
    });
    setIsAuthenticated(true);
    setActiveTab('tracking');
  }

  function handleLoginSubmit() {
    setUserProfile({
      name: loginUsername.trim() || 'Kasun Perera',
      username: loginUsername.trim() || 'kasun_p',
      phone: '+94 77 123 4567',
    });
    setIsAuthenticated(true);
    setActiveTab('tracking');
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setUserProfile(null);
    setActiveTab('tracking');
  }

  function handleSelectRoute(route) {
    setSelectedRoute(route);
    setBoardingStop(route.stops[0]);
    setDestinationStop(route.stops[route.stops.length - 1]);
    setActiveTab('tracking');
  }

  // Calculate passed, upcoming, and target stop indexes
  const boardingIndex = selectedRoute.stops.indexOf(boardingStop);
  const destinationIndex = selectedRoute.stops.indexOf(destinationStop);

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
              <UserIcon color={COLORS.white} size={20} />
            </View>
            <View>
              <Text style={styles.headerEyebrow}>SmartBus Passenger</Text>
              <Text style={styles.headerTitle}>
                {isAuthenticated
                  ? `Hi, ${userProfile?.name || 'Kasun'}`
                  : authMode === 'register'
                  ? 'Registration'
                  : 'Passenger Sign In'}
              </Text>
            </View>
          </View>

          {isAuthenticated ? (
            <View style={styles.badgePillActive}>
              <Text style={styles.badgePillText}>CONNECTED</Text>
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
            /* 1. AUTHENTICATION: REGISTRATION & LOGIN SCREENS */
            <View style={styles.authScreen}>
              <View style={styles.cardElevatedHero}>
                <View style={styles.heroAvatarCircle}>
                  <BusIcon color={COLORS.accent} size={28} />
                </View>
                <Text style={styles.heroTitle}>
                  {authMode === 'register' ? 'Passenger Registration' : 'Welcome Back'}
                </Text>
                <Text style={styles.heroSubtitle}>
                  {authMode === 'register'
                    ? 'Create your account to view live bus movements along your route and check arrival timelines.'
                    : 'Sign in to access your saved bus routes, boarding stops, and real-time tracking.'}
                </Text>

                {/* Tab Switcher */}
                <View style={styles.tabSwitcher}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.tabSwitchBtn, authMode === 'login' && styles.tabSwitchBtnActive]}
                    onPress={() => setAuthMode('login')}
                  >
                    <Text style={authMode === 'login' ? styles.tabSwitchTextActive : styles.tabSwitchText}>
                      Sign In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.tabSwitchBtn, authMode === 'register' && styles.tabSwitchBtnActive]}
                    onPress={() => setAuthMode('register')}
                  >
                    <Text style={authMode === 'register' ? styles.tabSwitchTextActive : styles.tabSwitchText}>
                      Register
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {authMode === 'register' ? (
                /* Registration Screen */
                <View style={styles.cardElevated}>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regFullName}
                      onChangeText={setRegFullName}
                      placeholder="e.g. Kasun Perera"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regUsername}
                      onChangeText={setRegUsername}
                      placeholder="e.g. kasun_p"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regPhone}
                      onChangeText={setRegPhone}
                      placeholder="+94 77 123 4567"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      placeholder="Create a password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.buttonPrimary}
                    onPress={handleRegisterSubmit}
                  >
                    <Text style={styles.buttonPrimaryText}>Create Account & Open App</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Login Screen */
                <View style={styles.cardElevated}>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                      style={styles.textInput}
                      value={loginUsername}
                      onChangeText={setLoginUsername}
                      placeholder="Enter your username"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.textInput}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      placeholder="Enter password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.buttonPrimary}
                    onPress={handleLoginSubmit}
                  >
                    <Text style={styles.buttonPrimaryText}>Sign In to Passenger App</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : activeTab === 'tracking' ? (
            /* 2. LIVE TRACKING & DYNAMIC TIMELINE SCREEN */
            <View style={styles.trackingScreen}>
              {/* Route & Stop Selection Bar */}
              <View style={styles.cardElevated}>
                <View style={styles.routeHeaderRow}>
                  <View style={styles.routeBadge}>
                    <Text style={styles.routeBadgeText}>{selectedRoute.shortName}</Text>
                  </View>
                  <Text style={styles.routeFullTitle}>{selectedRoute.name}</Text>
                </View>

                {/* Stop Selection Pickers */}
                <View style={styles.pickersGrid}>
                  <View style={styles.pickerBox}>
                    <Text style={styles.pickerLabel}>PREFERRED BOARDING STOP</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.pickerButton}
                      onPress={() => {
                        setIsBoardingDropdownOpen(!isBoardingDropdownOpen);
                        setIsDestinationDropdownOpen(false);
                      }}
                    >
                      <View style={styles.pickerIconRow}>
                        <MapPinIcon color={COLORS.accent} size={16} />
                        <Text style={styles.pickerButtonText}>{boardingStop}</Text>
                      </View>
                      <ChevronDownIcon color={COLORS.textMuted} size={16} />
                    </TouchableOpacity>

                    {isBoardingDropdownOpen ? (
                      <View style={styles.dropdownMenu}>
                        {selectedRoute.stops.map((stop, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setBoardingStop(stop);
                              setIsBoardingDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{stop}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.pickerBox}>
                    <Text style={styles.pickerLabel}>DESTINATION STOP</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.pickerButton}
                      onPress={() => {
                        setIsDestinationDropdownOpen(!isDestinationDropdownOpen);
                        setIsBoardingDropdownOpen(false);
                      }}
                    >
                      <View style={styles.pickerIconRow}>
                        <FlagIcon color={COLORS.accent} size={16} />
                        <Text style={styles.pickerButtonText}>{destinationStop}</Text>
                      </View>
                      <ChevronDownIcon color={COLORS.textMuted} size={16} />
                    </TouchableOpacity>

                    {isDestinationDropdownOpen ? (
                      <View style={styles.dropdownMenu}>
                        {selectedRoute.stops.map((stop, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setDestinationStop(stop);
                              setIsDestinationDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{stop}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Interactive Map */}
              <View style={styles.cardMapElevated}>
                <View style={styles.mapHeaderRow}>
                  <Text style={styles.mapTitle}>Live Bus Location & Route</Text>
                  <View style={styles.etaPill}>
                    <Text style={styles.etaPillText}>Arriving in {liveBus.etaMinutes} min</Text>
                  </View>
                </View>

                <OpenStreetMapContainer
                  centerCoordinate={PASSENGER_COORDINATE}
                  busCoordinate={{ latitude: liveBus.latitude, longitude: liveBus.longitude }}
                  routeLine={[]}
                />

                <View style={styles.mapOverlayInfo}>
                  <Text style={styles.mapOverlayText}>Bus {liveBus.id} Approaching</Text>
                  <Text style={styles.mapOverlaySpeed}>{liveBus.speed} km/h</Text>
                </View>
              </View>

              {/* Dynamic Stop Tracker: Vertical Timeline */}
              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Dynamic Stop Tracker Timeline</Text>

                <View style={styles.verticalTimeline}>
                  {selectedRoute.stops.map((stopName, idx) => {
                    const isPassed = idx < boardingIndex;
                    const isBoarding = idx === boardingIndex;
                    const isDestination = idx === destinationIndex;
                    const isUpcoming = idx > boardingIndex && idx < destinationIndex;

                    return (
                      <View key={idx} style={styles.timelineStep}>
                        <View style={styles.timelineLeftColumn}>
                          <View
                            style={[
                              styles.timelineDot,
                              isPassed && styles.dotPassed,
                              isBoarding && styles.dotBoarding,
                              isDestination && styles.dotDestination,
                              isUpcoming && styles.dotUpcoming,
                            ]}
                          >
                            {isBoarding ? (
                              <View style={styles.dotInnerPulse} />
                            ) : isPassed ? (
                              <CheckIcon color={COLORS.white} size={9} />
                            ) : null}
                          </View>

                          {idx < selectedRoute.stops.length - 1 ? (
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
                              isBoarding && styles.stopNameBoarding,
                              isDestination && styles.stopNameDestination,
                            ]}
                          >
                            {stopName}
                          </Text>

                          <Text style={styles.stopTagText}>
                            {isPassed
                              ? 'PASSED'
                              : isBoarding
                              ? 'YOUR BOARDING STOP'
                              : isDestination
                              ? 'TARGET DESTINATION'
                              : 'UPCOMING STOP'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : activeTab === 'routes' ? (
            /* 3. ROUTE & STOP SELECTION BROWSER SCREEN */
            <View style={styles.routesScreen}>
              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Search & Select Bus Route</Text>
                <TextInput
                  style={styles.textInput}
                  value={routeSearchQuery}
                  onChangeText={setRouteSearchQuery}
                  placeholder="Search by route no. (138, 100, 177) or name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.routesList}>
                {filteredRoutes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    activeOpacity={0.8}
                    style={styles.cardElevatedRoute}
                    onPress={() => handleSelectRoute(route)}
                  >
                    <View style={styles.routeListHeader}>
                      <View style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route.shortName}</Text>
                      </View>
                      <View style={styles.actionIconRow}>
                        <Text style={styles.selectRouteAction}>Track Route</Text>
                        <ArrowRightIcon color={COLORS.accent} size={14} />
                      </View>
                    </View>

                    <Text style={styles.routeNameTitle}>{route.name}</Text>

                    <View style={styles.terminalsRow}>
                      <Text style={styles.terminalText}>Start: {route.startTerminal}</Text>
                      <Text style={styles.terminalText}>End: {route.endTerminal}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* 4. USER PROFILE & SETTINGS SCREEN */
            <View style={styles.profileScreen}>
              <View style={styles.cardElevated}>
                <View style={styles.profileAvatarHeader}>
                  <View style={styles.profileAvatarCircle}>
                    <Text style={styles.profileAvatarText}>
                      {(userProfile?.name || 'Kasun Perera').charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.profileNameText}>{userProfile?.name || 'Kasun Perera'}</Text>
                    <Text style={styles.profileUsernameText}>@{userProfile?.username || 'kasun_p'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Personal Details</Text>

                <View style={styles.profileDetailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{userProfile?.name || 'Kasun Perera'}</Text>
                </View>

                <View style={styles.profileDetailRow}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>{userProfile?.username || 'kasun_p'}</Text>
                </View>

                <View style={styles.profileDetailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{userProfile?.phone || '+94 77 123 4567'}</Text>
                </View>
              </View>

              <View style={styles.cardElevated}>
                <Text style={styles.cardSectionTitle}>Account Options</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.buttonSignOut}
                  onPress={handleLogout}
                >
                  <Text style={styles.buttonSignOutText}>Sign Out of Account</Text>
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
              onPress={() => setActiveTab('tracking')}
              style={[styles.tabBarItem, activeTab === 'tracking' && styles.tabBarItemActive]}
            >
              <MapPinIcon color={activeTab === 'tracking' ? COLORS.accent : COLORS.textMuted} size={20} />
              <Text style={activeTab === 'tracking' ? styles.tabTextActive : styles.tabTextMuted}>
                Live Tracker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('routes')}
              style={[styles.tabBarItem, activeTab === 'routes' && styles.tabBarItemActive]}
            >
              <BusIcon color={activeTab === 'routes' ? COLORS.accent : COLORS.textMuted} size={20} />
              <Text style={activeTab === 'routes' ? styles.tabTextActive : styles.tabTextMuted}>
                Routes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('profile')}
              style={[styles.tabBarItem, activeTab === 'profile' && styles.tabBarItemActive]}
            >
              <UserIcon color={activeTab === 'profile' ? COLORS.accent : COLORS.textMuted} size={20} />
              <Text style={activeTab === 'profile' ? styles.tabTextActive : styles.tabTextMuted}>
                My Profile
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
  badgePillActive: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.success,
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
  authScreen: {
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgBase,
    borderRadius: 12,
    padding: 4,
    marginTop: 18,
    width: '100%',
  },
  tabSwitchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabSwitchBtnActive: {
    backgroundColor: COLORS.bgSurface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabSwitchText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  tabSwitchTextActive: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardElevated: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    gap: 14,
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
  trackingScreen: {
    gap: 16,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeBadgeText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  routeFullTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  pickersGrid: {
    gap: 12,
    marginTop: 4,
  },
  pickerBox: {
    gap: 4,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  pickerButton: {
    backgroundColor: COLORS.bgBase,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerButtonText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  dropdownMenu: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  cardMapElevated: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    height: 340,
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
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  etaPill: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaPillText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  mapOverlayInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(28, 28, 30, 0.88)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapOverlayText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  mapOverlaySpeed: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
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
  dotBoarding: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotDestination: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
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
  stopNameText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  stopNameBoarding: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.accent,
  },
  stopNameDestination: {
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  stopTagText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  routesScreen: {
    gap: 16,
  },
  routesList: {
    gap: 12,
  },
  cardElevatedRoute: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  routeListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectRouteAction: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  routeNameTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  terminalsRow: {
    gap: 2,
    marginTop: 4,
  },
  terminalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  profileScreen: {
    gap: 16,
  },
  profileAvatarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  profileUsernameText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  profileDetailRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    paddingBottom: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: 3,
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
