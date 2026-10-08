import React from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Avatar, Button, GradientCard, IconButton, OverlapHeader, OverlapSheet, Vehicle } from '../shared/ui';
import { liveryFor } from '../shared/vehicleShapes';
import { ArrowRightIcon, BellIcon, MapPinIcon, NavigationArrowIcon, RouteIcon } from '../shared/icons';
import { trackedSummary } from '../utils';
import { S } from './HomeScreen.styles';

export function HomeScreen({ userProfile, selectedRoute, tracked, liveCount, boardingStop, destinationStop, onGoTracking, onGoRoutes, onOpenStops, showToast }) {
  const bus = tracked?.bus;
  const services = [
    { key: 'track', label: 'Live tracker', onPress: onGoTracking, icon: <NavigationArrowIcon color={COLORS.primary} size={22} /> },
    { key: 'routes', label: 'Browse routes', onPress: onGoRoutes, icon: <RouteIcon color={COLORS.primary} size={22} /> },
    { key: 'stops', label: 'My stops', onPress: onOpenStops, icon: <MapPinIcon color={COLORS.primary} size={22} /> },
  ];
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.homeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={196}>
        <View style={S.homeHeader}>
          <Avatar label={userProfile?.name} size={48} />
          <View style={S.homeHeaderText}>
            <Text style={S.homeGreeting}>Hello,</Text>
            <Text style={S.homeUserName} numberOfLines={1}>{userProfile?.name || 'Passenger'}</Text>
          </View>
          <IconButton
            label="Notifications"
            onPress={() => showToast(bus ? trackedSummary(tracked, boardingStop, destinationStop) : `No live bus on ${selectedRoute.shortName} right now.`)}
          >
            <BellIcon color={COLORS.ink} size={20} hasBadge={!!bus} />
          </IconButton>
        </View>
        <Vehicle name="bus" livery="purple" width={132} style={S.homeHeaderBus} label="Illustrated city bus" />
      </OverlapHeader>

      <OverlapSheet style={S.homeSheet}>
        {/* Travelling To Card */}
        <View style={S.travelCard}>
          <View style={S.travelCardLeft}>
            <View style={S.travelIcon}>
              <MapPinIcon color={COLORS.accent} size={20} />
            </View>
            <View style={S.flex}>
              <Text style={S.travelCardLabel}>Travelling to</Text>
              <Text style={S.travelCardPlace} numberOfLines={1}>{destinationStop || 'Choose a route'}</Text>
            </View>
          </View>
          <Button title="Change" tone="soft" size="sm" full={false} onPress={onOpenStops} />
        </View>

        {/* Services */}
        <Text style={S.sectionTitle}>Services</Text>
        <View style={S.quickRow}>
          {services.map(s => (
            <Pressable
              key={s.key}
              onPress={s.onPress}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              style={({ pressed }) => [S.quickItem, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
            >
              <View style={S.quickTile}>{s.icon}</View>
              <Text style={S.quickLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Active Journey: the live bus for the chosen stops */}
        <Text style={S.sectionTitle}>Active Journey</Text>
        {bus ? (
          <GradientCard tint="bus" style={S.journeyCard}>
            <Pressable
              onPress={onGoTracking}
              accessibilityRole="button"
              accessibilityLabel={`Open live tracker for bus ${bus.registration}`}
              style={({ pressed }) => [S.journeyPress, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
            >
              <View style={S.journeyCardTop}>
                <View style={S.flex}>
                  <Text style={S.journeyBusId}>Bus {bus.registration}</Text>
                  <Text style={S.journeyRouteName}>{selectedRoute.shortName}</Text>
                  <View style={S.journeyKv}>
                    <View>
                      <Text style={S.journeyKvLabel}>Status</Text>
                      <Text style={S.journeyKvVal}>{bus.stale ? 'Signal lost' : tracked.phase === 'coming' ? 'On the way' : 'In transit'}</Text>
                    </View>
                    <View>
                      <Text style={S.journeyKvLabel}>{tracked.phase === 'coming' ? 'At your stop' : 'At destination'}</Text>
                      <Text style={S.journeyKvVal}>{tracked.etaMin != null ? `${tracked.etaMin} min` : '—'}</Text>
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

        {/* Route Summary */}
        <View style={S.sectionRow}>
          <Text style={S.sectionTitleFlat}>My Route</Text>
          <TouchableOpacity onPress={onGoRoutes} activeOpacity={0.7} style={S.linkTap} accessibilityRole="link">
            <Text style={S.link}>See all</Text>
          </TouchableOpacity>
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
            <ArrowRightIcon color={COLORS.accent} size={12} />
            <Text style={S.routeTerminalText}>{selectedRoute.endTerminal}</Text>
          </View>
        </View>
      </OverlapSheet>
    </ScrollView>
  );
}
