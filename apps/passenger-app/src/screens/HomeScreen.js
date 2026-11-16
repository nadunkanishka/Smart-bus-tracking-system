import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { CountUp, IconButton, LiveDot, OverlapSheet, Reveal, Tap, Vehicle } from '../shared/ui';
import { liveryFor } from '../shared/vehicleShapes';
import { ArrowRightIcon, BellIcon, ChevronDownIcon, SettingsIcon } from '../shared/icons';
import { trackedSummary } from '../utils';
import { useS } from './HomeScreen.styles';

// Home is a stack of big flat blocks: who you are, two number blocks (buses live, minutes to your stop), the live bus as the
// orange block with one bar per stop, and the stop you are travelling to as the blue block.
export function HomeScreen({ userProfile, selectedRoute, tracked, liveCount, boardingStop, destinationStop, onGoTracking, onGoRoutes, onOpenStops, onOpenSettings, showToast }) {
  const S = useS();
  const bus = tracked?.bus;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const name = userProfile?.name || 'Passenger';
  const first = name.split(' ')[0];
  const eta = tracked?.etaMin;
  const stops = bus?.stops || [];
  const etaWhat = !tracked ? 'no live bus' : tracked.phase === 'coming' ? 'to your stop' : 'to your destination';
  return (
    <ScrollView style={S.flex} contentContainerStyle={S.homeScroll} showsVerticalScrollIndicator={false}>
      <OverlapSheet>
        <View style={S.homeHeader}>
          <View style={S.avatar}><Text style={S.avatarText}>{first.charAt(0).toUpperCase()}</Text></View>
          <View style={S.homeHeaderText}>
            <Text style={S.homeUserName} numberOfLines={1}>{first}</Text>
            <Text style={S.homeGreeting}>{today}</Text>
          </View>
          <IconButton
            label="Notifications"
            onPress={() => showToast(bus ? trackedSummary(tracked, boardingStop, destinationStop) : `No live bus on ${selectedRoute.shortName} right now.`)}
          >
            <BellIcon color={COLORS.ink} size={20} hasBadge={!!bus} />
          </IconButton>
          <IconButton label="Settings" onPress={onOpenSettings}>
            <SettingsIcon color={COLORS.ink} size={20} />
          </IconButton>
        </View>

        <Reveal index={0}>
          <View style={S.splitRow}>
            <View style={[S.splitBlock, S.splitWhite]}>
              <CountUp value={liveCount} style={S.splitNumber} />
              <Text style={S.splitLabel}>{liveCount === 1 ? 'Bus' : 'Buses'}{'\n'}live</Text>
            </View>
            <View style={[S.splitBlock, S.splitBlue]}>
              {eta != null ? <CountUp value={eta} style={[S.splitNumber, S.onBlue]} /> : <Text style={[S.splitNumber, S.onBlue]}>–</Text>}
              <Text style={[S.splitLabel, S.onBlue]}>min{'\n'}{etaWhat}</Text>
            </View>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View style={S.sectionRow}>
            <Text style={S.sectionTitle}>Live bus</Text>
            <Tap onPress={onGoRoutes} style={S.linkTap} accessibilityRole="link"><Text style={S.link}>See all</Text></Tap>
          </View>
          {bus ? (
            <Pressable
              onPress={onGoTracking}
              accessibilityRole="button"
              accessibilityLabel={`Open live tracker for bus ${bus.registration}`}
              style={({ pressed }) => [S.orangeBlock, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
            >
              <View style={S.orangeTop}>
                <View style={S.flex}>
                  <Text style={S.orangeTitle}>{bus.registration}</Text>
                  <Text style={S.orangeSub}>{selectedRoute.shortName} · {bus.stale ? 'Signal lost' : trackedSummary(tracked, boardingStop, destinationStop)}</Text>
                </View>
                <View style={S.livePill}>
                  {!bus.stale ? <LiveDot color={COLORS.onBright} size={7} /> : null}
                  <Text style={S.livePillText}>{bus.stale ? 'OFFLINE' : 'LIVE'}</Text>
                </View>
              </View>
              <Text style={S.barsLabel}>Stops</Text>
              <View style={S.bars}>
                {stops.map((s) => (
                  <View key={s.index} style={[S.bar, s.status === 'passed' ? S.barPassed : S.barUpcoming, (s.name === boardingStop || s.name === destinationStop) && S.barMine]}>
                    <Text style={S.barText}>{String(s.index + 1).padStart(2, '0')}</Text>
                  </View>
                ))}
              </View>
              <Vehicle name="bus" livery={liveryFor(selectedRoute.id)} status={bus.stale ? 'off' : undefined} running={!bus.stale} width={96} style={S.orangeBus} label="Illustrated city bus" />
            </Pressable>
          ) : (
            <View style={S.emptyBlock}>
              <Vehicle name="bus" status="idle" width={96} label="No live bus" />
              <Text style={S.emptyStateTitle}>No live bus right now</Text>
              <Text style={S.emptyStateSub}>{selectedRoute.id ? `Nothing is running on ${selectedRoute.shortName} at the moment.` : 'Pick a route to start tracking.'}</Text>
            </View>
          )}
        </Reveal>

        <Reveal index={2}>
          <Pressable onPress={onOpenStops} accessibilityRole="button" accessibilityLabel="My stops" style={({ pressed }) => [S.blueBlock, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
            <View style={S.flex}>
              <Text style={S.blueLabel}>Travelling to</Text>
              <Text style={S.blueTitle} numberOfLines={2}>{destinationStop || 'Choose a route'}</Text>
            </View>
            <View style={S.blueChevron}><ChevronDownIcon color={COLORS.onBlue} size={20} /></View>
          </Pressable>
        </Reveal>

        <Reveal index={3}>
          <Tap onPress={onGoTracking} accessibilityRole="button" accessibilityLabel="Live tracker" style={S.routeRow}>
            <View style={S.routeBadge}><Text style={S.routeBadgeText}>{selectedRoute.shortName}</Text></View>
            <View style={S.flex}>
              <Text style={S.routeSummaryName} numberOfLines={1}>{selectedRoute.startTerminal} to {selectedRoute.endTerminal}</Text>
              <Text style={S.routeSummaryMeta}>{selectedRoute.distanceKm} km</Text>
            </View>
            <ArrowRightIcon color={COLORS.muted} size={18} />
          </Tap>
        </Reveal>
      </OverlapSheet>
    </ScrollView>
  );
}
