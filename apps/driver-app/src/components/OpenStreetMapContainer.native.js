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

export default function OpenStreetMapContainer({
  isOnDuty,
  routeName = '138',
  liveCoordinate,
  startCoordinate = ROUTE_138_START,
  endCoordinate = ROUTE_138_END,
}) {
  const activeCoordinate = liveCoordinate || DEFAULT_BUS_COORDINATE;
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
    latitude: activeCoordinate.latitude,
    longitude: activeCoordinate.longitude,
    latitudeDelta: 0.045,
    longitudeDelta: 0.045,
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
        <Marker coordinate={activeCoordinate} title="NB-4521" description={`Route ${routeName}`}>
          <View
            style={[
              styles.driverMarkerBadge,
              { backgroundColor: isOnDuty ? COLORS.signalGreen : COLORS.zinc900 },
            ]}
          >
            <View style={styles.whitePulseDot} />
            <Text style={styles.driverBadgeText}>NB-4521 {isOnDuty ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
        </Marker>
      </MapView>
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
    backgroundColor: '#FAFAFA',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  driverMarkerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  whitePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  driverBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  attribution: {
    position: 'absolute',
    right: 12,
    bottom: 120,
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
