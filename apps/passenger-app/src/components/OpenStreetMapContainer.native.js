import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import {
  fetchRoadRoute,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  ROUTE_138_END,
  ROUTE_138_FALLBACK_COORDS,
  ROUTE_138_START,
  ROUTE_138_WAYPOINTS,
} from '../utils/route138';

const DEFAULT_BUS_COORDINATE = ROUTE_138_WAYPOINTS[2];
const DEFAULT_PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };

export default function OpenStreetMapContainer({
  busLocationName = 'High Level Road Stop',
  etaMins = 4,
  busCoordinate,
  passengerCoordinate,
  startCoordinate = ROUTE_138_START,
  endCoordinate = ROUTE_138_END,
}) {
  const activeBusCoordinate = busCoordinate || DEFAULT_BUS_COORDINATE;
  const activePassengerCoordinate = passengerCoordinate || DEFAULT_PASSENGER_COORDINATE;
  const [routeCoordinates, setRouteCoordinates] = useState(ROUTE_138_FALLBACK_COORDS);

  useEffect(() => {
    let isMounted = true;

    fetchRoadRoute({
      startCoordinate,
      endCoordinate,
      waypoints: ROUTE_138_WAYPOINTS,
    })
      .then((coordinates) => {
        if (isMounted) {
          setRouteCoordinates(coordinates);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteCoordinates(ROUTE_138_FALLBACK_COORDS);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [startCoordinate, endCoordinate]);

  const region = {
    latitude: (activeBusCoordinate.latitude + activePassengerCoordinate.latitude) / 2,
    longitude: (activeBusCoordinate.longitude + activePassengerCoordinate.longitude) / 2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
        <Polyline coordinates={routeCoordinates} strokeColor={COLORS.signalBlue} strokeWidth={6} />

        <Marker coordinate={activeBusCoordinate} title="NB-4521" description={`${etaMins} min away`}>
          <View style={styles.busMarkerBadge}>
            <View style={styles.markerDot} />
            <Text style={styles.busBadgeText}>NB-4521 {busLocationName}</Text>
          </View>
        </Marker>

        <Marker coordinate={activePassengerCoordinate} title="Your stop">
          <View style={styles.stopMarker}>
            <View style={styles.stopMarkerDot} />
            <Text style={styles.stopMarkerText}>Your Stop</Text>
          </View>
        </Marker>
      </MapView>

      <View pointerEvents="none" style={styles.overlayBadge}>
        <Text style={styles.overlayTitle}>Live bus</Text>
        <Text style={styles.overlayValue}>{etaMins} min away</Text>
      </View>

      <View pointerEvents="none" style={styles.attribution}>
        <Text style={styles.attributionText}>{OSM_ATTRIBUTION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#F4F7FB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  busMarkerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.signalGreen,
    marginRight: 8,
  },
  busBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  stopMarker: {
    alignItems: 'center',
  },
  stopMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.signalBlue,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  stopMarkerText: {
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    color: COLORS.zinc900,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  overlayBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlayTitle: {
    color: COLORS.zinc500,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overlayValue: {
    color: COLORS.zinc900,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  attribution: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attributionText: {
    color: COLORS.zinc600,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
