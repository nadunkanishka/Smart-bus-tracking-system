import React from 'react';
import { COLORS } from '../shared/theme';
import { SettingsRow, SettingsSection } from '../shared/ui';
import { ProfilePage } from '../shared/shell';
import { MessageCircleIcon, PhoneCallIcon } from '../shared/icons';

// The bus and its duty at a glance. Appearance, tracking and dispatch contact live in Settings.
export function ProfileScreen({ session, duty, onOpenDispatch, onOpenSettings }) {
  const { registration, driverName, routeNumber, routeLabel, onLogout } = session;
  return (
    <ProfilePage
      initials={(registration || 'NB').slice(0, 2)}
      name={registration}
      subtitle={driverName || 'Commercial Transit Vehicle'}
      onOpenSettings={onOpenSettings}
      settingsValue="Appearance, tracking"
      signOutLabel="Sign out of vehicle console"
      onLogout={onLogout}
    >
      <SettingsSection title="Vehicle details">
        <SettingsRow label="Registration" value={registration} />
        <SettingsRow label="Driver" value={driverName || 'Not assigned'} />
        <SettingsRow label="Assigned route" value={routeNumber} />
        <SettingsRow label="Corridor" value={routeLabel} />
        <SettingsRow label="Duty status" value={duty.isOnShift ? 'On duty (broadcasting)' : 'Off duty'} />
      </SettingsSection>

      <SettingsSection title="Transit dispatch" note="Kept here, off the duty screen, so it does not distract while driving.">
        <SettingsRow icon={<PhoneCallIcon color={COLORS.ink} size={18} />} label="Call dispatch" onPress={() => onOpenDispatch('call')} />
        <SettingsRow icon={<MessageCircleIcon color={COLORS.ink} size={18} />} label="Message dispatch" onPress={() => onOpenDispatch('message')} />
      </SettingsSection>
    </ProfilePage>
  );
}
