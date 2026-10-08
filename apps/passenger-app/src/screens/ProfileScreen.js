import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button, OverlapHeader, OverlapSheet } from '../shared/ui';
import { ProfileRow } from '../components/ProfileRow';
import { S } from './ProfileScreen.styles';

export function ProfileScreen({ userProfile, selectedRoute, boardingStop, destinationStop, onResetDefaults, onLogout, onOpenStops }) {
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.profileScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar Hero */}
      <OverlapHeader minHeight={200}>
        <View style={S.profileHero}>
          <View style={S.profileAvatar}>
            <Text style={S.profileAvatarText}>
              {(userProfile?.name || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={S.profileName}>{userProfile?.name || 'Passenger'}</Text>
          <Text style={S.profileUsername}>@{userProfile?.username}</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Account */}
        <View style={S.profileCard}>
          <Text style={S.profileCardTitle}>Account</Text>
          <ProfileRow label="Full name" value={userProfile?.name || '—'} />
          <ProfileRow label="Username" value={userProfile?.username || '—'} />
          <ProfileRow label="Phone" value={userProfile?.phone || 'Not provided'} last />
        </View>

        {/* Journey Preferences */}
        <View style={S.profileCard}>
          <View style={S.profileCardHeader}>
            <Text style={S.profileCardTitleFlat}>Journey Preferences</Text>
            <TouchableOpacity onPress={onOpenStops} activeOpacity={0.7} style={S.linkTap} accessibilityRole="link">
              <Text style={S.link}>Edit Stops</Text>
            </TouchableOpacity>
          </View>
          <ProfileRow label="Preferred Route" value={selectedRoute.shortName} />
          <ProfileRow label="Boarding Stop" value={boardingStop || '—'} accent />
          <ProfileRow label="Destination Stop" value={destinationStop || '—'} accent last />
        </View>

        {/* Reset Stops Defaults */}
        <Button title="Reset Route Terminals" tone="soft" onPress={onResetDefaults} style={S.profileBtn} />

        {/* Sign Out */}
        <Button title="Sign Out" tone="dangerSoft" onPress={onLogout} style={S.profileBtn} />
      </OverlapSheet>
    </ScrollView>
  );
}
