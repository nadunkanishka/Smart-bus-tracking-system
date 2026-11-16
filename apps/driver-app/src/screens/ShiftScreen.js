import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Banner, OverlapSheet } from '../shared/ui';
import { PlayIcon, StopIcon } from '../shared/icons';
import { useD } from './ShiftScreen.styles';

// Duty: the bus and driver up top, where this run starts (white = first stop, blue = last stop), one huge duty block
// (black off duty, orange on duty), then three number blocks and the run details.
export function ShiftScreen({ session, duty }) {
  const D = useD();
  const [start, setStart] = React.useState('out'); // which terminal this run starts from
  const { registration: busRegistration, driverName, routeLabel, routeNumber, route, routeStops } = session;
  const { isOnShift, busy, busSpeed, gpsStatus, connected, queued, mode, currentStopIndex, direction, toggle: onToggleShift } = duty;
  const hasRoute = !!route?.trackable;
  const nextStop = (direction === 'back' ? [...routeStops].reverse() : routeStops)[currentStopIndex];
  const gpsOk = gpsStatus === 'Connected';
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.routeScroll} showsVerticalScrollIndicator={false}>
      <OverlapSheet>
        <Text style={D.screenTitle}>{busRegistration}</Text>
        <Text style={D.screenSubHeader}>{driverName ? `${driverName} · ` : ''}{routeNumber}</Text>

        {!hasRoute ? (
          <Banner tone="danger">This bus has no route with a map path and stops yet. Ask the admin to assign one before going on duty.</Banner>
        ) : null}

        {!isOnShift && hasRoute && routeStops.length > 1 ? (
          <View style={D.startRow}>
            {[['out', routeStops[0]], ['back', routeStops[routeStops.length - 1]]].map(([dir, stop], i) => (
              <Pressable
                key={dir}
                onPress={() => setStart(dir)}
                accessibilityRole="radio"
                accessibilityLabel={`Start from ${stop}`}
                accessibilityState={{ selected: start === dir }}
                style={[D.startBlock, i === 0 ? D.startWhite : D.startBlue, start !== dir && D.startDim]}
              >
                <Text style={[D.startLabel, i === 1 && D.onBlueSoft]}>Start from</Text>
                <Text style={[D.startStop, i === 1 && D.onBlue]} numberOfLines={2}>{stop}</Text>
                {start === dir ? <View style={D.startTick} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={() => onToggleShift(start)}
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
          <View style={[D.dutyIcon, isOnShift && D.dutyIconOn]}>
            {busy
              ? <ActivityIndicator color={isOnShift ? COLORS.onCard : COLORS.onBright} />
              : isOnShift ? <StopIcon color={COLORS.onCard} size={22} /> : <PlayIcon color={COLORS.onBright} size={22} />}
          </View>
          <View>
            <Text style={[D.dutyState, isOnShift && D.dutyTextOn]}>{isOnShift ? 'On duty' : 'Off duty'}</Text>
            <Text style={[D.dutyHint, isOnShift && D.dutyHintOn]}>{isOnShift ? 'Tap to go off duty' : 'Tap to go on duty'}</Text>
          </View>
        </Pressable>

        <View style={D.specsRow}>
          <View style={[D.stat, D.statWhite]}>
            <Text style={D.statLabel}>Server</Text>
            <Text style={[D.statValue, { color: connected ? COLORS.success : COLORS.danger }]}>{connected ? 'Online' : 'Offline'}</Text>
          </View>
          <View style={[D.stat, D.statBlue]}>
            <Text style={[D.statLabel, D.onBlueSoft]}>GPS</Text>
            <Text style={[D.statValue, D.onBlue]}>{isOnShift ? gpsStatus : 'Off'}</Text>
          </View>
          <View style={[D.stat, D.statBlack]}>
            <Text style={[D.statLabel, D.onCardSoft]}>Buffered</Text>
            <Text style={[D.statValueBig, { color: queued ? COLORS.orange : COLORS.onCard }]}>{String(queued)}</Text>
          </View>
        </View>

        {queued > 0 ? (
          <Text style={D.dutyNote}>
            {connected ? 'Sending saved positions…' : `No connection. ${queued} position${queued === 1 ? '' : 's'} saved and will be sent when the signal returns.`}
          </Text>
        ) : null}
        {isOnShift && !gpsOk ? <Text style={D.dutyNote}>Waiting for a GPS fix…</Text> : null}

        {isOnShift ? (
          <View style={D.detailBlock}>
            <Detail D={D} label="Route" value={routeLabel} />
            <Detail D={D} label="Next stop" value={nextStop || '—'} accent />
            <Detail D={D} label="Speed" value={`${busSpeed} km/h`} />
            <Detail D={D} label="Tracking" value={mode === 'background' ? 'Continues with the screen off' : 'While this screen is open'} last />
          </View>
        ) : null}
      </OverlapSheet>
    </ScrollView>
  );
}

function Detail({ D, label, value, accent, last }) {
  return (
    <View style={[D.detailRow, last && D.detailLast]}>
      <Text style={D.detailLabel}>{label}</Text>
      <Text style={[D.detailValue, accent && { color: COLORS.orange }]}>{value}</Text>
    </View>
  );
}
