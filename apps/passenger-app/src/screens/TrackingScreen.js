import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import LiveMap from '../shared/LiveMap';
import { COLORS } from '../shared/theme';
import { Button, IconButton, Vehicle, VehicleLoader, ProgressTrack } from '../shared/ui';
import { MoreVerticalIcon } from '../shared/icons';
import { MAP_PADDING, MAP_PADDING_COMPACT_BOTTOM } from '../constants';
import { StopPicker } from '../components/StopPicker';
import { trackedSummary } from '../utils';
import { ConnectionChip } from '../components/ConnectionChip';
import { useS } from './TrackingScreen.styles';

export function TrackingScreen({
  conn,
  routesState,
  tracked,
  liveCount,
  mapBuses,
  selectedRoute,
  boardingStop,
  destinationStop,
  boardingIndex,
  routeStops,
  isBoardingExpanded,
  isDestExpanded,
  setIsBoardingExpanded,
  setIsDestExpanded,
  setBoardingStop,
  setDestinationStop,
  onOpenStops,
  onGoRoutes,
}) {
  const S = useS();
  const bus = tracked?.bus;
  // The card starts short (bus, status, progress) so most of the map stays visible; the stop list and driver open on request.
  const [showStops, setShowStops] = useState(false);
  const compactCard = Boolean(bus) && !showStops;
  const mapPadding = { top: MAP_PADDING.top, bottom: compactCard ? MAP_PADDING_COMPACT_BOTTOM : MAP_PADDING.bottom };
  // How far along the route the tracked bus is (by segment), for the progress bar.
  const progress = bus?.segIndex != null && routeStops.length > 1
    ? Math.min(0.94, Math.max(0.06, (bus.segIndex + 0.5) / (routeStops.length - 1)))
    : 0.06;

  // The one-line state of the tracked route for the card at the top: which bus, and what it means for this passenger.
  const noBus = conn === 'connected' ? 'No bus on this route right now' : 'Reconnecting…';
  const headline = bus ? trackedSummary(tracked, boardingStop, destinationStop) : noBus; // the registration is on the card below

  return (
    <View style={S.flex}>
      {/* Map fills the whole screen; cards float on top */}
      <View style={S.mapCanvas}>
        <LiveMap
          path={selectedRoute.path}
          stops={selectedRoute.stopPoints}
          buses={mapBuses}
          highlightStop={boardingIndex}
          padding={mapPadding}
          focus={bus ? { lat: bus.lat, lng: bus.lng } : null}
        />
      </View>

      <View style={S.mapHeader} pointerEvents="box-none">
        <View style={S.mapHeaderInner}>
          <View style={S.mapHeaderLeft}>
            <ConnectionChip conn={conn} />
            <View style={S.mapHeaderText}>
              <Text style={S.mapHeaderTitle} numberOfLines={1}>{selectedRoute.shortName}</Text>
              <Text style={S.mapHeaderStatus} numberOfLines={2}>{headline}</Text>
            </View>
          </View>
          <IconButton label="Change stops" onPress={onOpenStops} tone="soft" size={44}>
            <MoreVerticalIcon color={COLORS.ink} size={18} />
          </IconButton>
        </View>
      </View>

      {routeStops.length > 0 ? (
        <View style={S.stopSelectorBar}>
          <StopPicker
            label="BOARDING"
            tone="white"
            value={boardingStop}
            expanded={isBoardingExpanded}
            onToggle={() => { setIsBoardingExpanded(p => !p); setIsDestExpanded(false); }}
            stops={routeStops}
            onPick={(stop) => { setBoardingStop(stop); setIsBoardingExpanded(false); }}
          />
          <StopPicker
            label="DESTINATION"
            tone="blue"
            value={destinationStop}
            expanded={isDestExpanded}
            onToggle={() => { setIsDestExpanded(p => !p); setIsBoardingExpanded(false); }}
            stops={routeStops}
            onPick={(stop) => { setDestinationStop(stop); setIsDestExpanded(false); }}
            alignRight
          />
        </View>
      ) : null}

      <View style={S.summaryCard}>
        {routesState === 'loading' ? (
          <View style={S.emptyState}><VehicleLoader label="Loading routes" /></View>
        ) : !selectedRoute.id ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status={routesState === 'error' ? 'maint' : undefined} width={116} label="No routes" />
            <Text style={S.emptyStateTitle}>{routesState === 'error' ? 'Could not load routes' : 'No routes available yet'}</Text>
            <Text style={S.emptyStateSub}>{routesState === 'error' ? 'Check your connection and try again.' : 'Routes appear here once they are published.'}</Text>
            <Button title="Open routes" tone="primary" size="sm" full={false} onPress={onGoRoutes} style={S.emptyBtn} />
          </View>
        ) : !selectedRoute.trackable ? (
          <View style={S.emptyState}>
            <Vehicle name="minibus" width={116} label="No map data" />
            <Text style={S.emptyStateTitle}>Live tracking is not set up for this route</Text>
            <Text style={S.emptyStateSub}>It has no map path or stop positions yet.</Text>
          </View>
        ) : !bus ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status={conn === 'connected' ? 'idle' : 'off'} width={116} label="No live bus" />
            <Text style={S.emptyStateTitle}>{conn === 'connected' ? 'No bus is on this route right now' : 'Reconnecting…'}</Text>
            <Text style={S.emptyStateSub}>
              {conn === 'connected' ? 'It will appear here as soon as a driver goes on duty.' : 'Live positions will resume when the connection is back.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={S.sheetTopRow}>
              <View style={S.flex}>
                <Text style={S.sheetMetaLabel}>{liveCount > 1 ? `Nearest of ${liveCount} buses` : 'Bus'}</Text>
                <Text style={S.sheetBookingId}>{bus.registration}</Text>
              </View>
              {!bus.stale && tracked.phase === 'coming' ? (
                <Text style={S.sheetEta} accessibilityLabel={`${tracked.etaMin} minutes away`}>{tracked.etaMin}<Text style={S.sheetEtaUnit}> min</Text></Text>
              ) : (
                <View style={[S.transitBadge, bus.stale && S.transitBadgeWarn]}>
                  <Text style={[S.transitBadgeText, bus.stale && S.transitBadgeTextWarn]}>{bus.stale ? 'Signal lost' : 'In transit'}</Text>
                </View>
              )}
            </View>

            <View style={S.progressBlock}>
              <ProgressTrack value={progress} height={6} color={COLORS.orange} track={COLORS.surfaceSoft} />
              <Text style={S.progressSummary}>{trackedSummary(tracked, boardingStop, destinationStop)}</Text>
            </View>

            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showStops }} onPress={() => setShowStops((v) => !v)} style={S.moreRow}>
              <Text style={S.moreText}>{showStops ? 'Hide stops and driver' : 'Stops and driver'}</Text>
              <Text style={S.moreText}>{showStops ? '▴' : '▾'}</Text>
            </Pressable>

            {showStops ? (
              <>
            {/* Predicted arrival at every stop, updated on each GPS fix */}
            <ScrollView style={S.etaList} showsVerticalScrollIndicator={false}>
              {bus.stops.map((stop) => {
                const mine = stop.name === boardingStop || stop.name === destinationStop;
                return (
                  <View key={stop.index} style={[S.etaRow, mine && S.etaRowOn]}>
                    <View style={[S.etaDot, stop.status === 'passed' && S.etaDotPassed, mine && S.etaDotOn]} />
                    <Text style={[S.etaStop, stop.status === 'passed' && S.etaPassed, mine && S.etaOnText]} numberOfLines={1}>{stop.name}</Text>
                    <Text style={[S.etaVal, stop.status === 'passed' && S.etaPassed, mine && S.etaOnText]}>
                      {stop.status === 'passed' ? 'Passed' : `${stop.etaMin} min`}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={S.driverCard}>
              <View style={S.driverLeft}>
                <View style={S.driverAvatar}>
                  <Text style={S.driverAvatarText}>{(bus.driverName || bus.registration || 'B').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={S.flex}>
                  <Text style={S.driverName}>{bus.driverName || 'Driver on duty'}</Text>
                  <Text style={S.driverRole} numberOfLines={1}>{Math.round((bus.speed || 0) * 3.6)} km/h · {bus.registration}</Text>
                </View>
              </View>
              <View style={S.driverStatusBadge}>
                <View style={S.driverStatusDot} />
                <Text style={S.driverStatusText}>On Duty</Text>
              </View>
            </View>
              </>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
