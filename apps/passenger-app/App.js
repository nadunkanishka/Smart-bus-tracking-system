import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import OpenStreetMapContainer from './src/components/OpenStreetMapContainer';
import { COLORS, TYPOGRAPHY } from './src/constants/theme';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  BusIcon,
  CheckIcon,
  ChevronDownIcon,
  FlagIcon,
  LockIcon,
  MapIcon,
  MapPinIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
  NavigationArrowIcon,
  PhoneCallIcon,
  PlusIcon,
  RouteIcon,
  ScanIcon,
  SearchIcon,
  UserIcon,
} from './src/components/VectorIcons';

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROUTE_DATABASE = [
  {
    id: '138',
    name: 'Route 138: Pettah ➔ Maharagama',
    shortName: 'Route 138',
    startTerminal: 'Pettah Main Stand',
    endTerminal: 'Maharagama Depot',
    stops: ['Pettah', 'Borella Junction', 'Nugegoda Supermarket', 'High Level Stop', 'Maharagama'],
    duration: '38 min',
    activeBuses: 4,
  },
  {
    id: '100',
    name: 'Route 100: Panadura ➔ Colombo Fort',
    shortName: 'Route 100',
    startTerminal: 'Panadura Bus Stand',
    endTerminal: 'Colombo Fort Station',
    stops: ['Panadura', 'Moratuwa Town', 'Ratmalana Stop', 'Kollupitiya', 'Colombo Fort'],
    duration: '45 min',
    activeBuses: 3,
  },
  {
    id: '177',
    name: 'Route 177: Kaduwela ➔ Kollupitiya',
    shortName: 'Route 177',
    startTerminal: 'Kaduwela Clock Tower',
    endTerminal: 'Kollupitiya Station',
    stops: ['Kaduwela', 'Malabe Junction', 'Battaramulla', 'Rajagiriya', 'Kollupitiya'],
    duration: '52 min',
    activeBuses: 5,
  },
];

const INITIAL_BUS_LOCATION = {
  id: 'NB-4712',
  bookingId: 'H314315796',
  driverName: 'Sunil Perera',
  driverPhone: '+94 77 982 1104',
  latitude: 6.915,
  longitude: 79.875,
  speed: 28,
  etaMinutes: 4,
};

const PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };

// ─── Tabs ─────────────────────────────────────────────────────────────────────
// 'home' | 'tracking' | 'routes' | 'profile'

