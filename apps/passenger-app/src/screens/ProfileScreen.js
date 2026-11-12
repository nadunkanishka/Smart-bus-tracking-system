import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, IconButton, OverlapHeader, OverlapSheet, SettingsRow, SettingsSection } from '../shared/ui';
import { COLORS } from '../shared/theme';
import { MapPinIcon, RouteIcon, SettingsIcon } from '../shared/icons';
import { useS } from './ProfileScreen.styles';

// Who you are and your usual journey. Everything you can change lives in Settings, one tap away.
export function ProfileScreen({ userProfile, selectedRoute, boardingStop, destinationStop, onLogout, onOpenStops, onOpenSettings }) {
  const S = useS();
  return (
    <ScrollView style={S.flex} contentContainerStyle={S.profileScroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader minHeight={200}>
        <View style={S.profileGear}>
          <IconButton label="Settings" onPress={onOpenSettings}><SettingsIcon color={COLORS.ink} size={20} /></IconButton>
        </View>
        <View style={S.profileHero}>
          <View style={S.profileAvatar}>
            <Text style={S.profileAvatarText}>{(userProfile?.name || 'P').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={S.profileName}>{userProfile?.name || 'Passenger'}</Text>
          <Text style={S.profileUsername}>@{userProfile?.username}</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        <SettingsSection title="Contact">
          <SettingsRow label="Username" value={userProfile?.username || '—'} />
          <SettingsRow label="Phone" value={userProfile?.phone || 'Not provided'} />
        </SettingsSection>

        <SettingsSection title="Your usual journey">
          <SettingsRow icon={<RouteIcon color={COLORS.ink} size={18} />} label="Route" value={selectedRoute?.shortName || '—'} onPress={onOpenStops} />
          <SettingsRow icon={<MapPinIcon color={COLORS.ink} size={18} />} label="Boarding stop" value={boardingStop || '—'} onPress={onOpenStops} />
          <SettingsRow icon={<MapPinIcon color={COLORS.ink} size={18} />} label="Destination stop" value={destinationStop || '—'} onPress={onOpenStops} />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow icon={<SettingsIcon color={COLORS.ink} size={18} />} label="Settings" value="Appearance, account" onPress={onOpenSettings} />
        </SettingsSection>

        <Button title="Sign out" tone="soft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}
