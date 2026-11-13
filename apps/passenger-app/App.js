import React, { useState } from 'react';
import { Platform, SafeAreaView, StatusBar, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/shared/themeRuntime';
import { AppBackdrop, ScreenFade, Toast, VehicleLoader } from './src/shared/ui';
import { useToast } from './src/hooks/useToast';
import { useAuth } from './src/hooks/useAuth';
import { useRoutes } from './src/hooks/useRoutes';
import { useLiveBuses } from './src/hooks/useLiveBuses';
import { AuthScreen } from './src/screens/AuthScreen';
import { StopSelectorModal } from './src/components/StopSelectorModal';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RoutesScreen } from './src/screens/RoutesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomDock } from './src/components/BottomDock';
import { useS } from './src/styles/app';

// Root component: wires the hooks together, holds navigation state and switches between the tab screens.
function AppShell() {
  const S = useS();
  const { isDark } = useTheme();
  // Navigation: 'home' | 'tracking' | 'routes' | 'profile'
  const [activeTab, setActiveTab] = useState('tracking');
  const [isBoardingExpanded, setIsBoardingExpanded] = useState(false);
  const [isDestExpanded, setIsDestExpanded] = useState(false);

  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isBoardingOpen, setIsBoardingOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const { toastMsg, showToast } = useToast();

  const auth = useAuth({
    onSessionStart: (message) => {
      setActiveTab('tracking');
      showToast(message);
    },
  });
  const { booting, session } = auth;
  const isAuthenticated = !!session;
  const userProfile = session?.user;

  const {
    routes, routesState, loadRoutes, routeSearchQuery, setRouteSearchQuery, filteredRoutes,
    selectedRouteId, selectedRoute, selectRoute,
    boardingStop, setBoardingStop, boardingIndex, destinationStop, setDestinationStop, destinationIndex,
  } = useRoutes({ session, showToast });

  const { conn, liveBuses, tracked, mapBuses, clearBuses } = useLiveBuses({ session, selectedRouteId, selectedRoute, boardingIndex, destinationIndex, boardingStop, destinationStop });

  function handleLogout() {
    auth.signOut();
    clearBuses();
    setActiveTab('tracking');
  }

  function handleSelectRoute(route) {
    selectRoute(route);
    setRouteSearchQuery('');
    setActiveTab('tracking');
  }

  function handleResetDefaults() {
    setBoardingStop(selectedRoute.stops[0] || null);
    setDestinationStop(selectedRoute.stops[selectedRoute.stops.length - 1] || null);
    showToast('Reset stops to route terminals.');
  }

  return (
    <SafeAreaView style={S.root}>
      <AppBackdrop />
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      <Toast message={toastMsg} />

      {booting ? (
        <View style={S.centerFill}><VehicleLoader label="Loading SmartBus" /></View>
      ) : !isAuthenticated ? (
        <AuthScreen {...auth.form} showToast={showToast} />
      ) : (
        <View style={S.appShell}>
          <ScreenFade key={activeTab}>
            {activeTab === 'tracking' ? (
              <TrackingScreen
                conn={conn}
                routesState={routesState}
                tracked={tracked}
                liveCount={liveBuses.length}
                mapBuses={mapBuses}
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
                onGoRoutes={() => setActiveTab('routes')}
              />
            ) : activeTab === 'home' ? (
              <HomeScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                tracked={tracked}
                liveCount={liveBuses.length}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onGoTracking={() => setActiveTab('tracking')}
                onGoRoutes={() => setActiveTab('routes')}
                onOpenStops={() => setIsStopModalOpen(true)}
                onOpenSettings={() => setActiveTab('settings')}
                showToast={showToast}
              />
            ) : activeTab === 'routes' ? (
              <RoutesScreen
                routesState={routesState}
                onRetry={loadRoutes}
                routeSearchQuery={routeSearchQuery}
                setRouteSearchQuery={setRouteSearchQuery}
                filteredRoutes={filteredRoutes}
                selectedRoute={selectedRoute}
                onSelectRoute={handleSelectRoute}
              />
            ) : activeTab === 'settings' ? (
              <SettingsScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onResetDefaults={handleResetDefaults}
                onOpenStops={() => setIsStopModalOpen(true)}
                onBack={() => setActiveTab('profile')}
                onLogout={handleLogout}
                account={auth}
                showToast={showToast}
              />
            ) : (
              <ProfileScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onLogout={handleLogout}
                onOpenStops={() => setIsStopModalOpen(true)}
                onOpenSettings={() => setActiveTab('settings')}
              />
            )}
          </ScreenFade>

          <BottomDock activeTab={activeTab === 'settings' ? 'profile' : activeTab} setActiveTab={setActiveTab} />

          <StopSelectorModal
            isStopModalOpen={isStopModalOpen}
            setIsStopModalOpen={setIsStopModalOpen}
            routes={routes}
            selectedRoute={selectedRoute}
            selectRoute={selectRoute}
            isBoardingOpen={isBoardingOpen}
            setIsBoardingOpen={setIsBoardingOpen}
            isDestOpen={isDestOpen}
            setIsDestOpen={setIsDestOpen}
            boardingStop={boardingStop}
            setBoardingStop={setBoardingStop}
            destinationStop={destinationStop}
            setDestinationStop={setDestinationStop}
            tracked={tracked}
            boardingIndex={boardingIndex}
            destinationIndex={destinationIndex}
          />

        </View>
      )}
    </SafeAreaView>
  );
}

// Root: the theme provider sits above everything so every screen can read and switch the mode.
export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
