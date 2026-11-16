import React from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, OverlapSheet, Vehicle, VehicleLoader, Tap, Reveal } from '../shared/ui';
import { ArrowRightIcon, SearchIcon } from '../shared/icons';
import { useS } from './RoutesScreen.styles';

// Routes: a big title, a search pill, and one block per route. The route you are tracking is the orange block, the rest are
// white; the route number is the big light number in the corner.
export function RoutesScreen({ routesState, onRetry, routeSearchQuery, setRouteSearchQuery, filteredRoutes, selectedRoute, onSelectRoute }) {
  const S = useS();
  return (
    <ScrollView style={S.flex} contentContainerStyle={S.routesScroll} showsVerticalScrollIndicator={false}>
      <OverlapSheet>
        <Text style={S.screenTitle}>Routes</Text>
        <Text style={S.screenSubtitle}>Pick a route to track its buses</Text>

        <View style={S.searchBar}>
          <SearchIcon color={COLORS.muted} size={18} />
          <TextInput
            style={S.searchInput}
            value={routeSearchQuery}
            onChangeText={setRouteSearchQuery}
            placeholder="Search route no. or stop name…"
            placeholderTextColor={COLORS.muted}
            accessibilityLabel="Search routes"
          />
          {routeSearchQuery ? (
            <Tap onPress={() => setRouteSearchQuery('')} style={S.searchClearTap} accessibilityLabel="Clear search" accessibilityRole="button">
              <Text style={S.searchClear}>✕</Text>
            </Tap>
          ) : null}
        </View>

        {routesState === 'loading' ? (
          <View style={S.emptyState}><VehicleLoader label="Loading routes" /></View>
        ) : routesState === 'error' ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status="maint" width={120} label="Could not load routes" />
            <Text style={S.emptyStateTitle}>Could not load routes</Text>
            <Text style={S.emptyStateSub}>Check your connection and try again.</Text>
            <Button title="Try again" tone="primary" size="sm" full={false} onPress={onRetry} style={S.emptyBtn} />
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={S.emptyState}>
            <Vehicle name="coach" width={128} label="No routes found" />
            <Text style={S.emptyStateTitle}>No routes found</Text>
            <Text style={S.emptyStateSub}>{routeSearchQuery ? 'Try a different search term' : 'Routes appear here once they are published.'}</Text>
          </View>
        ) : (
          filteredRoutes.map((route, index) => {
            const isSel = selectedRoute.id === route.id;
            return (
              <Reveal key={route.id} index={index}>
                <Tap
                  style={[S.routeBlock, isSel ? S.routeBlockOn : S.routeBlockOff]}
                  onPress={() => onSelectRoute(route)}
                  accessibilityRole="button"
                  accessibilityLabel={`${route.name}, ${isSel ? 'currently tracking' : 'select'}`}
                >
                  <View style={S.routeTop}>
                    <View style={S.flex}>
                      <Text style={[S.routeName, isSel && S.onOrange]} numberOfLines={2}>{route.name}</Text>
                      <Text style={[S.routeMeta, isSel && S.onOrangeSoft]}>
                        {route.distanceKm} km · {route.stops.length} stops{route.trackable ? '' : ' · no live tracking yet'}
                      </Text>
                    </View>
                    {isSel ? <View style={S.trackingPill}><Text style={S.trackingPillText}>Tracking</Text></View> : null}
                  </View>

                  <View style={S.routeEnds}>
                    <Text style={[S.endName, isSel && S.onOrange]} numberOfLines={1}>{route.startTerminal}</Text>
                    <ArrowRightIcon color={isSel ? COLORS.onBright : COLORS.muted} size={14} />
                    <Text style={[S.endName, isSel && S.onOrange]} numberOfLines={1}>{route.endTerminal}</Text>
                  </View>

                  <View style={S.routeBottom}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.stopsScroll}>
                      {route.stops.map((stop, idx) => (
                        <View key={idx} style={[S.stopChip, isSel && S.stopChipOn]}>
                          <Text style={[S.stopChipText, isSel && S.onOrange]}>{stop}</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <Text style={[S.routeNumber, isSel && S.onOrange]}>{route.number}</Text>
                  </View>
                </Tap>
              </Reveal>
            );
          })
        )}
      </OverlapSheet>
    </ScrollView>
  );
}
