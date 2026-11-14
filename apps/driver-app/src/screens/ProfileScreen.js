import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, IconButton, OverlapHeader, OverlapSheet, SettingsRow, SettingsSection } from '../shared/ui';
import { MessageCircleIcon, PhoneCallIcon, SettingsIcon } from '../shared/icons';
import { useD } from './ProfileScreen.styles';

// The bus and its duty at a glance. Appearance, tracking and dispatch contact live in Settings.
export function ProfileScreen({ session, duty, onOpenDispatch, onOpenSettings }) {
  const D = useD();
  const { registration: busRegistration, driverName, routeNumber, routeLabel, onLogout } = session;
  const { isOnShift } = duty;
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.routeScroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader minHeight={200}>
        <View style={D.profileGear}>
          <IconButton label="Settings" onPress={onOpenSettings}><SettingsIcon color={COLORS.ink} size={20} /></IconButton>
        </View>
        <View style={D.profileHero}>
          <View style={D.profileAvatar}>
            <Text style={D.profileAvatarText}>{(busRegistration || 'NB').slice(0, 2)}</Text>
          </View>
          <Text style={D.profileName}>{busRegistration}</Text>
          <Text style={D.profileSub}>{driverName || 'Commercial Transit Vehicle'}</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        <SettingsSection title="Vehicle details">
          <SettingsRow label="Registration" value={busRegistration} />
          <SettingsRow label="Driver" value={driverName || 'Not assigned'} />
          <SettingsRow label="Assigned route" value={routeNumber} />
          <SettingsRow label="Corridor" value={routeLabel} />
          <SettingsRow label="Duty status" value={isOnShift ? 'On duty (broadcasting)' : 'Off duty'} />
        </SettingsSection>

        <SettingsSection title="Transit dispatch" note="Kept here, off the duty screen, so it does not distract while driving.">
          <SettingsRow icon={<PhoneCallIcon color={COLORS.ink} size={18} />} label="Call dispatch" onPress={() => onOpenDispatch('call')} />
          <SettingsRow icon={<MessageCircleIcon color={COLORS.ink} size={18} />} label="Message dispatch" onPress={() => onOpenDispatch('message')} />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow icon={<SettingsIcon color={COLORS.ink} size={18} />} label="Settings" value="Appearance, tracking" onPress={onOpenSettings} />
        </SettingsSection>

        <Button title="Sign out of vehicle console" tone="soft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}
