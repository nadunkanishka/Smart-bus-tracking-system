import React, { useState } from 'react';
import { ThemeProvider } from './src/shared/themeRuntime';
import { ScreenFade } from './src/shared/ui';
import { AppColumn, AppFrame, useToast } from './src/shared/shell';
import { TABS } from './src/constants';
import { useDriverSession } from './src/hooks/useDriverSession';
import { useDuty } from './src/hooks/useDuty';
import { LoginScreen } from './src/screens/LoginScreen';
import { DispatchModal } from './src/components/DispatchModal';
import { ShiftScreen } from './src/screens/ShiftScreen';
import { RouteScreen } from './src/screens/RouteScreen';
import { DiagnosticsScreen } from './src/screens/DiagnosticsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DriverDock } from './src/components/DriverDock';

// Wires the session and duty hooks to the tab screens. Every screen gets the same two objects:
// `session` (the bus, its route and driver, sign-out) and `duty` (live telemetry and the duty switch).
function AppShell() {
  const { toastMsg, showToast } = useToast();
  const session = useDriverSession();
  const duty = useDuty({ showToast });
  const [activeTab, setActiveTab] = useState(TABS.shift);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState('call'); // 'call' | 'message'

  async function handleLogin() {
    const registration = await session.login();
    if (!registration) return;
    setActiveTab(TABS.shift);
    duty.log(`Signed in: ${registration}.`);
  }

  async function handleLogout() {
    await session.logout();
    setActiveTab(TABS.shift);
    duty.clearLog();
  }

  function openDispatch(mode) {
    setDispatchMode(mode);
    setIsDispatchModalOpen(true);
  }

  const screen = { session: { ...session, onLogout: handleLogout }, duty };

  return (
    <AppFrame toastMsg={toastMsg}>
      {/* No Register screen: bus accounts are created by the admin dashboard. */}
      {!session.isAuthenticated ? (
        <LoginScreen {...session.form} handleLogin={handleLogin} />
      ) : (
        <AppColumn>
          <ScreenFade key={activeTab}>
            {activeTab === TABS.shift ? (
              <ShiftScreen {...screen} />
            ) : activeTab === TABS.route ? (
              <RouteScreen {...screen} />
            ) : activeTab === TABS.diagnostics ? (
              <DiagnosticsScreen {...screen} />
            ) : activeTab === TABS.settings ? (
              <SettingsScreen {...screen} onOpenDispatch={openDispatch} onBack={() => setActiveTab(TABS.profile)} />
            ) : (
              <ProfileScreen {...screen} onOpenDispatch={openDispatch} onOpenSettings={() => setActiveTab(TABS.settings)} />
            )}
          </ScreenFade>

          <DriverDock activeTab={activeTab === TABS.settings ? TABS.profile : activeTab} setActiveTab={setActiveTab} />

          <DispatchModal
            isDispatchModalOpen={isDispatchModalOpen}
            setIsDispatchModalOpen={setIsDispatchModalOpen}
            dispatchMode={dispatchMode}
            setDispatchMode={setDispatchMode}
            showToast={showToast}
          />
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
