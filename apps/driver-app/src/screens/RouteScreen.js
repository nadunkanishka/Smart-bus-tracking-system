import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import LiveMap from '../shared/LiveMap';
import { OverlapSheet, Vehicle } from '../shared/ui';
import { CheckIcon } from '../shared/icons';
import { COLORS } from '../shared/theme';
import { MAP_PADDING } from '../constants';
import { useD } from './RouteScreen.styles';

// Route: the route number as a big block, the map, then one block per stop: passed stops are dark, the next stop is orange,
// the rest are white.
export function RouteScreen({ session, duty }) {
  const D = useD();
  const { route, routeNumber, routeLabel, routeStops } = session;
  const { busMarkers, currentStopIndex, direction, isOnShift } = duty;
  const back = direction === 'back';
  const legStops = back ? [...routeStops].reverse() : routeStops;
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.routeScroll} showsVerticalScrollIndicator={false}>
      <OverlapSheet>
        <Text style={D.screenTitle}>Route</Text>
        <Text style={D.screenSubHeader}>{routeNumber} · {routeStops.length} stops</Text>

        <View style={D.numberBlock}>
          <Text style={D.numberText}>{route?.number || '–'}</Text>
          <View style={D.flex}>
            <Text style={D.routeCardLabel} numberOfLines={2}>{routeLabel}</Text>
            <View style={[D.statusPill, isOnShift ? D.statusPillActive : D.statusPillOff]}>
              <Text style={[D.statusPillText, isOnShift ? D.statusPillTextActive : D.statusPillTextOff]}>{isOnShift ? 'On duty' : 'Off duty'}</Text>
            </View>
          </View>
        </View>

        {route?.trackable ? (
          <View style={D.mapCard}>
            <LiveMap
              path={route.path}
              stops={route.stopPoints}
              buses={busMarkers}
              padding={MAP_PADDING}
              highlightStop={!isOnShift ? -1 : back ? routeStops.length - 1 - currentStopIndex : currentStopIndex}
            />
          </View>
        ) : null}

        <Text style={D.sectionLabel}>Stops</Text>
        {routeStops.length === 0 ? (
          <View style={D.emptyBlock}>
            <Vehicle name="bus" width={100} label="No route assigned" />
            <Text style={D.emptyLog}>No route is assigned to this bus yet.</Text>
          </View>
        ) : (
          legStops.map((stop, idx) => {
            const isPassed = isOnShift && idx < currentStopIndex;
            const isCurrent = isOnShift && idx === currentStopIndex;
            return (
              <View key={idx} style={[D.stopBlock, isCurrent ? D.stopCurrent : isPassed ? D.stopPassed : D.stopUpcoming]}>
                <View style={[D.stopIndex, isCurrent && D.stopIndexCurrent]}>
                  {isPassed ? <CheckIcon color={COLORS.onCard} size={14} /> : <Text style={[D.stopIndexText, isCurrent && D.onOrange]}>{String(idx + 1).padStart(2, '0')}</Text>}
                </View>
                <Text style={[D.stopName, isCurrent && D.onOrange, isPassed && D.onCard]} numberOfLines={2}>{stop}</Text>
                <Text style={[D.stopTag, isCurrent && D.onOrange, isPassed && D.onCardSoft]}>{isPassed ? 'Passed' : isCurrent ? 'Next stop' : 'Upcoming'}</Text>
              </View>
            );
          })
        )}
      </OverlapSheet>
    </ScrollView>
  );
}
