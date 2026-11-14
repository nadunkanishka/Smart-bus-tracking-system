import React from 'react';
import { SettingsRow, SettingsSection } from '../shared/ui';
import { SettingsPage } from '../shared/shell';
import { COLORS } from '../shared/theme';
import { MapPinIcon, RouteIcon } from '../shared/icons';
import { AccountActions } from '../components/AccountActions';

const VERSION = require('../../app.json').expo.version;

// Settings: appearance, your usual journey, your account, and the app itself. Sign out sits last and is not red:
// the destructive action (delete account) lives in its own group above it.
// account: { updateProfile, changePassword, deleteAccount } from useAuth.
export function SettingsScreen({ userProfile, selectedRoute, boardingStop, destinationStop, onResetDefaults, onOpenStops, onBack, onLogout, account, showToast }) {
  return (
    <SettingsPage
      onBack={onBack}
      appearanceNote="System follows your phone's light or dark setting."
      version={VERSION}
      signOutLabel="Sign out"
      onLogout={onLogout}
      keyboardShouldPersistTaps="handled"
    >
      <SettingsSection title="Your usual journey">
        <SettingsRow icon={<RouteIcon color={COLORS.ink} size={18} />} label="Route" value={selectedRoute?.shortName || '—'} onPress={onOpenStops} />
        <SettingsRow icon={<MapPinIcon color={COLORS.ink} size={18} />} label="Boarding stop" value={boardingStop || '—'} onPress={onOpenStops} />
        <SettingsRow icon={<MapPinIcon color={COLORS.ink} size={18} />} label="Destination stop" value={destinationStop || '—'} onPress={onOpenStops} />
        <SettingsRow label="Reset to the route's ends" onPress={onResetDefaults} />
      </SettingsSection>

      <AccountActions
        user={userProfile}
        onSaveProfile={account.updateProfile}
        onChangePassword={account.changePassword}
        onDelete={account.deleteAccount}
        showToast={showToast}
      />
    </SettingsPage>
  );
}
