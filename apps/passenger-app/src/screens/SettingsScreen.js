import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, IconButton, OverlapHeader, OverlapSheet, Segmented, SettingsRow, SettingsSection } from '../shared/ui';
import { useTheme } from '../shared/themeRuntime';
import { API_URL } from '../shared/api';
import { COLORS } from '../shared/theme';
import { ArrowLeftIcon, MapPinIcon, RouteIcon } from '../shared/icons';
import { AccountActions } from '../components/AccountActions';
import { useS } from './SettingsScreen.styles';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const VERSION = require('../../app.json').expo.version;

// Settings: appearance, your usual journey, your account, and the app itself. Sign out sits last and is not red:
// the destructive action (delete account) lives in its own group above it.
export function SettingsScreen({ userProfile, selectedRoute, boardingStop, destinationStop, onResetDefaults, onOpenStops, onBack, onLogout, account, showToast }) {
  const S = useS();
  const { source, mode, setMode, followSystem } = useTheme();
  const preference = source === 'system' ? 'system' : mode;
  const choose = (value) => (value === 'system' ? followSystem() : setMode(value));
  return (
    <ScrollView style={S.flex} contentContainerStyle={S.settingsScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <OverlapHeader minHeight={132}>
        <View style={S.settingsHeader}>
          <IconButton label="Back to profile" onPress={onBack}><ArrowLeftIcon color={COLORS.ink} size={20} /></IconButton>
          <Text style={S.settingsTitle}>Settings</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        <SettingsSection title="Appearance" note="System follows your phone's light or dark setting.">
          <View style={S.settingsPad}>
            <Segmented label="Colour mode" options={THEME_OPTIONS} value={preference} onChange={choose} />
          </View>
        </SettingsSection>

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

        <SettingsSection title="About">
          <SettingsRow label="Version" value={VERSION} />
          <SettingsRow label="Server" value={API_URL.replace(/^https?:\/\//, '')} />
        </SettingsSection>

        <Button title="Sign out" tone="soft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}
