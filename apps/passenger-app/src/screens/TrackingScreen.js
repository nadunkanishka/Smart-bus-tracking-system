import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import LiveMap from '../shared/LiveMap';
import { COLORS } from '../shared/theme';
import { Button, IconButton, Vehicle, VehicleLoader } from '../shared/ui';
import { ArrowRightIcon, MoreVerticalIcon } from '../shared/icons';
import { MAP_PADDING } from '../constants';
import { StopPicker } from '../components/StopPicker';
import { trackedSummary } from '../utils';
import { ConnectionChip } from '../components/ConnectionChip';
import { S } from './TrackingScreen.styles';

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
  destinationIndex,
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
  const bus = tracked?.bus;
  // How far along the route the tracked bus is (by segment), for the progress bar.
  const progress = bus?.segIndex != null && routeStops.length > 1
    ? Math.min(0.94, Math.max(0.06, (bus.segIndex + 0.5) / (routeStops.length - 1)))
    : 0.06;

  return (
    <View style={S.flex}>
      {/* Map fills the whole screen; cards float on top */}
      <View style={S.mapCanvas}>
        <LiveMap
          path={selectedRoute.path}
          stops={selectedRoute.stopPoints}
          buses={mapBuses}
          highlightStop={boardingIndex}
          padding={MAP_PADDING}
        />
      </View>

      {/* Floating Map Header */}
      <View style={S.mapHeader} pointerEvents="box-none">
        <View style={S.mapHeaderInner}>
          <View style={S.mapHeaderLeft}>
            <ConnectionChip conn={conn} />
            <Text style={S.mapHeaderTitle} numberOfLines={1}>{selectedRoute.shortName}</Text>
          </View>
          <IconButton label="Change stops" onPress={onOpenStops} tone="soft" size={44}>
            <MoreVerticalIcon color={COLORS.ink} size={18} />
          </IconButton>
        </View>
      </View>

      {/* ── INLINE STOP SELECTOR (floating card) ─────────────────── */}
      {routeStops.length > 0 ? (
        <View style={S.stopSelectorBar}>
          <StopPicker
            label="BOARDING"
            dotStyle={S.stopDotGreen}
            value={boardingStop}
            expanded={isBoardingExpanded}
            onToggle={() => { setIsBoardingExpanded(p => !p); setIsDestExpanded(false); }}
            stops={routeStops}
            onPick={(stop) => { setBoardingStop(stop); setIsBoardingExpanded(false); }}
          />
          <View style={S.stopSelectorDivider}>
            <ArrowRightIcon color={COLORS.accent} size={16} />
          </View>
          <StopPicker
            label="DESTINATION"
            dotStyle={S.stopDotOrange}
            value={destinationStop}
            expanded={isDestExpanded}
            onToggle={() => { setIsDestExpanded(p => !p); setIsBoardingExpanded(false); }}
            stops={routeStops}
            onPick={(stop) => { setDestinationStop(stop); setIsDestExpanded(false); }}
            alignRight
          />
        </View>
      ) : null}

      {/* Bottom summary card */}
      <View style={S.summaryCard}>
        {routesState === 'loading' ? (
          <View style={S.emptyState}><VehicleLoader label="Loading routes" /></View>
        ) : !selectedRoute.id ? (
          <View style={S.emptyState}>
            <Vehicle name="bus" status={routesState === 'error' ? 'maint' : undefined} width={116} label="No routes" />
            <Text style={S.emptyStateTitle}>{routesState === 'error' ? 'Could not load routes' : 'No routes available yet'}</Text>
            <Text style={S.emptyStateSub}>{routesState === 'error' ? 'Check your connection and try again.' : 'Routes appear here once they are published.'}</Text>
            <Button title="Open routes" tone="ink" size="sm" full={false} onPress={onGoRoutes} style={S.emptyBtn} />
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
            {/* Header: bus + status */}
            <View style={S.sheetTopRow}>
              <View style={S.flex}>
                <Text style={S.sheetMetaLabel}>{liveCount > 1 ? `Nearest of ${liveCount} buses` : 'Bus'}</Text>
                <Text style={S.sheetBookingId}>{bus.registration}</Text>
              </View>
              <View style={[S.transitBadge, bus.stale && S.transitBadgeWarn]}>
                <Text style={[S.transitBadgeText, bus.stale && S.transitBadgeTextWarn]}>
                  {bus.stale ? 'Signal lost' : tracked.phase === 'coming' ? `${tracked.etaMin} min away` : 'In transit'}
                </Text>
              </View>
            </View>

            {/* Progress along the route */}
            <View style={S.progressBlock}>
              <View style={S.progressTrack}>
                <View style={[S.progressDone, { flex: progress }]} />
                <ArrowRightIcon color={COLORS.accent} size={20} />
                <View style={[S.progressLeft, { flex: 1 - progress }]} />
              </View>
              <Text style={S.progressSummary}>{trackedSummary(tracked, boardingStop, destinationStop)}</Text>
            </View>

            {/* Predicted arrival at every stop, updated on each GPS fix */}
            <ScrollView style={S.etaList} showsVerticalScrollIndicator={false}>
              {bus.stops.map((stop) => {
                const mine = stop.index === boardingIndex || stop.index === destinationIndex;
                return (
                  <View key={stop.index} style={[S.etaRow, mine && S.etaRowOn]}>
                    <View style={[S.etaDot, stop.status === 'passed' && S.etaDotPassed, mine && S.etaDotOn]} />
                    <Text style={[S.etaStop, stop.status === 'passed' && S.etaPassed]} numberOfLines={1}>{stop.name}</Text>
                    <Text style={[S.etaVal, stop.status === 'passed' && S.etaPassed]}>
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
        )}
      </View>
    </View>
  );
}
