import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, IconButton, OverlapHeader, OverlapSheet, Segmented, SettingsRow, SettingsSection } from '../shared/ui';
import { useTheme } from '../shared/themeRuntime';
import { API_URL } from '../shared/api';
import { COLORS } from '../shared/theme';
import { ArrowLeftIcon, ClockIcon, MessageCircleIcon, PhoneCallIcon, SpeedometerIcon } from '../shared/icons';
import { DISPATCH_PHONE } from '../constants';
import { useD } from './SettingsScreen.styles';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const VERSION = require('../../app.json').expo.version;

// Settings: appearance, how this bus is tracked, who to call, and the app itself. Everything shown is read from the app,
// nothing here is a placeholder.
export function SettingsScreen({ busRegistration, driverName, routeNumber, routeLabel, connected, trackingMode, onOpenDispatch, onBack, onLogout }) {
  const D = useD();
  const { source, mode, setMode, followSystem } = useTheme();
  const preference = source === 'system' ? 'system' : mode;
  const choose = (value) => (value === 'system' ? followSystem() : setMode(value));
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.settingsScroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader minHeight={132}>
        <View style={D.settingsHeader}>
          <IconButton label="Back to profile" onPress={onBack}><ArrowLeftIcon color={COLORS.ink} size={20} /></IconButton>
          <Text style={D.settingsTitle}>Settings</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        <SettingsSection title="Appearance" note="System follows your phone's light or dark setting. A dark screen is easier on the eyes at night.">
          <View style={D.settingsPad}>
            <Segmented label="Colour mode" options={THEME_OPTIONS} value={preference} onChange={choose} />
          </View>
        </SettingsSection>

        <SettingsSection title="Tracking" note="Position is sent every 3 seconds while you are on duty. If the signal drops, positions are saved and sent when it returns.">
          <SettingsRow icon={<SpeedometerIcon color={COLORS.ink} size={18} />} label="Server" value={connected ? 'Connected' : 'Not connected'} />
          <SettingsRow icon={<ClockIcon color={COLORS.ink} size={18} />} label="While tracking" value={trackingMode === 'background' ? 'Works with the screen off' : 'Keep this screen on'} />
        </SettingsSection>

        <SettingsSection title="This bus">
          <SettingsRow label="Registration" value={busRegistration} />
          <SettingsRow label="Driver" value={driverName || 'Not assigned'} />
          <SettingsRow label="Route" value={routeNumber} />
          <SettingsRow label="Corridor" value={routeLabel} />
        </SettingsSection>

        <SettingsSection title="Transit dispatch">
          <SettingsRow icon={<PhoneCallIcon color={COLORS.ink} size={18} />} label="Call dispatch" value={DISPATCH_PHONE} onPress={() => onOpenDispatch('call')} />
          <SettingsRow icon={<MessageCircleIcon color={COLORS.ink} size={18} />} label="Message dispatch" onPress={() => onOpenDispatch('message')} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="Version" value={VERSION} />
          <SettingsRow label="Server" value={API_URL.replace(/^https?:\/\//, '')} />
        </SettingsSection>

        <Button title="Sign out of vehicle console" tone="soft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}
