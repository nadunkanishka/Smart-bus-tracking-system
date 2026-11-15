import React from 'react';
import { COLORS } from '../shared/theme';
import { SettingsRow, SettingsSection } from '../shared/ui';
import { ProfilePage } from '../shared/shell';
import { MapPinIcon, RouteIcon } from '../shared/icons';

// Who you are and your usual journey. Everything you can change lives in Settings, one tap away.
export function ProfileScreen({ userProfile, selectedRoute, boardingStop, destinationStop, onLogout, onOpenStops, onOpenSettings }) {
  return (
    <ProfilePage
      initials={(userProfile?.name || 'P').charAt(0).toUpperCase()}
      name={userProfile?.name || 'Passenger'}
      subtitle={`@${userProfile?.username}`}
      onOpenSettings={onOpenSettings}
      settingsValue="Appearance, account"
      signOutLabel="Sign out"
      onLogout={onLogout}
    >
      <SettingsSection title="Contact">
        <SettingsRow label="Username" value={userProfile?.username || '—'} />
        <SettingsRow label="Phone" value={userProfile?.phone || 'Not provided'} />
      </SettingsSection>

      <SettingsSection title="Your usual journey">
        <SettingsRow icon={<RouteIcon color={COLORS.ink} size={18} />} label="Route" value={selectedRoute?.shortName || '—'} onPress={onOpenStops} />
        <SettingsRow icon={<MapPinIcon color={COLORS.ink} size={18} />} label="Boarding stop" value={boardingStop || '—'} onPress={onOpenStops} />
        <SettingsRow icon={<MapPinIcon color={COLORS.ink} size={18} />} label="Destination stop" value={destinationStop || '—'} onPress={onOpenStops} />
      </SettingsSection>
    </ProfilePage>
  );
}
