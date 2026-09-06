import React, { useEffect, useMemo, useState } from 'react';
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
  ScanIcon,
  SearchIcon,
  SpeedometerIcon,
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

  // Core Navigation Tab: 'home' (left screen), 'tracking' (right screen - map focus), 'profile'
  const [activeTab, setActiveTab] = useState('tracking');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(ROUTE_DATABASE[0]);
  const [boardingStop, setBoardingStop] = useState(ROUTE_DATABASE[0].stops[1]);
  const [destinationStop, setDestinationStop] = useState(ROUTE_DATABASE[0].stops[4]);

  // Modal / Drawer state for stop management
  const [isStopSelectorOpen, setIsStopSelectorOpen] = useState(false);
  const [isBoardingDropdownOpen, setIsBoardingDropdownOpen] = useState(false);
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
  const [callNotice, setCallNotice] = useState('');

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
        speed: Math.max(16, prev.speed + Math.floor((Math.random() - 0.5) * 6)),
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

  function handleTriggerCall() {
    setCallNotice('Calling Driver Sunil Perera (+94 77 982 1104)...');
    setTimeout(() => setCallNotice(''), 3500);
  }

  function handleTriggerMessage() {
    setCallNotice('Opening driver dispatch message chat...');
    setTimeout(() => setCallNotice(''), 3500);
  }

  // Calculate passed, upcoming, and target stop indexes
  const boardingIndex = selectedRoute.stops.indexOf(boardingStop);
  const destinationIndex = selectedRoute.stops.indexOf(destinationStop);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgBase} translucent={Platform.OS === 'android'} />

      <View style={styles.phoneContainer}>
        {/* TOP STATUS BAR (Dynamic Island feel) */}
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

        {/* FEEDBACK NOTICE PILL */}
        {callNotice ? (
          <View style={styles.toastNotice}>
            <Text style={styles.toastNoticeText}>{callNotice}</Text>
          </View>
        ) : null}

        {/* MAIN BODY VIEWPORT */}
        {!isAuthenticated ? (
          /* 1. AUTHENTICATION SCREENS (Orbix 2025 Aesthetic) */
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.authContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authHeaderBox}>
              <View style={styles.brandOrb}>
                <BusIcon color="#FFFFFF" size={26} />
              </View>
              <Text style={styles.authBrandTitle}>Orbix Transit</Text>
              <Text style={styles.authBrandSubtitle}>
                Next-Gen Real-Time Transit & Smart Bus Tracking Platform
              </Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.authTabSwitcher}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.authTabBtn, authMode === 'login' && styles.authTabBtnActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={authMode === 'login' ? styles.authTabTextActive : styles.authTabText}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.authTabBtn, authMode === 'register' && styles.authTabBtnActive]}
                onPress={() => setAuthMode('register')}
              >
                <Text style={authMode === 'register' ? styles.authTabTextActive : styles.authTabText}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.authCard}>
              {authMode === 'register' ? (
                <>
                  <Text style={styles.cardHeading}>Create Passenger Account</Text>
                  <Text style={styles.cardSubheading}>Track your route in real-time with live ETAs</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regFullName}
                      onChangeText={setRegFullName}
                      placeholder="e.g. Kasun Perera"
                      placeholderTextColor={COLORS.textMutedLight}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>USERNAME</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regUsername}
                      onChangeText={setRegUsername}
                      placeholder="e.g. kasun_p"
                      placeholderTextColor={COLORS.textMutedLight}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regPhone}
                      onChangeText={setRegPhone}
                      placeholder="+94 77 123 4567"
                      placeholderTextColor={COLORS.textMutedLight}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <TextInput
                      style={styles.textInput}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      placeholder="Create security password"
                      placeholderTextColor={COLORS.textMutedLight}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.primaryActionButton}
                    onPress={handleRegisterSubmit}
                  >
                    <Text style={styles.primaryActionButtonText}>Register & Enter App</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardHeading}>Welcome Back</Text>
                  <Text style={styles.cardSubheading}>Sign in to view live route movements and ETAs</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>USERNAME</Text>
                    <TextInput
                      style={styles.textInput}
                      value={loginUsername}
                      onChangeText={setLoginUsername}
                      placeholder="Enter username (e.g. kasun_p)"
                      placeholderTextColor={COLORS.textMutedLight}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <TextInput
                      style={styles.textInput}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      placeholder="Enter password"
                      placeholderTextColor={COLORS.textMutedLight}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.primaryActionButton}
                    onPress={handleLoginSubmit}
                  >
                    <Text style={styles.primaryActionButtonText}>Sign In to App</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        ) : activeTab === 'tracking' ? (
          /* 2. LIVE TRACKING VIEW (PRIMARY MAP FOCUS - MATCHING RIGHT SCREEN OF REFERENCE) */
          <View style={styles.trackingViewport}>
            {/* MINIMAL FLOATING TOP BAR OVER MAP */}
            <View style={styles.mapTopHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.circularGlassBtn}
                onPress={() => setActiveTab('routes')}
              >
                <ArrowLeftIcon color={COLORS.textPrimary} size={18} />
              </TouchableOpacity>

              <Text style={styles.mapScreenTitle}>Location Tracking</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.circularGlassBtn}
                onPress={() => setIsStopSelectorOpen(true)}
              >
                <MoreVerticalIcon color={COLORS.textPrimary} size={18} />
              </TouchableOpacity>
            </View>

            {/* FULL IMMERSIVE INTERACTIVE MAP */}
            <View style={styles.mapCanvasWrapper}>
              <OpenStreetMapContainer
                busLocationName={boardingStop}
                etaMins={liveBus.etaMinutes}
                busCoordinate={{ latitude: liveBus.latitude, longitude: liveBus.longitude }}
                passengerCoordinate={PASSENGER_COORDINATE}
              />
            </View>

            {/* DARK OBSIDIAN BOTTOM HERO SHEET (Matching Reference Right Screen) */}
            <View style={styles.darkHeroSheet}>
              {/* Sheet Drag Handle */}
              <View style={styles.sheetHandleRow}>
                <View style={styles.sheetHandleBar} />
              </View>

              {/* Booking ID & Transit Pill Header */}
              <View style={styles.sheetHeaderRow}>
                <View>
                  <Text style={styles.sheetMetaLabel}>Booking Id:</Text>
                  <Text style={styles.sheetBookingIdText}>
                    {liveBus.bookingId || 'H314315796'}
                  </Text>
                </View>
                <View style={styles.transitStatusBadge}>
                  <Text style={styles.transitStatusText}>Transit</Text>
                </View>
              </View>

              {/* HORIZONTAL STEP PROGRESS TRACKER (Reference right screen) */}
              <View style={styles.stepTrackerContainer}>
                <View style={styles.stepTrackLine}>
                  {/* Step 1: Created / Origin */}
                  <View style={styles.stepNode}>
                    <View style={styles.stepCircleCompleted}>
                      <CheckIcon color="#FFFFFF" size={8} />
                    </View>
                  </View>

                  <View style={styles.stepDottedPath} />

                  {/* Step 2: In-Transit / Active Bus */}
                  <View style={styles.stepNode}>
                    <View style={styles.stepCircleActive}>
                      <View style={styles.stepInnerDot} />
                    </View>
                  </View>

                  <View style={styles.stepDottedPath} />

                  {/* Step 3: Upcoming Boarding Stop */}
                  <View style={styles.stepNode}>
                    <View style={styles.stepCircleUpcoming} />
                  </View>

                  <View style={styles.stepDottedPath} />

                  {/* Step 4: Target Destination */}
                  <View style={styles.stepNode}>
                    <View style={styles.stepCircleTarget}>
                      <View style={styles.stepTargetInner} />
                    </View>
                  </View>
                </View>

                {/* Sub-labels below steps */}
                <View style={styles.stepLabelsRow}>
                  <View>
                    <Text style={styles.stepMetaText}>Created, 18 Oct 2025</Text>
                    <Text style={styles.stepLocationText}>{selectedRoute.startTerminal}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.stepMetaText}>
                      Estimated, {liveBus.etaMinutes} min
                    </Text>
                    <Text style={styles.stepLocationText}>{destinationStop}</Text>
                  </View>
                </View>
              </View>

              {/* 2-COLUMN TELEMETRY SPEC GRID (From/To, Speed, Boarding) */}
              <View style={styles.specsGrid}>
                <View style={styles.specColumn}>
                  <Text style={styles.specLabel}>From</Text>
                  <Text style={styles.specValue}>{boardingStop}</Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Vehicle No.</Text>
                  <Text style={styles.specValue}>{liveBus.id}</Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Line / Route</Text>
                  <Text style={styles.specValue}>{selectedRoute.shortName}</Text>
                </View>

                <View style={styles.specColumn}>
                  <Text style={styles.specLabel}>To</Text>
                  <Text style={styles.specValue}>{destinationStop}</Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Live Speed</Text>
                  <Text style={styles.specValueHighlight}>{liveBus.speed} km/h</Text>

                  <View style={styles.specSpacer} />

                  <Text style={styles.specLabel}>Status</Text>
                  <Text style={styles.specValue}>On Schedule</Text>
                </View>
              </View>

              {/* DRIVER / COURIER CARD WITH QUICK CALL & CHAT BUTTONS */}
              <View style={styles.driverProfileBar}>
                <View style={styles.driverInfoCol}>
                  <View style={styles.driverAvatar}>
                    <Text style={styles.driverAvatarInitial}>SP</Text>
                  </View>
                  <View>
                    <Text style={styles.driverName}>Sunil Perera</Text>
                    <Text style={styles.driverRole}>Route Captain · Senior</Text>
                  </View>
                </View>

                <View style={styles.driverActionButtons}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.phoneCallButton}
                    onPress={handleTriggerCall}
                  >
                    <PhoneCallIcon color="#FFFFFF" size={17} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.messageButton}
                    onPress={handleTriggerMessage}
                  >
                    <MessageCircleIcon color="#121214" size={17} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : activeTab === 'routes' ? (
          /* 3. HOME & ROUTE DISCOVERY VIEW (MATCHING LEFT SCREEN OF REFERENCE) */
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.homeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Location Pill & Notification Bell */}
            <View style={styles.homeTopNav}>
              <View style={styles.deliveryToBox}>
                <BusIcon color={COLORS.accent} size={18} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.deliveryToLabel}>Travelling to</Text>
                  <Text style={styles.deliveryToAddress}>{boardingStop}, Colombo</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.bellButton}
                onPress={() => {
                  setCallNotice('No new transit alerts for Route ' + selectedRoute.id);
                  setTimeout(() => setCallNotice(''), 3000);
                }}
              >
                <BellIcon color={COLORS.textPrimary} size={20} hasBadge />
              </TouchableOpacity>
            </View>

            {/* SEARCH CAPSULE BAR */}
            <View style={styles.searchCapsuleContainer}>
              <SearchIcon color={COLORS.textMuted} size={18} />
              <TextInput
                style={styles.searchCapsuleInput}
                value={routeSearchQuery}
                onChangeText={setRouteSearchQuery}
                placeholder="Search route no. (138, 100, 177) or stop..."
                placeholderTextColor={COLORS.textMutedLight}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.scanBtn}
                onPress={() => setIsStopSelectorOpen(true)}
              >
                <ScanIcon color={COLORS.textPrimary} size={18} />
              </TouchableOpacity>
            </View>

            {/* QUICK ACTION TILES (New Delivery / Track Package equivalent) */}
            <View style={styles.quickTilesRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.quickTile}
                onPress={() => setActiveTab('tracking')}
              >
                <View>
                  <Text style={styles.quickTileTitle}>Live Bus{'\n'}Tracker</Text>
                </View>
                <View style={styles.tileBadgeOrb}>
                  <NavigationArrowIcon color="#FF5B37" size={16} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.quickTile}
                onPress={() => setIsStopSelectorOpen(true)}
              >
                <View>
                  <Text style={styles.quickTileTitle}>Change{'\n'}Stops</Text>
                </View>
                <View style={[styles.tileBadgeOrb, { backgroundColor: '#F0F0F3' }]}>
                  <MapPinIcon color={COLORS.textPrimary} size={16} />
                </View>
              </TouchableOpacity>
            </View>

            {/* CURRENT SHIPMENT / ACTIVE JOURNEY CARD (Matching Left Reference Card) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Current Shipment</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('tracking')}>
                <Text style={styles.sectionLink}>See All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.currentShipmentCard}
              onPress={() => setActiveTab('tracking')}
            >
              <View style={styles.shipmentTopRow}>
                <View style={styles.shipmentDeviceThumb}>
                  <BusIcon color="#FFFFFF" size={18} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.shipmentIdText}>ID: {liveBus.bookingId}</Text>
                  <Text style={styles.shipmentItemName}>{selectedRoute.name}</Text>
                </View>
                <View style={styles.transitMiniBadge}>
                  <Text style={styles.transitMiniBadgeText}>Transit</Text>
                </View>
              </View>

              {/* Horizontal Route Progress with "4m Away" Badge */}
              <View style={styles.cardTrackRow}>
                <View style={styles.cardDotActive} />
                <View style={styles.cardDottedLine} />
                <View style={styles.cardBusBadgePill}>
                  <Text style={styles.cardBusBadgeText}>{liveBus.etaMinutes}m Away</Text>
                </View>
                <View style={styles.cardDottedLine} />
                <View style={styles.cardDotTarget} />
              </View>

              {/* Terminal Labels */}
              <View style={styles.cardTerminalsRow}>
                <View>
                  <Text style={styles.cardTerminalDate}>18 Oct 2025</Text>
                  <Text style={styles.cardTerminalPlace}>{boardingStop}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardTerminalDate}>Estimated 19 Oct 2025</Text>
                  <Text style={styles.cardTerminalPlace}>{destinationStop}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* RECENT SHIPMENT / AVAILABLE ROUTES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Shipment</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionLink}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.routesList}>
              {filteredRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  activeOpacity={0.85}
                  style={styles.routeItemCard}
                  onPress={() => handleSelectRoute(route)}
                >
                  <View style={styles.routeItemLeft}>
                    <View style={styles.routeThumbCircle}>
                      <BusIcon color={COLORS.textPrimary} size={18} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.routeItemCode}>ID: H314{route.id}892</Text>
                      <Text style={styles.routeItemTitle}>{route.shortName}</Text>
                      <Text style={styles.routeItemStopsText}>
                        {route.startTerminal} ➔ {route.endTerminal}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.routeStatusPill,
                      route.id === selectedRoute.id && styles.routeStatusPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.routeStatusText,
                        route.id === selectedRoute.id && styles.routeStatusTextActive,
                      ]}
                    >
                      {route.id === selectedRoute.id ? 'In Transit' : 'On Process'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* 4. USER PROFILE SCREEN */
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.homeContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileHeroCard}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarInitial}>
                  {(userProfile?.name || 'Kasun Perera').charAt(0)}
                </Text>
              </View>
              <Text style={styles.profileNameTitle}>{userProfile?.name || 'Kasun Perera'}</Text>
              <Text style={styles.profileUsername}>@{userProfile?.username || 'kasun_p'}</Text>
            </View>

            <View style={styles.profileDetailCard}>
              <Text style={styles.detailSectionTitle}>Contact & Account</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Full Name</Text>
                <Text style={styles.detailVal}>{userProfile?.name || 'Kasun Perera'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Username</Text>
                <Text style={styles.detailVal}>@{userProfile?.username || 'kasun_p'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Phone</Text>
                <Text style={styles.detailVal}>{userProfile?.phone || '+94 77 123 4567'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Preferred Route</Text>
                <Text style={styles.detailVal}>{selectedRoute.shortName}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.signOutButton}
              onPress={handleLogout}
            >
              <Text style={styles.signOutText}>Sign Out of Passenger Account</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* FLOATING DARK OBSIDIAN BOTTOM NAVIGATION DOCK (Matching Reference UI) */}
        {isAuthenticated ? (
          <View style={styles.floatingDockWrapper}>
            <View style={styles.floatingDock}>
              {/* Home / Discovery */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('routes')}
              >
                <View style={activeTab === 'routes' ? styles.dockIconActive : styles.dockIconInactive}>
                  <MapIcon color={activeTab === 'routes' ? '#FFFFFF' : '#71717A'} size={18} />
                </View>
                <Text style={activeTab === 'routes' ? styles.dockTextActive : styles.dockTextInactive}>
                  Home
                </Text>
              </TouchableOpacity>

              {/* Shipment / Routes */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('routes')}
              >
                <View style={styles.dockIconInactive}>
                  <BusIcon color="#71717A" size={18} />
                </View>
                <Text style={styles.dockTextInactive}>Shipment</Text>
              </TouchableOpacity>

              {/* Center Prominent Action Button with Glowing Ring */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.dockCenterButton}
                onPress={() => setIsStopSelectorOpen(true)}
              >
                <PlusIcon color="#FFFFFF" size={20} />
              </TouchableOpacity>

              {/* Tracking (Live Map Focus) */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.dockItem}
                onPress={() => setActiveTab('tracking')}
              >
                <View style={activeTab === 'tracking' ? styles.dockIconActive : styles.dockIconInactive}>
                  <NavigationArrowIcon
                    color={activeTab === 'tracking' ? '#FFFFFF' : '#71717A'}
                    size={16}
                  />
                </View>
                <Text style={activeTab === 'tracking' ? styles.dockTextActive : styles.dockTextInactive}>
                  Tracking
                </Text>
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
                  Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* STOP SELECTOR & DYNAMIC TIMELINE MODAL */}
        <Modal
          visible={isStopSelectorOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsStopSelectorOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContentCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Route Stops & Boarding</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsStopSelectorOpen(false)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Boarding Stop Picker */}
              <View style={styles.modalPickerBox}>
                <Text style={styles.modalPickerLabel}>BOARDING STOP</Text>
                <TouchableOpacity
                  style={styles.modalDropdownTrigger}
                  onPress={() => {
                    setIsBoardingDropdownOpen(!isBoardingDropdownOpen);
                    setIsDestinationDropdownOpen(false);
                  }}
                >
                  <Text style={styles.modalDropdownText}>{boardingStop}</Text>
                  <ChevronDownIcon color={COLORS.textMuted} size={16} />
                </TouchableOpacity>

                {isBoardingDropdownOpen ? (
                  <View style={styles.dropdownList}>
                    {selectedRoute.stops.map((stop, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setBoardingStop(stop);
                          setIsBoardingDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{stop}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Destination Stop Picker */}
              <View style={styles.modalPickerBox}>
                <Text style={styles.modalPickerLabel}>DESTINATION STOP</Text>
                <TouchableOpacity
                  style={styles.modalDropdownTrigger}
                  onPress={() => {
                    setIsDestinationDropdownOpen(!isDestinationDropdownOpen);
                    setIsBoardingDropdownOpen(false);
                  }}
                >
                  <Text style={styles.modalDropdownText}>{destinationStop}</Text>
                  <ChevronDownIcon color={COLORS.textMuted} size={16} />
                </TouchableOpacity>

                {isDestinationDropdownOpen ? (
                  <View style={styles.dropdownList}>
                    {selectedRoute.stops.map((stop, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setDestinationStop(stop);
                          setIsDestinationDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{stop}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Dynamic Stop Tracker Timeline */}
              <Text style={[styles.modalPickerLabel, { marginTop: 16, marginBottom: 8 }]}>
                DYNAMIC ROUTE TIMELINE
              </Text>
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {selectedRoute.stops.map((stopName, idx) => {
                  const isPassed = idx < boardingIndex;
                  const isBoarding = idx === boardingIndex;
                  const isDestination = idx === destinationIndex;
                  const isUpcoming = idx > boardingIndex && idx < destinationIndex;

                  return (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineMarkerCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            isPassed && styles.timelineDotPassed,
                            isBoarding && styles.timelineDotBoarding,
                            isDestination && styles.timelineDotDestination,
                            isUpcoming && styles.timelineDotUpcoming,
                          ]}
                        >
                          {isPassed ? <CheckIcon color="#FFFFFF" size={7} /> : null}
                        </View>
                        {idx < selectedRoute.stops.length - 1 ? (
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
                            (isBoarding || isDestination) && styles.timelineStopHighlight,
                          ]}
                        >
                          {stopName}
                        </Text>
                        <Text style={styles.timelineTag}>
                          {isPassed
                            ? 'Passed'
                            : isBoarding
                            ? 'Preferred Boarding'
                            : isDestination
                            ? 'Target Destination'
                            : 'Upcoming'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.primaryActionButton, { marginTop: 18 }]}
                onPress={() => setIsStopSelectorOpen(false)}
              >
                <Text style={styles.primaryActionButtonText}>Apply & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  authTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEE',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  authTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  authTabText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  authTabTextActive: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
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

  /* 2. LIVE TRACKING VIEW (PRIMARY MAP FOCUS - MATCHING RIGHT REFERENCE SCREEN) */
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
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  mapCanvasWrapper: {
    flex: 1,
    width: '100%',
  },

  /* Dark Obsidian Bottom Hero Sheet */
  darkHeroSheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 95, // Space for floating dock
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
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  transitStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  transitStatusText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#E4E4E7',
  },

  /* Step Progress Tracker */
  stepTrackerContainer: {
    marginBottom: 20,
    backgroundColor: '#1E1E22',
    borderRadius: 20,
    padding: 16,
  },
  stepTrackLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  stepNode: {
    alignItems: 'center',
  },
  stepCircleCompleted: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF5B37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 91, 55, 0.2)',
    borderWidth: 2,
    borderColor: '#FF5B37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5B37',
  },
  stepCircleUpcoming: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#52525B',
  },
  stepCircleTarget: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#71717A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTargetInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#71717A',
  },
  stepDottedPath: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepMetaText: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  stepLocationText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 2,
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
    fontSize: 14,
    color: '#FF5B37',
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 1,
  },

  /* Driver Row */
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
    fontSize: 14,
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

  /* 3. HOME DISCOVERY VIEW (MATCHING LEFT REFERENCE SCREEN) */
  homeContentContainer: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },
  homeTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  deliveryToBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryToLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  deliveryToAddress: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Search Capsule */
  searchCapsuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  searchCapsuleInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  scanBtn: {
    padding: 4,
  },

  /* Quick Tiles */
  quickTilesRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  quickTile: {
    flex: 1,
    height: 94,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  quickTileTitle: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  tileBadgeOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 91, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Current Shipment Hero Card (Left Screen) */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textMuted,
  },
  currentShipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  shipmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  shipmentDeviceThumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipmentIdText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weights.heavy,
    color: COLORS.textPrimary,
  },
  shipmentItemName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transitMiniBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  transitMiniBadgeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },

  /* Card Horizontal Progress Line */
  cardTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  cardDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF5B37',
  },
  cardDottedLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  cardBusBadgePill: {
    backgroundColor: '#141416',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardBusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardDotTarget: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#A1A1AA',
  },
  cardTerminalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTerminalDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  cardTerminalPlace: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },

  /* Available Routes List */
  routesList: {
    gap: 12,
  },
  routeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  routeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeThumbCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeItemCode: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  routeItemTitle: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  routeItemStopsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  routeStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  routeStatusPillActive: {
    backgroundColor: 'rgba(255, 91, 55, 0.12)',
  },
  routeStatusText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  routeStatusTextActive: {
    color: '#FF5B37',
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
    fontSize: 26,
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

  /* FLOATING DARK OBSIDIAN BOTTOM NAVIGATION DOCK (Reference Dock) */
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
    backgroundColor: '#FF5B37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5B37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },

  /* MODAL / DRAWER STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalPickerBox: {
    marginBottom: 14,
  },
  modalPickerLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  modalDropdownText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  dropdownList: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },

  /* Dynamic Timeline inside Modal */
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
  timelineDotBoarding: {
    backgroundColor: '#FF5B37',
    borderColor: '#FF5B37',
  },
  timelineDotDestination: {
    backgroundColor: '#141416',
    borderColor: '#141416',
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
});
