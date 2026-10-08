import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import LiveMap from '../shared/LiveMap';
import { GradientCard, OverlapHeader, OverlapSheet, Vehicle } from '../shared/ui';
import { CheckIcon } from '../shared/icons';
import { MAP_PADDING } from '../constants';
import { D } from './RouteScreen.styles';

export function RouteScreen({ route, busMarkers, routeNumber, routeLabel, routeStops, currentStopIndex, isOnShift }) {
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>Route Overview</Text>
        <Text style={D.screenSubHeader}>{routeNumber} · {routeStops.length} stops</Text>
        <Vehicle name="bus" livery="navy" width={124} style={D.headerBus} label="Illustrated city bus" />
      </OverlapHeader>

      <OverlapSheet>
        {/* Route Badge Card: pastel gradient */}
        <GradientCard tint="bus" style={D.routeHeaderCardWrap}>
          <View style={D.routeHeaderCard}>
            <View style={D.routeHeaderLeft}>
              <View style={D.routeNumBadge}>
                <Text style={D.routeNumText}>{route?.number || '–'}</Text>
              </View>
              <View style={D.flex}>
                <Text style={D.routeCardLabel}>{routeNumber}</Text>
                <Text style={D.routeCardSub} numberOfLines={2}>{routeLabel}</Text>
              </View>
            </View>
            <View style={[D.statusPill, isOnShift ? D.statusPillActive : D.statusPillOff]}>
              <Text style={[D.statusPillText, isOnShift ? D.statusPillTextActive : D.statusPillTextOff]}>
                {isOnShift ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
          </View>
        </GradientCard>

        {route?.trackable ? (
          <View style={D.mapCard}>
            <LiveMap path={route.path} stops={route.stopPoints} buses={busMarkers} highlightStop={isOnShift ? currentStopIndex : -1} padding={MAP_PADDING} />
          </View>
        ) : null}

        {/* Stop Timeline */}
        <Text style={D.sectionLabel}>Stop timeline</Text>
        <View style={D.timelineCard}>
          {routeStops.length === 0 ? (
            <View style={D.emptyLogBox}>
              <Vehicle name="bus" width={100} label="No route assigned" />
              <Text style={D.emptyLog}>No route is assigned to this bus yet.</Text>
            </View>
          ) : routeStops.map((stop, idx) => {
            const isPassed = isOnShift && idx < currentStopIndex;
            const isCurrent = isOnShift && idx === currentStopIndex;
            return (
              <View key={idx} style={D.timelineRow}>
                <View style={D.timelineLeft}>
                  <View style={[
                    D.timelineDot,
                    isPassed && D.dotPassed,
                    isCurrent && D.dotCurrent,
                  ]}>
                    {isPassed ? <CheckIcon color="#FFF" size={7} /> : null}
                    {isCurrent ? <View style={D.dotCurrentInner} /> : null}
                  </View>
                  {idx < routeStops.length - 1 && (
                    <View style={[D.timelineLine, isPassed && D.lineVPassed]} />
                  )}
                </View>
                <View style={D.timelineRight}>
                  <Text style={[D.timelineStop, isCurrent && D.timelineStopActive]}>
                    {stop}
                  </Text>
                  <Text style={D.timelineTag}>
                    {isPassed ? 'Passed' : isCurrent ? '→ Next stop' : 'Upcoming'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </OverlapSheet>
    </ScrollView>
  );
}
