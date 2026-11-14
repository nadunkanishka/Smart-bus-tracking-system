import React, { useState } from 'react';
import { View } from 'react-native';
import { ThemeProvider } from './src/shared/themeRuntime';
import { ScreenFade, VehicleLoader } from './src/shared/ui';
import { AppColumn, AppFrame, useToast } from './src/shared/shell';
import { TABS } from './src/constants';
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
  const [activeTab, setActiveTab] = useState(TABS.tracking);
  const [isBoardingExpanded, setIsBoardingExpanded] = useState(false);
  const [isDestExpanded, setIsDestExpanded] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const { toastMsg, showToast } = useToast();

  const auth = useAuth();
  const { booting, session } = auth;
  const userProfile = session?.user;

  const trip = useRoutes({ session, showToast });
  const {
    routesState, loadRoutes, routeSearchQuery, setRouteSearchQuery, filteredRoutes,
    selectedRouteId, selectedRoute, selectRoute,
    boardingStop, setBoardingStop, boardingIndex, destinationStop, setDestinationStop, destinationIndex,
  } = trip;

  const { conn, liveBuses, tracked, mapBuses, clearBuses } = useLiveBuses({ session, selectedRouteId, selectedRoute, boardingIndex, destinationIndex, boardingStop, destinationStop });

  // After a login or registration: land on tracking and greet.
  async function afterSignIn(start) {
    const welcome = await start();
    if (!welcome) return;
    setActiveTab(TABS.tracking);
    showToast(welcome);
  }

  function handleLogout() {
    auth.signOut();
    clearBuses();
    setActiveTab(TABS.tracking);
  }

  function handleSelectRoute(route) {
    selectRoute(route);
    setRouteSearchQuery('');
    setActiveTab(TABS.tracking);
  }

  function handleResetDefaults() {
    setBoardingStop(selectedRoute.stops[0] || null);
    setDestinationStop(selectedRoute.stops[selectedRoute.stops.length - 1] || null);
    showToast('Reset stops to route terminals.');
  }

  const openStops = () => setIsStopModalOpen(true);
  const goTo = (tab) => () => setActiveTab(tab);

  return (
    <AppFrame toastMsg={toastMsg}>
      {booting ? (
        <View style={S.centerFill}><VehicleLoader label="Loading SmartBus" /></View>
      ) : !session ? (
        <AuthScreen
          {...auth.form}
          handleLogin={() => afterSignIn(auth.form.handleLogin)}
          handleRegister={() => afterSignIn(auth.form.handleRegister)}
          showToast={showToast}
        />
      ) : (
        <AppColumn>
          <ScreenFade key={activeTab}>
            {activeTab === TABS.tracking ? (
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
                routeStops={selectedRoute.stops}
                isBoardingExpanded={isBoardingExpanded}
                isDestExpanded={isDestExpanded}
                setIsBoardingExpanded={setIsBoardingExpanded}
                setIsDestExpanded={setIsDestExpanded}
                setBoardingStop={setBoardingStop}
                setDestinationStop={setDestinationStop}
                onOpenStops={openStops}
                onGoRoutes={goTo(TABS.routes)}
              />
            ) : activeTab === TABS.home ? (
              <HomeScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                tracked={tracked}
                liveCount={liveBuses.length}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onGoTracking={goTo(TABS.tracking)}
                onGoRoutes={goTo(TABS.routes)}
                onOpenStops={openStops}
                onOpenSettings={goTo(TABS.settings)}
                showToast={showToast}
              />
            ) : activeTab === TABS.routes ? (
              <RoutesScreen
                routesState={routesState}
                onRetry={loadRoutes}
                routeSearchQuery={routeSearchQuery}
                setRouteSearchQuery={setRouteSearchQuery}
                filteredRoutes={filteredRoutes}
                selectedRoute={selectedRoute}
                onSelectRoute={handleSelectRoute}
              />
            ) : activeTab === TABS.settings ? (
              <SettingsScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onResetDefaults={handleResetDefaults}
                onOpenStops={openStops}
                onBack={goTo(TABS.profile)}
                onLogout={handleLogout}
                account={{ updateProfile: auth.updateProfile, changePassword: auth.changePassword, deleteAccount: auth.deleteAccount }}
                showToast={showToast}
              />
            ) : (
              <ProfileScreen
                userProfile={userProfile}
                selectedRoute={selectedRoute}
                boardingStop={boardingStop}
                destinationStop={destinationStop}
                onLogout={handleLogout}
                onOpenStops={openStops}
                onOpenSettings={goTo(TABS.settings)}
              />
            )}
          </ScreenFade>

          <BottomDock activeTab={activeTab === TABS.settings ? TABS.profile : activeTab} setActiveTab={setActiveTab} />

          <StopSelectorModal visible={isStopModalOpen} onClose={() => setIsStopModalOpen(false)} trip={trip} tracked={tracked} />
        </AppColumn>
      )}
    </AppFrame>
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
