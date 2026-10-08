import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Banner, OverlapHeader, OverlapSheet, Vehicle, NotchStat } from '../shared/ui';
import { BusIcon, NavigationArrowIcon, PlayIcon, RouteIcon, StopIcon } from '../shared/icons';
import { ProfileRow } from '../components/ProfileRow';
import { D } from './ShiftScreen.styles';

// Intentionally minimal: one large On Duty / Off Duty toggle and the status a driver needs at a glance.
export function ShiftScreen({
  isOnShift, busy, hasRoute, busRegistration, driverName, routeLabel, routeNumber, nextStop,
  busSpeed, gpsStatus, connected, queued, mode, onToggleShift,
}) {
  const gpsOk = gpsStatus === 'Connected';
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.routeScroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>{busRegistration}</Text>
        <Text style={D.screenSubHeader}>{driverName ? `${driverName} · ` : ''}{routeNumber}</Text>
        {/* CHANGED (illustration only): the bus shows a z while off duty; the toggle text still states the status. */}
        <Vehicle name="bus" livery="purple" status={isOnShift ? undefined : 'idle'} running={isOnShift} width={124} style={D.headerBus} />
      </OverlapHeader>

      <OverlapSheet>
        {!hasRoute ? (
          <Banner tone="danger">This bus has no route with a map path and stops yet. Ask the admin to assign one before going on duty.</Banner>
        ) : null}

        <Pressable
          onPress={onToggleShift}
          disabled={busy || (!hasRoute && !isOnShift)}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOnShift, busy, disabled: !hasRoute && !isOnShift }}
          accessibilityLabel={isOnShift ? 'On duty. Tap to go off duty' : 'Off duty. Tap to go on duty'}
          style={({ pressed }) => [
            D.dutyBtn,
            isOnShift ? D.dutyBtnOn : D.dutyBtnOff,
            !hasRoute && !isOnShift && D.dutyBtnDisabled,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={D.dutyIcon}>
            {busy
              ? <ActivityIndicator color={COLORS.ink} />
              : isOnShift ? <StopIcon color={COLORS.ink} size={24} /> : <PlayIcon color={COLORS.ink} size={24} />}
          </View>
          <Text style={D.dutyState}>{isOnShift ? 'ON DUTY' : 'OFF DUTY'}</Text>
          <Text style={D.dutyHint}>{isOnShift ? 'Tap to go off duty' : 'Tap to go on duty'}</Text>
        </Pressable>

        {/* Three-column status panel */}
        {/* CHANGED (visual only): same three values, shown as notch stat cards */}
        <View style={D.specsRow}>
          <NotchStat label="Server" tone="orange" icon={(c) => <RouteIcon color={c} size={14} />} value={connected ? 'Connected' : 'Offline'} valueColor={connected ? COLORS.success : COLORS.danger} />
          <NotchStat label="GPS" tone="purple" icon={(c) => <NavigationArrowIcon color={c} size={14} />} value={isOnShift ? gpsStatus : 'Off'} valueColor={gpsOk ? COLORS.success : isOnShift ? COLORS.warning : COLORS.muted} />
          <NotchStat label="Buffered" tone="orange" icon={(c) => <BusIcon color={c} size={14} />} value={String(queued)} valueColor={queued ? COLORS.warning : COLORS.ink} />
        </View>

        {queued > 0 ? (
          <Text style={D.dutyNote}>
            {connected ? 'Sending saved positions…' : `No connection. ${queued} position${queued === 1 ? '' : 's'} saved and will be sent when the signal returns.`}
          </Text>
        ) : null}

        {isOnShift ? (
          <View style={D.profileCard}>
            <ProfileRow label="Route" value={routeLabel} />
            <ProfileRow label="Next stop" value={nextStop || '—'} accent />
            <ProfileRow label="Speed" value={`${busSpeed} km/h`} />
            <ProfileRow label="Tracking" value={mode === 'background' ? 'Continues with the screen off' : 'While this screen is open'} last />
          </View>
        ) : null}
      </OverlapSheet>
    </ScrollView>
  );
}
