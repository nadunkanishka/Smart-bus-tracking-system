import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, CountUp, IconButton, LiveDot, OverlapSheet, Reveal, Tap, Vehicle } from '../shared/ui';
import { liveryFor } from '../shared/vehicleShapes';
import { ArrowRightIcon, BellIcon, MapPinIcon, NavigationArrowIcon, RouteIcon, SettingsIcon } from '../shared/icons';
import { trackedSummary } from '../utils';
import { useS } from './HomeScreen.styles';

// Home: a big greeting, one black card that answers "when does my bus come" in a giant number, three quick actions in a
// row, the stop you are travelling to, and your route as a list row.
export function HomeScreen({ userProfile, selectedRoute, tracked, liveCount, boardingStop, destinationStop, onGoTracking, onGoRoutes, onOpenStops, onOpenSettings, showToast }) {
  const S = useS();
  const bus = tracked?.bus;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const first = (userProfile?.name || 'Passenger').split(' ')[0];
  const services = [
    { key: 'track', label: 'Live tracker', onPress: onGoTracking, icon: <NavigationArrowIcon color={COLORS.ink} size={20} /> },
    { key: 'routes', label: 'Browse routes', onPress: onGoRoutes, icon: <RouteIcon color={COLORS.ink} size={20} /> },
    { key: 'stops', label: 'My stops', onPress: onOpenStops, icon: <MapPinIcon color={COLORS.ink} size={20} /> },
  ];
  const eta = tracked?.etaMin;
  const status = !bus ? '' : bus.stale ? 'Signal lost' : tracked.phase === 'coming' ? 'to your stop' : 'to your destination';
  return (
    <ScrollView style={S.flex} contentContainerStyle={S.homeScroll} showsVerticalScrollIndicator={false}>
      <OverlapSheet>
        <View style={S.homeHeader}>
          <View style={S.homeHeaderText}>
            <Text style={S.homeGreeting}>{today}</Text>
            <Text style={S.homeUserName} numberOfLines={1}>Hello, {first}</Text>
          </View>
          <IconButton label="Settings" onPress={onOpenSettings}>
            <SettingsIcon color={COLORS.ink} size={20} />
          </IconButton>
          <IconButton
            label="Notifications"
            onPress={() => showToast(bus ? trackedSummary(tracked, boardingStop, destinationStop) : `No live bus on ${selectedRoute.shortName} right now.`)}
          >
            <BellIcon color={COLORS.ink} size={20} hasBadge={!!bus} />
          </IconButton>
        </View>

        <Reveal index={0}>
          {bus ? (
            <Pressable
              onPress={onGoTracking}
              accessibilityRole="button"
              accessibilityLabel={`Open live tracker for bus ${bus.registration}`}
              style={({ pressed }) => [S.hero, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
            >
              <View style={S.heroTop}>
                <View style={S.livePill}>
                  {!bus.stale ? <LiveDot color={COLORS.orange} size={8} /> : null}
                  <Text style={S.livePillText}>{bus.stale ? 'SIGNAL LOST' : 'LIVE'}</Text>
                </View>
                <Text style={S.heroBus}>{bus.registration} · {selectedRoute.shortName}</Text>
              </View>
              <View style={S.heroNumberRow}>
                {eta != null ? <CountUp value={eta} style={S.heroNumber} /> : <Text style={S.heroNumber}>–</Text>}
                <View style={S.heroUnit}>
                  <Text style={S.heroUnitText}>min</Text>
                  <Text style={S.heroUnitSub}>{status}</Text>
                </View>
                <Vehicle name="bus" livery={liveryFor(selectedRoute.id)} status={bus.stale ? 'off' : undefined} running={!bus.stale} width={104} style={S.heroBusArt} label="Illustrated city bus" />
              </View>
              <View style={S.heroStops}>
                <View style={S.flex}>
                  <Text style={S.heroStopLabel}>From</Text>
                  <Text style={S.heroStopName} numberOfLines={1}>{boardingStop}</Text>
                </View>
                <ArrowRightIcon color={COLORS.orange} size={18} />
                <View style={[S.flex, S.heroStopRight]}>
                  <Text style={S.heroStopLabel}>To</Text>
                  <Text style={S.heroStopName} numberOfLines={1}>{destinationStop}</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <View style={[S.card, S.emptyState]}>
              <Vehicle name="bus" status="idle" width={108} label="No live bus" />
              <Text style={S.emptyStateTitle}>No live bus right now</Text>
              <Text style={S.emptyStateSub}>{selectedRoute.id ? `Nothing is running on ${selectedRoute.shortName} at the moment.` : 'Pick a route to start tracking.'}</Text>
            </View>
          )}
        </Reveal>

        <Reveal index={1}>
          <View style={S.quickRow}>
            {services.map((s) => (
              <Tap key={s.key} onPress={s.onPress} accessibilityRole="button" accessibilityLabel={s.label} style={S.quickItem}>
                {s.icon}
                <Text style={S.quickLabel} numberOfLines={1}>{s.label}</Text>
              </Tap>
            ))}
          </View>
        </Reveal>

        <Reveal index={2}>
          <View style={S.card}>
            <View style={S.travelCardLeft}>
              <View style={S.travelIcon}>
                <MapPinIcon color={COLORS.onBright} size={20} />
              </View>
              <View style={S.flex}>
                <Text style={S.travelCardLabel}>Travelling to</Text>
                <Text style={S.travelCardPlace} numberOfLines={2}>{destinationStop || 'Choose a route'}</Text>
              </View>
              <Button title="Change" tone="soft" size="sm" full={false} onPress={onOpenStops} />
            </View>
          </View>
        </Reveal>

        <Reveal index={3}>
          <View style={S.sectionRow}>
            <Text style={S.sectionTitleFlat}>My route</Text>
            <Tap onPress={onGoRoutes} style={S.linkTap} accessibilityRole="link">
              <Text style={S.link}>See all</Text>
            </Tap>
          </View>
          <View style={S.card}>
            <View style={S.routeSummaryHeader}>
              <View style={S.routeBadge}>
                <Text style={S.routeBadgeText}>{selectedRoute.shortName}</Text>
              </View>
              <Text style={S.routeSummaryMeta}>{selectedRoute.distanceKm} km</Text>
              <Text style={S.routeSummaryMeta}>{liveCount} {liveCount === 1 ? 'bus' : 'buses'} live</Text>
            </View>
            <Text style={S.routeSummaryName}>{selectedRoute.name}</Text>
            <View style={S.routeTerminalRow}>
              <Text style={S.routeTerminalText} numberOfLines={1}>{selectedRoute.startTerminal}</Text>
              <ArrowRightIcon color={COLORS.muted} size={14} />
              <Text style={S.routeTerminalText} numberOfLines={1}>{selectedRoute.endTerminal}</Text>
            </View>
          </View>
        </Reveal>
      </OverlapSheet>
    </ScrollView>
  );
}
