import React from 'react';
import { SettingsRow, SettingsSection } from '../shared/ui';
import { SettingsPage } from '../shared/shell';
import { COLORS } from '../shared/theme';
import { FIX_INTERVAL_MS } from '../shared/contract';
import { ClockIcon, MessageCircleIcon, PhoneCallIcon, SpeedometerIcon } from '../shared/icons';
import { DISPATCH_PHONE } from '../constants';

const VERSION = require('../../app.json').expo.version;

// Settings: appearance, how this bus is tracked, who to call, and the app itself. Everything shown is read from the app,
// nothing here is a placeholder.
export function SettingsScreen({ session, duty, onOpenDispatch, onBack }) {
  const { registration, driverName, routeNumber, routeLabel, onLogout } = session;
  return (
    <SettingsPage
      onBack={onBack}
      appearanceNote="System follows your phone's light or dark setting. A dark screen is easier on the eyes at night."
      version={VERSION}
      signOutLabel="Sign out of vehicle console"
      onLogout={onLogout}
    >
      <SettingsSection title="Tracking" note={`Position is sent every ${FIX_INTERVAL_MS / 1000} seconds while you are on duty. If the signal drops, positions are saved and sent when it returns.`}>
        <SettingsRow icon={<SpeedometerIcon color={COLORS.ink} size={18} />} label="Server" value={duty.connected ? 'Connected' : 'Not connected'} />
        <SettingsRow icon={<ClockIcon color={COLORS.ink} size={18} />} label="While tracking" value={duty.mode === 'background' ? 'Works with the screen off' : 'Keep this screen on'} />
      </SettingsSection>

      <SettingsSection title="This bus">
        <SettingsRow label="Registration" value={registration} />
        <SettingsRow label="Driver" value={driverName || 'Not assigned'} />
        <SettingsRow label="Route" value={routeNumber} />
        <SettingsRow label="Corridor" value={routeLabel} />
      </SettingsSection>

      <SettingsSection title="Transit dispatch">
        <SettingsRow icon={<PhoneCallIcon color={COLORS.ink} size={18} />} label="Call dispatch" value={DISPATCH_PHONE} onPress={() => onOpenDispatch('call')} />
        <SettingsRow icon={<MessageCircleIcon color={COLORS.ink} size={18} />} label="Message dispatch" onPress={() => onOpenDispatch('message')} />
      </SettingsSection>
    </SettingsPage>
  );
}