export default function App() {
  // Auth state (login/register screen present, but allows instant access without credentials)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authLoading, setAuthLoading] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Commuter Profile
  const [userProfile, setUserProfile] = useState({
    name: 'Colombo Passenger',
    phone: '+94 77 123 4567',
    type: 'Daily Commuter',
  });

  // Navigation
  const [activeTab, setActiveTab] = useState('tracking');
  const [isBoardingExpanded, setIsBoardingExpanded] = useState(false);
  const [isDestExpanded, setIsDestExpanded] = useState(false);

  // Route / stop selection
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(ROUTE_DATABASE[0]);
  const [boardingStop, setBoardingStop] = useState(ROUTE_DATABASE[0].stops[1]);
  const [destinationStop, setDestinationStop] = useState(ROUTE_DATABASE[0].stops[4]);

  // UI overlays
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isBoardingOpen, setIsBoardingOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Live bus simulation
  const [liveBus, setLiveBus] = useState(INITIAL_BUS_LOCATION);

  // ─── Derived ────────────────────────────────────────────────────────────────
  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return ROUTE_DATABASE;
    const q = routeSearchQuery.toLowerCase();
    return ROUTE_DATABASE.filter(r => r.id.includes(q) || r.name.toLowerCase().includes(q));
  }, [routeSearchQuery]);

  const boardingIndex = selectedRoute.stops.indexOf(boardingStop);
  const destinationIndex = selectedRoute.stops.indexOf(destinationStop);

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBus(prev => ({
        ...prev,
        latitude: prev.latitude + (Math.random() - 0.2) * 0.0004,
        longitude: prev.longitude + (Math.random() - 0.2) * 0.0004,
        speed: Math.max(16, prev.speed + Math.floor((Math.random() - 0.5) * 6)),
        etaMinutes: Math.max(1, prev.etaMinutes - (Math.random() > 0.75 ? 1 : 0)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function handleLogin() {
    setAuthLoading(true);
    setTimeout(() => {
      const username = loginUsername.trim() || 'Passenger';
      setUserProfile({
        name: username,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        phone: '+94 77 123 4567',
        type: 'Commuter',
      });
      setIsAuthenticated(true);
      setActiveTab('tracking');
      setAuthLoading(false);
      showToast(`Welcome, ${username}!`);
    }, 200);
  }

  function handleRegister() {
    setAuthLoading(true);
    setTimeout(() => {
      const name = regFullName.trim() || regUsername.trim() || 'Passenger';
      setUserProfile({
        name: name,
        username: (regUsername.trim() || 'passenger').toLowerCase().replace(/\s+/g, '_'),
        phone: regPhone.trim() || '+94 77 123 4567',
        type: 'Registered Commuter',
      });
      setIsAuthenticated(true);
      setActiveTab('tracking');
      setAuthLoading(false);
      showToast(`Account created! Welcome, ${name}.`);
    }, 200);
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('tracking');
  }

  function handleSelectRoute(route) {
    setSelectedRoute(route);
    setBoardingStop(route.stops[0]);
    setDestinationStop(route.stops[route.stops.length - 1]);
    setRouteSearchQuery('');
    setActiveTab('tracking');
  }

  function handleResetDefaults() {
    setBoardingStop(selectedRoute.stops[0]);
    setDestinationStop(selectedRoute.stops[selectedRoute.stops.length - 1]);
    showToast('Reset stops to route terminals.');
  }

  function showToast(msg) {
    setToastMsg(msg);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {/* ─── Toast ─────────────────────────────────────── */}
      {toastMsg ? (
        <View style={S.toast} pointerEvents="none">
          <Text style={S.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      {!isAuthenticated ? (
        /* ═══════════════════════════════════════════════════
            PASSENGER LOGIN / REGISTER
        ═══════════════════════════════════════════════════ */
        <ScrollView
          style={S.flex}
          contentContainerStyle={S.authScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Hero */}
          <View style={S.authHero}>
            <View style={S.authBrandOrb}>
              <BusIcon color="#FFFFFF" size={28} />
            </View>
            <Text style={S.authBrandTitle}>SmartBus</Text>
            <Text style={S.authBrandSub}>Real-time bus tracking for Colombo commuters</Text>
          </View>

          {/* Tab Switcher */}
          <View style={S.authTabs}>
            <TouchableOpacity
              style={[S.authTab, authMode === 'login' && S.authTabActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[S.authTabText, authMode === 'login' && S.authTabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.authTab, authMode === 'register' && S.authTabActive]}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[S.authTabText, authMode === 'register' && S.authTabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={S.authCard}>
            {authMode === 'login' ? (
              <>
                <Text style={S.authCardTitle}>Welcome Commuter</Text>
                <Text style={S.authCardSub}>Press Sign In to track your bus instantly</Text>

                <View style={S.field}>
                  <Text style={S.fieldLabel}>NAME OR USERNAME</Text>
                  <TextInput
                    style={S.input}
                    value={loginUsername}
                    onChangeText={setLoginUsername}
                    placeholder="Enter name (or leave blank to continue)"
                    placeholderTextColor="#A1A1AA"
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>PASSWORD</Text>
                  <TextInput
                    style={S.input}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Optional password"
                    placeholderTextColor="#A1A1AA"
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                </View>

                <TouchableOpacity
                  style={[S.primaryBtn, authLoading && S.primaryBtnDisabled]}
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  disabled={authLoading}
                >
                  {authLoading
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={S.primaryBtnText}>Sign In</Text>
                  }
                </TouchableOpacity>

                <Text style={S.authSwitch}>
                  New passenger?{' '}
                  <Text style={S.authSwitchLink} onPress={() => setAuthMode('register')}>
                    Create Account
                  </Text>
                </Text>
              </>
            ) : (
              <>
                <Text style={S.authCardTitle}>Create account</Text>
                <Text style={S.authCardSub}>Personalize your daily commuter experience</Text>

                <View style={S.field}>
                  <Text style={S.fieldLabel}>FULL NAME</Text>
                  <TextInput
                    style={S.input}
                    value={regFullName}
                    onChangeText={setRegFullName}
                    placeholder="e.g. Kasun Perera"
                    placeholderTextColor="#A1A1AA"
                    returnKeyType="next"
                  />
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>USERNAME</Text>
                  <TextInput
                    style={S.input}
                    value={regUsername}
                    onChangeText={setRegUsername}
                    placeholder="e.g. kasun_p"
                    placeholderTextColor="#A1A1AA"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>PHONE NUMBER</Text>
                  <TextInput
                    style={S.input}
                    value={regPhone}
                    onChangeText={setRegPhone}
                    placeholder="+94 77 123 4567"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="phone-pad"
                    returnKeyType="next"
                  />
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>PASSWORD</Text>
                  <TextInput
                    style={S.input}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    placeholder="Optional password"
                    placeholderTextColor="#A1A1AA"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                </View>

                <TouchableOpacity
                  style={[S.primaryBtn, authLoading && S.primaryBtnDisabled]}
                  onPress={handleRegister}
                  activeOpacity={0.85}
                  disabled={authLoading}
                >
                  {authLoading
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={S.primaryBtnText}>Create Account</Text>
                  }
                </TouchableOpacity>

                <Text style={S.authSwitch}>
                  Already have an account?{' '}
                  <Text style={S.authSwitchLink} onPress={() => setAuthMode('login')}>
                    Sign In
                  </Text>
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        /* ═══════════════════════════════════════════════════
            APPLICATION SHELL
        ═══════════════════════════════════════════════════ */
        <View style={S.appShell}>
          {/* ─── SCREEN AREA ──────────────────────────── */}
          <View style={S.flex}>
            {activeTab === 'tracking' ? (
              <TrackingScreen
                liveBus={liveBus}
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
              />
            ) : activeTab === 'home' ? (
              <HomeScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                liveBus={liveBus}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onGoTracking={() => setActiveTab('tracking')}
                onGoRoutes={() => setActiveTab('routes')}
                onOpenStops={() => setIsStopModalOpen(true)}
                showToast={showToast}
              />
            ) : activeTab === 'routes' ? (
              <RoutesScreen
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
              />
              <View style={S.modalSheet}>
                {/* Handle */}
                <View style={S.modalHandleRow}>
                  <View style={S.modalHandle} />
                </View>

                <View style={S.modalHeaderRow}>
                  <Text style={S.modalTitle}>Select Your Stops</Text>
                  <TouchableOpacity
                    style={S.modalCloseBtn}
                    onPress={() => setIsStopModalOpen(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={S.modalCloseBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Route selector */}
                  <Text style={S.modalSectionLabel}>ACTIVE ROUTE</Text>
                  <View style={S.routeChipsRow}>
                    {ROUTE_DATABASE.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        style={[S.routeChip, selectedRoute.id === r.id && S.routeChipActive]}
                        onPress={() => {
                          setSelectedRoute(r);
                          setBoardingStop(r.stops[0]);
                          setDestinationStop(r.stops[r.stops.length - 1]);
                          setIsBoardingOpen(false);
                          setIsDestOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[S.routeChipText, selectedRoute.id === r.id && S.routeChipTextActive]}>
                          {r.shortName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Boarding */}
                  <Text style={[S.modalSectionLabel, { marginTop: 20 }]}>BOARDING STOP</Text>
                  <TouchableOpacity
                    style={S.dropdownTrigger}
                    onPress={() => { setIsBoardingOpen(p => !p); setIsDestOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={S.dropdownTriggerLeft}>
                      <MapPinIcon color="#FF5B37" size={16} />
                      <Text style={S.dropdownTriggerText}>{boardingStop}</Text>
                    </View>
                    <ChevronDownIcon color="#71717A" size={16} />
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
                          {boardingStop === stop && <CheckIcon color="#FF5B37" size={14} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Destination */}
                  <Text style={[S.modalSectionLabel, { marginTop: 20 }]}>DESTINATION STOP</Text>
                  <TouchableOpacity
                    style={S.dropdownTrigger}
                    onPress={() => { setIsDestOpen(p => !p); setIsBoardingOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={S.dropdownTriggerLeft}>
                      <FlagIcon color="#FF5B37" size={16} />
                      <Text style={S.dropdownTriggerText}>{destinationStop}</Text>
                    </View>
                    <ChevronDownIcon color="#71717A" size={16} />
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
                          {destinationStop === stop && <CheckIcon color="#FF5B37" size={14} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Timeline */}
                  <Text style={[S.modalSectionLabel, { marginTop: 24 }]}>ROUTE TIMELINE</Text>
                  <View style={S.timelineContainer}>
                    {selectedRoute.stops.map((stop, idx) => {
                      const isPassed = idx < boardingIndex;
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
                              {isPassed ? 'Passed' : isBoarding ? 'Boarding Stop' : isDestination ? 'Destination' : 'Upcoming'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Screen Components ────────────────────────────────────────────────────────

function TrackingScreen({
  liveBus,
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
}) {
  return (
    <View style={S.flex}>
      {/* Floating Map Header */}
      <View style={S.mapHeader} pointerEvents="box-none">
        <View style={S.mapHeaderInner}>
          <View style={S.mapHeaderLeft}>
            <View style={S.liveChip}>
              <View style={S.liveDot} />
              <Text style={S.liveText}>LIVE</Text>
            </View>
            <Text style={S.mapHeaderTitle}>Bus Tracker</Text>
          </View>
          <TouchableOpacity style={S.mapMenuBtn} onPress={onOpenStops} activeOpacity={0.8}>
            <MoreVerticalIcon color="#121214" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map fills the top portion */}
      <View style={S.mapCanvas}>
        <OpenStreetMapContainer
          busLocationName={boardingStop}
          etaMins={liveBus.etaMinutes}
          busCoordinate={{ latitude: liveBus.latitude, longitude: liveBus.longitude }}
          passengerCoordinate={PASSENGER_COORDINATE}
        />
      </View>

      {/* ── INLINE STOP SELECTOR ─────────────────────────────────── */}
      <View style={S.stopSelectorBar}>
        {/* Boarding Stop */}
        <View style={S.stopSelectorCol}>
          <View style={S.stopSelectorHeader}>
            <View style={S.stopDotGreen} />
            <Text style={S.stopSelectorLabel}>BOARDING</Text>
          </View>
          <TouchableOpacity
            style={S.stopSelectorBtn}
            onPress={() => { setIsBoardingExpanded(p => !p); setIsDestExpanded(false); }}
            activeOpacity={0.8}
          >
            <Text style={S.stopSelectorValue} numberOfLines={1}>{boardingStop}</Text>
            <ChevronDownIcon color="#FF5B37" size={14} />
          </TouchableOpacity>
          {isBoardingExpanded && (
            <View style={S.stopInlineList}>
              {routeStops.map((stop, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[S.stopInlineItem, boardingStop === stop && S.stopInlineItemActive]}
                  onPress={() => { setBoardingStop(stop); setIsBoardingExpanded(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.stopInlineText, boardingStop === stop && S.stopInlineTextActive]}>{stop}</Text>
                  {boardingStop === stop && <CheckIcon color="#FF5B37" size={12} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Divider Arrow */}
        <View style={S.stopSelectorDivider}>
          <ArrowRightIcon color="#D4D4D8" size={16} />
        </View>

        {/* Destination Stop */}
        <View style={S.stopSelectorCol}>
          <View style={S.stopSelectorHeader}>
            <View style={S.stopDotOrange} />
            <Text style={S.stopSelectorLabel}>DESTINATION</Text>
          </View>
          <TouchableOpacity
            style={S.stopSelectorBtn}
            onPress={() => { setIsDestExpanded(p => !p); setIsBoardingExpanded(false); }}
            activeOpacity={0.8}
          >
            <Text style={S.stopSelectorValue} numberOfLines={1}>{destinationStop}</Text>
            <ChevronDownIcon color="#FF5B37" size={14} />
          </TouchableOpacity>
          {isDestExpanded && (
            <View style={[S.stopInlineList, S.stopInlineListRight]}>
              {routeStops.map((stop, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[S.stopInlineItem, destinationStop === stop && S.stopInlineItemActive]}
                  onPress={() => { setDestinationStop(stop); setIsDestExpanded(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.stopInlineText, destinationStop === stop && S.stopInlineTextActive]}>{stop}</Text>
                  {destinationStop === stop && <CheckIcon color="#FF5B37" size={12} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Dark Telemetry Sheet */}
      <View style={S.darkSheet}>
        {/* Drag Handle */}
        <View style={S.sheetHandleRow}>
          <View style={S.sheetHandle} />
        </View>

        {/* Header: Booking ID + Status */}
        <View style={S.sheetTopRow}>
          <View>
            <Text style={S.sheetMetaLabel}>BOOKING ID</Text>
            <Text style={S.sheetBookingId}>{liveBus.bookingId}</Text>
          </View>
          <View style={S.transitBadge}>
            <Text style={S.transitBadgeText}>In Transit</Text>
          </View>
        </View>

        {/* Horizontal Step Progress */}
        <View style={S.stepProgress}>
          <View style={S.stepLine}>
            {/* Step nodes */}
            <View style={S.stepDotCompleted}><CheckIcon color="#FFF" size={7} /></View>
            <View style={S.stepDash} />
            <View style={S.stepDotActive}><View style={S.stepDotInner} /></View>
            <View style={S.stepDash} />
            <View style={S.stepDotUpcoming} />
            <View style={S.stepDash} />
            <View style={S.stepDotTarget}><View style={S.stepTargetInner} /></View>
          </View>
          <View style={S.stepLabels}>
            <View>
              <Text style={S.stepLabelMeta}>Departed</Text>
              <Text style={S.stepLabelStop} numberOfLines={1}>{selectedRoute.startTerminal}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={S.stepLabelMeta}>{liveBus.etaMinutes} min away</Text>
              <Text style={S.stepLabelStop} numberOfLines={1}>{destinationStop}</Text>
            </View>
          </View>
        </View>

        {/* Telemetry Grid */}
        <View style={S.specsRow}>
          <View style={S.specBlock}>
            <Text style={S.specLabel}>FROM</Text>
            <Text style={S.specVal} numberOfLines={1}>{boardingStop}</Text>
          </View>
          <View style={S.specDivider} />
          <View style={S.specBlock}>
            <Text style={S.specLabel}>TO</Text>
            <Text style={S.specVal} numberOfLines={1}>{destinationStop}</Text>
          </View>
          <View style={S.specDivider} />
          <View style={S.specBlock}>
            <Text style={S.specLabel}>SPEED</Text>
            <Text style={[S.specVal, S.specValAccent]}>{liveBus.speed} km/h</Text>
          </View>
          <View style={S.specDivider} />
          <View style={S.specBlock}>
            <Text style={S.specLabel}>ETA</Text>
            <Text style={[S.specVal, S.specValAccent]}>{liveBus.etaMinutes} min</Text>
          </View>
        </View>

        {/* Driver Card */}
        <View style={S.driverCard}>
          <View style={S.driverLeft}>
            <View style={S.driverAvatar}>
              <Text style={S.driverAvatarText}>SP</Text>
            </View>
            <View>
              <Text style={S.driverName}>{liveBus.driverName}</Text>
              <Text style={S.driverRole}>Route Driver · {liveBus.id}</Text>
            </View>
          </View>
          <View style={S.driverStatusBadge}>
            <View style={S.driverStatusDot} />
            <Text style={S.driverStatusText}>On Duty</Text>
          </View>
        </View>

        {/* Change Stops Link */}
        <TouchableOpacity style={S.changeStopsLink} onPress={onOpenStops} activeOpacity={0.8}>
          <MapPinIcon color="#FF5B37" size={14} />
          <Text style={S.changeStopsText}>Change Boarding / Destination Stop</Text>
          <ArrowRightIcon color="#FF5B37" size={12} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HomeScreen({ userProfile, selectedRoute, liveBus, boardingStop, destinationStop, onGoTracking, onGoRoutes, onOpenStops, showToast }) {
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.homeScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting Header */}
      <View style={S.homeHeader}>
        <View>
          <Text style={S.homeGreeting}>Good morning,</Text>
          <Text style={S.homeUserName}>{userProfile?.name || 'Passenger'}</Text>
        </View>
        <TouchableOpacity
          style={S.bellBtn}
          onPress={() => showToast('No new alerts for Route ' + selectedRoute.id)}
          activeOpacity={0.8}
        >
          <BellIcon color="#121214" size={20} hasBadge />
        </TouchableOpacity>
      </View>

      {/* Travelling To Card */}
      <View style={S.travelCard}>
        <View style={S.travelCardLeft}>
          <BusIcon color="#FF5B37" size={20} />
          <View style={{ marginLeft: 12 }}>
            <Text style={S.travelCardLabel}>Travelling to</Text>
            <Text style={S.travelCardPlace}>{destinationStop}</Text>
          </View>
        </View>
        <TouchableOpacity style={S.travelCardBtn} onPress={onOpenStops} activeOpacity={0.8}>
          <Text style={S.travelCardBtnText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={S.quickRow}>
        <TouchableOpacity style={S.quickCard} onPress={onGoTracking} activeOpacity={0.88}>
          <NavigationArrowIcon color="#FF5B37" size={20} />
          <Text style={S.quickCardTitle}>Live{'\n'}Tracker</Text>
          <Text style={S.quickCardSub}>Map view</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.quickCard} onPress={onGoRoutes} activeOpacity={0.88}>
          <RouteIcon color="#121214" size={20} />
          <Text style={S.quickCardTitle}>Browse{'\n'}Routes</Text>
          <Text style={S.quickCardSub}>3 active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.quickCard} onPress={onOpenStops} activeOpacity={0.88}>
          <MapPinIcon color="#121214" size={20} />
          <Text style={S.quickCardTitle}>My{'\n'}Stops</Text>
          <Text style={S.quickCardSub}>Customize</Text>
        </TouchableOpacity>
      </View>

      {/* Active Journey Card */}
      <Text style={S.sectionTitle}>Active Journey</Text>
      <TouchableOpacity style={S.journeyCard} onPress={onGoTracking} activeOpacity={0.9}>
        <View style={S.journeyCardTop}>
          <View style={S.journeyBusIcon}>
            <BusIcon color="#FFF" size={18} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={S.journeyBusId}>Bus {liveBus.id}</Text>
            <Text style={S.journeyRouteName}>{selectedRoute.shortName}</Text>
          </View>
          <View style={S.inTransitBadge}>
            <Text style={S.inTransitText}>Transit</Text>
          </View>
        </View>

        {/* Horizontal progress bar */}
        <View style={S.journeyProgress}>
          <View style={S.journeyDotStart} />
          <View style={S.journeyLine}>
            <View style={S.journeyLineProgress} />
          </View>
          <View style={S.journeyBusPill}>
            <Text style={S.journeyBusPillText}>{liveBus.etaMinutes}m</Text>
          </View>
          <View style={S.journeyLine}>
            <View style={S.journeyLineProgress} />
          </View>
          <View style={S.journeyDotEnd} />
        </View>

        <View style={S.journeyTerminals}>
          <View>
            <Text style={S.journeyTerminalLabel}>FROM</Text>
            <Text style={S.journeyTerminalName}>{boardingStop}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.journeyTerminalLabel}>TO</Text>
            <Text style={S.journeyTerminalName}>{destinationStop}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Route Summary */}
      <View style={S.sectionRow}>
        <Text style={S.sectionTitle}>My Route</Text>
        <TouchableOpacity onPress={onGoRoutes} activeOpacity={0.7}>
          <Text style={S.sectionLink}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={S.routeSummaryCard}>
        <View style={S.routeSummaryHeader}>
          <View style={S.routeBadge}>
            <Text style={S.routeBadgeText}>{selectedRoute.shortName}</Text>
          </View>
          <Text style={S.routeSummaryMeta}>{selectedRoute.duration} · {selectedRoute.activeBuses} buses active</Text>
        </View>
        <Text style={S.routeSummaryName}>{selectedRoute.name}</Text>
        <View style={S.routeTerminalRow}>
          <Text style={S.routeTerminalText}>{selectedRoute.startTerminal}</Text>
          <ArrowRightIcon color="#A1A1AA" size={12} />
          <Text style={S.routeTerminalText}>{selectedRoute.endTerminal}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function RoutesScreen({ routeSearchQuery, setRouteSearchQuery, filteredRoutes, selectedRoute, onSelectRoute }) {
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.routesScroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={S.screenTitle}>Bus Routes</Text>
      <Text style={S.screenSubtitle}>Select a route to start tracking your bus</Text>

      {/* Search */}
      <View style={S.searchBar}>
        <SearchIcon color="#A1A1AA" size={18} />
        <TextInput
          style={S.searchInput}
          value={routeSearchQuery}
          onChangeText={setRouteSearchQuery}
          placeholder="Search route no. or stop name…"
          placeholderTextColor="#A1A1AA"
        />
        {routeSearchQuery ? (
          <TouchableOpacity onPress={() => setRouteSearchQuery('')} activeOpacity={0.7}>
            <Text style={S.searchClear}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Currently Selected */}
      {selectedRoute && (
        <View style={S.activeRouteBanner}>
          <View style={S.activeRouteLeft}>
            <NavigationArrowIcon color="#FF5B37" size={14} />
            <Text style={S.activeRouteBannerText}>
              Tracking {selectedRoute.shortName}
            </Text>
          </View>
          <View style={S.activeDot} />
        </View>
      )}

      {/* Route Cards */}
      {filteredRoutes.length === 0 ? (
        <View style={S.emptyState}>
          <BusIcon color="#D4D4D8" size={40} />
          <Text style={S.emptyStateTitle}>No routes found</Text>
          <Text style={S.emptyStateSub}>Try a different search term</Text>
        </View>
      ) : (
        filteredRoutes.map(route => (
          <TouchableOpacity
            key={route.id}
            style={[S.routeCard, selectedRoute.id === route.id && S.routeCardActive]}
            onPress={() => onSelectRoute(route)}
            activeOpacity={0.85}
          >
            <View style={S.routeCardTop}>
              <View style={[S.routeNumBadge, selectedRoute.id === route.id && S.routeNumBadgeActive]}>
                <Text style={[S.routeNumText, selectedRoute.id === route.id && S.routeNumTextActive]}>
                  {route.id}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.routeCardName} numberOfLines={1}>{route.name}</Text>
                <Text style={S.routeCardMeta}>{route.duration} · {route.activeBuses} buses</Text>
              </View>
              {selectedRoute.id === route.id ? (
                <View style={S.trackingPill}>
                  <Text style={S.trackingPillText}>Tracking</Text>
                </View>
              ) : (
                <View style={S.trackRoutePill}>
                  <Text style={S.trackRoutePillText}>Select</Text>
                  <ArrowRightIcon color="#FF5B37" size={12} />
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
        ))
      )}
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
      <View style={S.profileHero}>
        <View style={S.profileAvatar}>
          <Text style={S.profileAvatarText}>
            {(userProfile?.name || 'P').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={S.profileName}>{userProfile?.name || 'Passenger'}</Text>
        <Text style={S.profileUsername}>{userProfile?.type || 'Daily Commuter'}</Text>
      </View>

      {/* Commuter Information */}
      <View style={S.profileCard}>
        <Text style={S.profileCardTitle}>Commuter Information</Text>
        <ProfileRow label="Passenger Type" value={userProfile?.type || 'Daily Commuter'} />
        <ProfileRow label="Region" value="Western Province, Colombo" />
        <ProfileRow label="App Access" value="Instant Public Access (No Password)" />
      </View>

      {/* Journey Preferences */}
      <View style={S.profileCard}>
        <View style={S.profileCardHeader}>
          <Text style={S.profileCardTitle}>Journey Preferences</Text>
          <TouchableOpacity onPress={onOpenStops} activeOpacity={0.7}>
            <Text style={S.editLink}>Edit Stops</Text>
          </TouchableOpacity>
        </View>
        <ProfileRow label="Preferred Route" value={selectedRoute.shortName} />
        <ProfileRow label="Boarding Stop" value={boardingStop} accent />
        <ProfileRow label="Destination Stop" value={destinationStop} accent />
      </View>

      {/* Reset Stops Defaults */}
      <TouchableOpacity style={S.resetDefaultsBtn} onPress={onResetDefaults} activeOpacity={0.85}>
        <Text style={S.resetDefaultsBtnText}>Reset Route Terminals</Text>
      </TouchableOpacity>

      {/* Sign Out / Switch User */}
      <TouchableOpacity style={S.signOutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Text style={S.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProfileRow({ label, value, accent }) {
  return (
    <View style={S.profileRow}>
      <Text style={S.profileRowLabel}>{label}</Text>
      <Text style={[S.profileRowValue, accent && S.profileRowValueAccent]}>{value}</Text>
    </View>
  );
}

function BottomDock({ activeTab, setActiveTab }) {
  const items = [
    { id: 'home', label: 'Home', icon: (active) => <MapIcon color={active ? '#FFFFFF' : '#8E8E93'} size={19} /> },
    { id: 'tracking', label: 'Track', icon: (active) => <NavigationArrowIcon color={active ? '#FFFFFF' : '#8E8E93'} size={18} /> },
    { id: 'routes', label: 'Routes', icon: (active) => <RouteIcon color={active ? '#FFFFFF' : '#8E8E93'} size={19} /> },
    { id: 'profile', label: 'Profile', icon: (active) => <UserIcon color={active ? '#FFFFFF' : '#8E8E93'} size={19} /> },
  ];

  return (
    <View style={S.dockWrapper}>
      <View style={S.dock}>
        {items.map(item => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={S.dockItem}
              onPress={() => setActiveTab(item.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[S.dockBtn, isActive && S.dockBtnPrimary]}>
                {item.icon(isActive)}
                <Text
                  style={[S.dockLabel, isActive && S.dockLabelPrimary]}
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

const S = StyleSheet.create({
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
  authScroll: { padding: 24, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, paddingBottom: 40 },
  authHero: { alignItems: 'center', marginBottom: 32 },
  authBrandOrb: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#141416',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 6,
  },
  authBrandTitle: { fontSize: 26, fontWeight: '800', color: '#121214', letterSpacing: -0.5 },
  authBrandSub: { fontSize: 14, color: '#71717A', marginTop: 5, textAlign: 'center' },

  authTabs: {
    flexDirection: 'row', backgroundColor: '#EAEAEE', borderRadius: 14, padding: 3, marginBottom: 20,
  },
  authTab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  authTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  authTabText: { fontSize: 14, fontWeight: '500', color: '#71717A' },
  authTabTextActive: { fontWeight: '700', color: '#121214' },

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
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
    shadowColor: '#FF5B37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  authSwitch: { textAlign: 'center', fontSize: 13, color: '#71717A', marginTop: 16 },
  authSwitchLink: { color: '#FF5B37', fontWeight: '600' },

  // ─── Tracking Screen ────────────────────────────────────
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
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  mapHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#121214' },
  mapMenuBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F4F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  mapCanvas: { flex: 1 },

  // Dark Sheet
  darkSheet: {
    backgroundColor: '#141416', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 95,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  sheetHandleRow: { alignItems: 'center', paddingVertical: 8 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3F3F46' },
  sheetTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sheetMetaLabel: { fontSize: 10, color: '#71717A', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  sheetBookingId: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  transitBadge: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: '#1E1E22', borderWidth: 1, borderColor: '#2C2C31',
  },
  transitBadgeText: { fontSize: 11, fontWeight: '600', color: '#D4D4D8' },

  // Step Progress
  stepProgress: { marginBottom: 16, backgroundColor: '#1C1C1F', borderRadius: 18, padding: 16 },
  stepLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepDotCompleted: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF5B37',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDash: { flex: 1, height: 2, backgroundColor: '#2C2C31', marginHorizontal: 4, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3F3F46' },
  stepDotActive: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,91,55,0.2)',
    borderWidth: 2, borderColor: '#FF5B37', alignItems: 'center', justifyContent: 'center',
  },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5B37' },
  stepDotUpcoming: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#3F3F46' },
  stepDotTarget: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#52525B', alignItems: 'center', justifyContent: 'center' },
  stepTargetInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#71717A' },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  stepLabelMeta: { fontSize: 10, color: '#71717A', fontWeight: '500' },
  stepLabelStop: { fontSize: 13, fontWeight: '600', color: '#FFF', marginTop: 2, maxWidth: 130 },

  // Specs Row
  specsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1F', borderRadius: 16, padding: 14, marginBottom: 14,
  },
  specBlock: { flex: 1, alignItems: 'center' },
  specDivider: { width: 1, height: 32, backgroundColor: '#2C2C31' },
  specLabel: { fontSize: 9, color: '#71717A', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  specVal: { fontSize: 12, fontWeight: '600', color: '#D4D4D8', textAlign: 'center' },
  specValAccent: { color: '#FF5B37', fontWeight: '700', fontSize: 13 },

  // Driver Card
  driverCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1C1F', borderRadius: 18, padding: 14, marginBottom: 12,
  },
  driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#27272A',
    borderWidth: 2, borderColor: '#FF5B37', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  driverAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  driverName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  driverRole: { fontSize: 11, color: '#71717A', marginTop: 2 },
  driverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 6,
  },
  driverStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  driverStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
  },

  // Change Stops link
  changeStopsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8,
  },
  changeStopsText: { fontSize: 12, color: '#FF5B37', fontWeight: '600' },

  // ─── Home Screen ────────────────────────────────────────
  homeScroll: { padding: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, paddingBottom: 110 },

  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  homeGreeting: { fontSize: 13, color: '#71717A', fontWeight: '500' },
  homeUserName: { fontSize: 22, fontWeight: '800', color: '#121214', letterSpacing: -0.4, marginTop: 2 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },

  travelCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  travelCardLeft: { flexDirection: 'row', alignItems: 'center' },
  travelCardLabel: { fontSize: 11, color: '#71717A', fontWeight: '500' },
  travelCardPlace: { fontSize: 15, fontWeight: '700', color: '#121214', marginTop: 1 },
  travelCardBtn: { backgroundColor: '#F4F4F6', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  travelCardBtnText: { fontSize: 12, fontWeight: '600', color: '#52525B' },

  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 14,
    alignItems: 'flex-start', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E8E8EC', minHeight: 90,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  quickCardTitle: { fontSize: 13, fontWeight: '700', color: '#121214', marginTop: 8, lineHeight: 17 },
  quickCardSub: { fontSize: 10, color: '#A1A1AA', fontWeight: '500', marginTop: 2 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#121214', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLink: { fontSize: 13, fontWeight: '600', color: '#FF5B37' },

  journeyCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 3,
  },
  journeyCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  journeyBusIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#141416',
    alignItems: 'center', justifyContent: 'center',
  },
  journeyBusId: { fontSize: 15, fontWeight: '700', color: '#121214' },
  journeyRouteName: { fontSize: 12, color: '#71717A', marginTop: 2 },
  inTransitBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  inTransitText: { fontSize: 11, fontWeight: '600', color: '#52525B' },

  journeyProgress: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  journeyDotStart: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5B37' },
  journeyLine: { flex: 1, height: 2, backgroundColor: '#F0F0F3', marginHorizontal: 4 },
  journeyLineProgress: { width: '40%', height: '100%', backgroundColor: '#FF5B37', borderRadius: 1 },
  journeyBusPill: {
    backgroundColor: '#141416', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  journeyBusPillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  journeyDotEnd: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#D4D4D8' },
  journeyTerminals: { flexDirection: 'row', justifyContent: 'space-between' },
  journeyTerminalLabel: { fontSize: 10, color: '#A1A1AA', fontWeight: '600', letterSpacing: 0.5 },
  journeyTerminalName: { fontSize: 13, fontWeight: '600', color: '#121214', marginTop: 2 },

  routeSummaryCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  routeSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeBadge: {
    backgroundColor: '#141416', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 10,
  },
  routeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  routeSummaryMeta: { fontSize: 12, color: '#71717A' },
  routeSummaryName: { fontSize: 14, fontWeight: '600', color: '#121214', marginBottom: 6 },
  routeTerminalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeTerminalText: { fontSize: 12, color: '#71717A', flex: 1 },

  // ─── Routes Screen ──────────────────────────────────────
  routesScroll: { padding: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, paddingBottom: 110 },
  screenTitle: { fontSize: 22, fontWeight: '800', color: '#121214', letterSpacing: -0.4 },
  screenSubtitle: { fontSize: 14, color: '#71717A', marginTop: 4, marginBottom: 20 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 999, paddingHorizontal: 18, height: 52,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#121214', marginHorizontal: 10 },
  searchClear: { fontSize: 14, color: '#A1A1AA', fontWeight: '600' },

  activeRouteBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,91,55,0.08)', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,91,55,0.2)',
  },
  activeRouteLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeRouteBannerText: { fontSize: 13, fontWeight: '600', color: '#FF5B37' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: '#121214', marginTop: 16 },
  emptyStateSub: { fontSize: 13, color: '#A1A1AA', marginTop: 4 },

  routeCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  routeCardActive: { borderColor: 'rgba(255,91,55,0.3)', backgroundColor: '#FFFAF9' },
  routeCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  routeNumBadge: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#F4F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  routeNumBadgeActive: { backgroundColor: '#141416' },
  routeNumText: { fontSize: 14, fontWeight: '800', color: '#121214' },
  routeNumTextActive: { color: '#FFF' },
  routeCardName: { fontSize: 14, fontWeight: '600', color: '#121214' },
  routeCardMeta: { fontSize: 12, color: '#A1A1AA', marginTop: 2 },
  trackingPill: { backgroundColor: 'rgba(255,91,55,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  trackingPillText: { fontSize: 11, fontWeight: '600', color: '#FF5B37' },
  trackRoutePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F9F9FB', borderRadius: 999 },
  trackRoutePillText: { fontSize: 11, fontWeight: '600', color: '#FF5B37' },

  routeTerminalsCard: { marginBottom: 12 },
  terminalItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  terminalDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  terminalDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5B37' },
  terminalDashedLine: { width: 1, height: 14, backgroundColor: '#E4E4E7', marginLeft: 4 },
  terminalName: { fontSize: 13, color: '#52525B', fontWeight: '500', flex: 1 },

  stopsScroll: { marginTop: 4 },
  stopChip: { backgroundColor: '#F4F4F6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8 },
  stopChipText: { fontSize: 11, color: '#71717A', fontWeight: '500' },

  // ─── Profile Screen ─────────────────────────────────────
  profileScroll: { padding: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16, paddingBottom: 110 },
  profileHero: {
    alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 28, marginBottom: 16,
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  profileAvatar: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#141416',
    borderWidth: 3, borderColor: '#FF5B37', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileAvatarText: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#121214' },
  profileUsername: { fontSize: 13, color: '#A1A1AA', marginTop: 3 },

  profileCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: '#E8E8EC',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  profileCardTitle: { fontSize: 15, fontWeight: '700', color: '#121214', marginBottom: 14 },
  editLink: { fontSize: 13, fontWeight: '600', color: '#FF5B37' },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F4F4F6',
  },
  profileRowLabel: { fontSize: 13, color: '#71717A' },
  profileRowValue: { fontSize: 13, fontWeight: '600', color: '#121214', maxWidth: '55%', textAlign: 'right' },
  profileRowValueAccent: { color: '#FF5B37' },

  resetDefaultsBtn: {
    height: 48, borderRadius: 14, backgroundColor: '#F4F4F6',
    borderWidth: 1, borderColor: '#E4E4E8',
    alignItems: 'center', justifyContent: 'center',
  },
  resetDefaultsBtnText: { color: '#71717A', fontSize: 14, fontWeight: '600' },
  signOutBtn: {
    height: 48, borderRadius: 14, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  signOutBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },

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

  // ─── Inline Stop Selector ──────────────────────────────────
  stopSelectorBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  stopSelectorCol: { flex: 1, position: 'relative' },
  stopSelectorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  stopDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  stopDotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5B37' },
  stopSelectorLabel: { fontSize: 9, fontWeight: '700', color: '#A1A1AA', letterSpacing: 0.8 },
  stopSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E8E8EC',
  },
  stopSelectorValue: { fontSize: 13, fontWeight: '700', color: '#121214', flex: 1, marginRight: 4 },
  stopSelectorDivider: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingTop: 18,
  },
  stopInlineList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    marginTop: 4,
  },
  stopInlineListRight: { left: 'auto', right: 0 },
  stopInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  stopInlineItemActive: { backgroundColor: 'rgba(255,91,55,0.06)' },
  stopInlineText: { fontSize: 13, color: '#121214', fontWeight: '500' },
  stopInlineTextActive: { color: '#FF5B37', fontWeight: '700' },

  // ─── Stop Selector Modal ─────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, maxHeight: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  modalHandleRow: { alignItems: 'center', paddingBottom: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E4E4E7' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#121214' },
  modalCloseBtn: { backgroundColor: '#FF5B37', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
  modalCloseBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  modalSectionLabel: { fontSize: 10, fontWeight: '700', color: '#A1A1AA', letterSpacing: 0.9, marginBottom: 10 },

  routeChipsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  routeChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: '#F4F4F6', borderWidth: 1, borderColor: '#E8E8EC',
  },
  routeChipActive: { backgroundColor: '#141416', borderColor: '#141416' },
  routeChipText: { fontSize: 13, fontWeight: '600', color: '#52525B' },
  routeChipTextActive: { color: '#FFF' },

  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F7F7F9', borderRadius: 14, paddingHorizontal: 16, height: 50,
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownTriggerText: { fontSize: 14, fontWeight: '600', color: '#121214' },
  dropdownList: {
    backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E8E8EC',
    marginTop: 6, overflow: 'hidden',
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F4F4F6' },
  dropdownItemActive: { backgroundColor: 'rgba(255,91,55,0.06)' },
  dropdownItemText: { fontSize: 14, color: '#121214' },
  dropdownItemTextActive: { color: '#FF5B37', fontWeight: '600' },

  // Timeline
  timelineContainer: { paddingVertical: 4 },
  timelineRow: { flexDirection: 'row', marginBottom: 8 },
  timelineLeft: { alignItems: 'center', width: 22, marginRight: 12 },
  timelineDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#D4D4D8',
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  dotPassed: { backgroundColor: '#10B981', borderColor: '#10B981' },
  dotBoarding: { backgroundColor: '#FF5B37', borderColor: '#FF5B37' },
  dotDestination: { backgroundColor: '#141416', borderColor: '#141416' },
  dotActive: { borderColor: '#FF5B37' },
  timelineLineV: { width: 2, flex: 1, backgroundColor: '#E4E4E7', marginVertical: 3 },
  lineVPassed: { backgroundColor: '#10B981' },
  timelineRight: { flex: 1, paddingTop: 1 },
  timelineStopName: { fontSize: 13, fontWeight: '500', color: '#121214' },
  timelineStopNameHighlight: { fontWeight: '700', color: '#FF5B37' },
  timelineTag: { fontSize: 10, color: '#A1A1AA', marginTop: 2 },

  // ─── Contact Modal ───────────────────────────────────────
  contactSheet: { paddingBottom: 36 },
  contactDriverRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB',
    borderRadius: 18, padding: 16, marginBottom: 20,
  },
  contactAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#141416',
    borderWidth: 2, borderColor: '#FF5B37', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  contactAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  contactDriverInfo: { flex: 1 },
  contactDriverName: { fontSize: 16, fontWeight: '700', color: '#121214' },
  contactDriverRole: { fontSize: 12, color: '#71717A', marginTop: 2 },
  contactDriverPhone: { fontSize: 13, fontWeight: '600', color: '#FF5B37', marginTop: 4 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#141416', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },

  contactTabs: {
    flexDirection: 'row', backgroundColor: '#F0F0F3', borderRadius: 14, padding: 3, marginBottom: 20,
  },
  contactTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 11 },
  contactTabActive: { backgroundColor: '#141416' },
  contactTabText: { fontSize: 13, fontWeight: '500', color: '#71717A' },
  contactTabTextActive: { color: '#FFF', fontWeight: '700' },

  callView: { alignItems: 'center' },
  callLabel: { fontSize: 11, fontWeight: '700', color: '#A1A1AA', letterSpacing: 0.7, marginBottom: 8 },
  callNumber: { fontSize: 26, fontWeight: '800', color: '#121214', letterSpacing: 1, marginBottom: 8 },
  callNote: { fontSize: 13, color: '#71717A', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  callActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF5B37', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 18,
    shadowColor: '#FF5B37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  callActionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  messageView: { width: '100%' },
  quickMsgBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9F9FB', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#E8E8EC',
  },
  quickMsgText: { fontSize: 14, color: '#121214', fontWeight: '500', flex: 1 },
});
