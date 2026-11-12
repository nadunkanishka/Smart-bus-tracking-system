import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, CountUp, GradientCard, IconButton, LiveDot, NotchStat, OverlapHeader, OverlapSheet, Reveal, Tap, Vehicle } from '../shared/ui';
import { liveryFor } from '../shared/vehicleShapes';
import { ArrowRightIcon, BellIcon, BusIcon, ClockIcon, MapPinIcon, NavigationArrowIcon, RouteIcon, SettingsIcon } from '../shared/icons';
import { trackedSummary } from '../utils';
import { useS } from './HomeScreen.styles';

// Home follows the dashboard's layout: a large greeting, the orange hero card, round actions, two small stat cards,
// then glass cards. Each block eases in after the one above it.
export function HomeScreen({ userProfile, selectedRoute, tracked, liveCount, boardingStop, destinationStop, onGoTracking, onGoRoutes, onOpenStops, onOpenSettings, showToast }) {
  const S = useS();
  const bus = tracked?.bus;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const first = (userProfile?.name || 'Passenger').split(' ')[0];
  const services = [
    { key: 'track', label: 'Live tracker', onPress: onGoTracking, icon: <NavigationArrowIcon color={COLORS.primaryDeep} size={22} /> },
    { key: 'routes', label: 'Browse routes', onPress: onGoRoutes, icon: <RouteIcon color={COLORS.primaryDeep} size={22} /> },
    { key: 'stops', label: 'My stops', onPress: onOpenStops, icon: <MapPinIcon color={COLORS.primaryDeep} size={22} /> },
  ];
  const eta = tracked?.etaMin;
  return (
    <ScrollView style={S.flex} contentContainerStyle={S.homeScroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader>
        <View style={S.homeHeader}>
          <View style={S.homeHeaderText}>
            <Text style={S.homeGreeting}>{today}</Text>
            <Text style={S.homeUserName} numberOfLines={1}><Text style={S.homeHello}>Hello, </Text>{first}</Text>
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
      </OverlapHeader>

      <OverlapSheet>
        {/* The live bus for your stops, as the orange card */}
        <Reveal index={0}>
          {bus ? (
            <GradientCard tint="hero" style={S.journeyCard}>
              <Pressable
                onPress={onGoTracking}
                accessibilityRole="button"
                accessibilityLabel={`Open live tracker for bus ${bus.registration}`}
                style={({ pressed }) => [S.journeyPress, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
              >
                <View style={S.journeyCardTop}>
                  <View style={S.flex}>
                    {!bus.stale ? (
                      <View style={S.livePill}>
                        <LiveDot color={COLORS.onBright} size={7} />
                        <Text style={S.livePillText}>LIVE</Text>
                      </View>
                    ) : null}
                    <Text style={S.journeyBusId}>Bus {bus.registration}</Text>
                    <Text style={S.journeyRouteName}>{selectedRoute.shortName}</Text>
                    <View style={S.journeyKv}>
                      <View>
                        <Text style={S.journeyKvLabel}>Status</Text>
                        <Text style={S.journeyKvVal}>{bus.stale ? 'Signal lost' : tracked.phase === 'coming' ? 'On the way' : 'In transit'}</Text>
                      </View>
                      <View>
                        <Text style={S.journeyKvLabel}>{tracked.phase === 'coming' ? 'At your stop' : 'At destination'}</Text>
                        <Text style={S.journeyKvVal}>{eta != null ? `${eta} min` : '—'}</Text>
                      </View>
                    </View>
                  </View>
                  <Vehicle name="bus" livery={liveryFor(selectedRoute.id)} status={bus.stale ? 'off' : undefined} running={!bus.stale} width={124} style={S.journeyBus} label="Illustrated city bus" />
                </View>

                <View style={S.journeyTerminals}>
                  <View style={S.flex}>
                    <Text style={S.journeyTerminalLabel}>From</Text>
                    <Text style={S.journeyTerminalName} numberOfLines={1}>{boardingStop}</Text>
                  </View>
                  <View style={S.journeyTerminalRight}>
                    <Text style={S.journeyTerminalLabel}>To</Text>
                    <Text style={S.journeyTerminalName} numberOfLines={1}>{destinationStop}</Text>
                  </View>
                </View>
              </Pressable>
            </GradientCard>
          ) : (
            <View style={[S.routeSummaryCard, S.journeyCard, S.emptyState]}>
              <Vehicle name="bus" status="idle" width={108} label="No live bus" />
              <Text style={S.emptyStateTitle}>No live bus right now</Text>
              <Text style={S.emptyStateSub}>{selectedRoute.id ? `Nothing is running on ${selectedRoute.shortName} at the moment.` : 'Pick a route to start tracking.'}</Text>
            </View>
          )}
        </Reveal>

        {/* Round actions, like the dashboard's card actions */}
        <Reveal index={1}>
          <View style={S.quickRow}>
            {services.map((s) => (
              <Tap key={s.key} onPress={s.onPress} accessibilityRole="button" accessibilityLabel={s.label} style={S.quickItem}>
                <View style={S.quickTile}>{s.icon}</View>
                <Text style={S.quickLabel}>{s.label}</Text>
              </Tap>
            ))}
          </View>
        </Reveal>

        {/* Two small stat cards */}
        <Reveal index={2}>
          <View style={S.statRow}>
            <NotchStat
              label="Buses live"
              icon={(c) => <BusIcon color={c} size={14} />}
              value={<CountUp value={liveCount} style={S.statValue} />}
              pill={liveCount ? 'on this route' : 'none yet'}
              pillTone={liveCount ? 'green' : 'violet'}
            />
            <NotchStat
              label="Arriving in"
              tone="purple"
              icon={(c) => <ClockIcon color={c} size={14} />}
              value={eta != null ? <CountUp value={eta} suffix=" min" style={S.statValue} /> : <Text style={S.statValue}>—</Text>}
              pill={tracked ? (tracked.phase === 'coming' ? 'to your stop' : 'to destination') : 'no live bus'}
              pillTone={tracked ? 'green' : 'violet'}
            />
          </View>
        </Reveal>

        <Reveal index={3}>
          <View style={S.travelCard}>
            <View style={S.travelCardLeft}>
              <View style={S.travelIcon}>
                <MapPinIcon color={COLORS.accentText} size={20} />
              </View>
              <View style={S.flex}>
                <Text style={S.travelCardLabel}>Travelling to</Text>
                <Text style={S.travelCardPlace} numberOfLines={1}>{destinationStop || 'Choose a route'}</Text>
              </View>
            </View>
            <Button title="Change" tone="soft" size="sm" full={false} onPress={onOpenStops} />
          </View>
        </Reveal>

        <Reveal index={4}>
          <View style={S.sectionRow}>
            <Text style={S.sectionTitleFlat}>My Route</Text>
            <Tap onPress={onGoRoutes} style={S.linkTap} accessibilityRole="link">
              <Text style={S.link}>See all</Text>
            </Tap>
          </View>

          <View style={S.routeSummaryCard}>
            <View style={S.routeSummaryHeader}>
              <View style={S.routeBadge}>
                <Text style={S.routeBadgeText}>{selectedRoute.shortName}</Text>
              </View>
              <Text style={S.routeSummaryMeta}>{selectedRoute.distanceKm} km · {liveCount} {liveCount === 1 ? 'bus' : 'buses'} live</Text>
            </View>
            <Text style={S.routeSummaryName}>{selectedRoute.name}</Text>
            <View style={S.routeTerminalRow}>
              <Text style={S.routeTerminalText}>{selectedRoute.startTerminal}</Text>
              <ArrowRightIcon color={COLORS.accentText} size={12} />
              <Text style={S.routeTerminalText}>{selectedRoute.endTerminal}</Text>
            </View>
          </View>
        </Reveal>
      </OverlapSheet>
    </ScrollView>
  );
}
