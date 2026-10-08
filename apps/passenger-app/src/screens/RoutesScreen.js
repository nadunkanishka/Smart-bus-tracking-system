import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, GradientCard, OverlapHeader, OverlapSheet, Vehicle, VehicleLoader } from '../shared/ui';
import { ArrowRightIcon, NavigationArrowIcon, SearchIcon } from '../shared/icons';
import { S } from './RoutesScreen.styles';

export function RoutesScreen({ routesState, onRetry, routeSearchQuery, setRouteSearchQuery, filteredRoutes, selectedRoute, onSelectRoute }) {
  return (
    <ScrollView
      style={S.flex}
      contentContainerStyle={S.routesScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={190}>
        <Text style={S.screenTitle}>Bus Routes</Text>
        <Text style={S.screenSubtitle}>Select a route to start tracking your bus</Text>

        {/* Search */}
        <View style={S.searchBar}>
          <SearchIcon color={COLORS.muted} size={18} />
          <TextInput
            style={S.searchInput}
            value={routeSearchQuery}
            onChangeText={setRouteSearchQuery}
            placeholder="Search route no. or stop name…"
            placeholderTextColor={COLORS.mutedLight}
            accessibilityLabel="Search routes"
          />
          {routeSearchQuery ? (
            <TouchableOpacity onPress={() => setRouteSearchQuery('')} activeOpacity={0.7} style={S.searchClearTap} accessibilityLabel="Clear search" accessibilityRole="button">
              <Text style={S.searchClear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {/* Currently Selected */}
        {selectedRoute.id && (
          <View style={S.activeRouteBanner}>
            <View style={S.activeRouteLeft}>
              <NavigationArrowIcon color={COLORS.accentText} size={14} />
              <Text style={S.activeRouteBannerText}>
                Tracking {selectedRoute.shortName}
              </Text>
            </View>
            <View style={S.activeDot} />
          </View>
        )}

        {/* Route Cards */}
        {routesState === 'loading' ? (
          <View style={S.emptyState}><VehicleLoader label="Loading routes" /></View>
        ) : routesState === 'error' ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status="maint" width={120} label="Could not load routes" />
            <Text style={S.emptyStateTitle}>Could not load routes</Text>
            <Text style={S.emptyStateSub}>Check your connection and try again.</Text>
            <Button title="Try again" tone="ink" size="sm" full={false} onPress={onRetry} style={S.emptyBtn} />
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={S.emptyState}>
            <Vehicle name="coach" width={128} label="No routes found" />
            <Text style={S.emptyStateTitle}>No routes found</Text>
            <Text style={S.emptyStateSub}>{routeSearchQuery ? 'Try a different search term' : 'Routes appear here once they are published.'}</Text>
          </View>
        ) : (
          filteredRoutes.map(route => {
            const isSel = selectedRoute.id === route.id;
            const Wrap = isSel ? GradientCard : View;
            const wrapProps = isSel ? { tint: 'bus', id: `route-${route.id}`, style: S.routeCardWrap } : { style: [S.routeCardWrap, S.routeCardPlain] };
            return (
              <Wrap key={route.id} {...wrapProps}>
                <TouchableOpacity
                  style={S.routeCard}
                  onPress={() => onSelectRoute(route)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${route.name}, ${isSel ? 'currently tracking' : 'select'}`}
                >
                  <View style={S.routeCardTop}>
                    <View style={[S.routeNumBadge, isSel && S.routeNumBadgeActive]}>
                      <Text style={[S.routeNumText, isSel && S.routeNumTextActive]}>
                        {route.number}
                      </Text>
                    </View>
                    <View style={S.routeCardTitleBox}>
                      <Text style={S.routeCardName} numberOfLines={1}>{route.name}</Text>
                      <Text style={S.routeCardMeta}>
                        {route.distanceKm} km · {route.stops.length} stops{route.trackable ? '' : ' · no live tracking yet'}
                      </Text>
                    </View>
                    {isSel ? (
                      <View style={S.trackingPill}>
                        <Text style={S.trackingPillText}>Tracking</Text>
                      </View>
                    ) : (
                      <View style={S.trackRoutePill}>
                        <Text style={S.trackRoutePillText}>Select</Text>
                        <ArrowRightIcon color={COLORS.primaryStrong} size={12} />
                      </View>
                    )}
                  </View>

                  <View style={S.routeTerminalsCard}>
                    <View style={S.terminalItem}>
                      <View style={S.terminalDotStart} />
                      <Text style={S.terminalName} numberOfLines={1}>{route.startTerminal}</Text>
                    </View>
                    <View style={S.terminalDashedLine} />
                    <View style={S.terminalItem}>
                      <View style={S.terminalDotEnd} />
                      <Text style={S.terminalName} numberOfLines={1}>{route.endTerminal}</Text>
                    </View>
                  </View>

                  {/* Stops */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.stopsScroll}>
                    {route.stops.map((stop, idx) => (
                      <View key={idx} style={S.stopChip}>
                        <Text style={S.stopChipText}>{stop}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </TouchableOpacity>
              </Wrap>
            );
          })
        )}
      </OverlapSheet>
    </ScrollView>
  );
}
