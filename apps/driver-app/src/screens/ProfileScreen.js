import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, IconButton, OverlapHeader, OverlapSheet } from '../shared/ui';
import { MessageCircleIcon, PhoneCallIcon } from '../shared/icons';
import { ProfileRow } from '../components/ProfileRow';
import { D } from './ProfileScreen.styles';

export function ProfileScreen({ busRegistration, driverName, routeNumber, routeLabel, isOnShift, onLogout, onOpenDispatch }) {
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar hero */}
      <OverlapHeader minHeight={200}>
        <View style={D.profileHero}>
          <View style={D.profileAvatar}>
            <Text style={D.profileAvatarText}>{(busRegistration || 'NB').slice(0, 2)}</Text>
          </View>
          <Text style={D.profileName}>{busRegistration}</Text>
          <Text style={D.profileSub}>{driverName || 'Commercial Transit Vehicle'}</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Vehicle Details */}
        <View style={D.profileCard}>
          <Text style={D.profileCardTitle}>Vehicle Details</Text>
          <ProfileRow label="Registration" value={busRegistration} />
          <ProfileRow label="Driver" value={driverName || 'Not assigned'} />
          <ProfileRow label="Assigned Route" value={routeNumber} />
          <ProfileRow label="Corridor" value={routeLabel} />
          <ProfileRow label="Duty Status" value={isOnShift ? 'On duty (broadcasting)' : 'Off duty'} accent={isOnShift} last />
        </View>

        {/* Dispatch Contact (kept off the duty screen so it does not distract while driving) */}
        <View style={[D.dispatchCard, D.dispatchCardSpaced]}>
          <View style={D.dispatchLeft}>
            <View style={D.dispatchCardAvatar}>
              <Text style={D.dispatchCardAvatarText}>HQ</Text>
            </View>
            <View style={D.flex}>
              <Text style={D.dispatchCardName}>Transit Dispatch</Text>
              <Text style={D.dispatchCardRole} numberOfLines={1}>Central Command Center</Text>
            </View>
          </View>
          <View style={D.dispatchBtns}>
            <IconButton label="Call dispatch" tone="ink" onPress={() => onOpenDispatch('call')}>
              <PhoneCallIcon color="#FFF" size={16} />
            </IconButton>
            <IconButton label="Message dispatch" tone="glass" onPress={() => onOpenDispatch('message')}>
              <MessageCircleIcon color={COLORS.ink} size={16} />
            </IconButton>
          </View>
        </View>

        {/* Sign Out */}
        <Button title="Sign Out of Vehicle Console" tone="dangerSoft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}
