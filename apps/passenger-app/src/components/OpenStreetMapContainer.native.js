import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import {
  fetchRoadRoute,
  ROUTE_138_END,
  ROUTE_138_FALLBACK_COORDS,
  ROUTE_138_START,
  ROUTE_138_WAYPOINTS,
} from '../utils/route138';
import { NavigationArrowIcon } from './VectorIcons';

const DEFAULT_BUS_COORDINATE = ROUTE_138_WAYPOINTS[2];
const DEFAULT_PASSENGER_COORDINATE = { latitude: 6.89, longitude: 79.875 };
const CARTO_POSITRON_TILE_URL = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png';

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
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        <UrlTile urlTemplate={CARTO_POSITRON_TILE_URL} maximumZ={19} flipY={false} />
        <Polyline coordinates={routeCoordinates} strokeColor="#18181B" strokeWidth={5} lineCap="round" lineJoin="round" />

        {/* Bus Marker (Orbix Studio 2025 black navigation disc) */}
        <Marker coordinate={activeBusCoordinate} title="Active Bus" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.busMarkerDisc}>
            <NavigationArrowIcon color="#FFFFFF" size={16} />
          </View>
        </Marker>

        {/* Destination Marker (Orbix Studio glowing coral beacon) */}
        <Marker coordinate={activePassengerCoordinate} title="Target Destination" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.destBeaconWrapper}>
            <View style={styles.destBeaconHalo2} />
            <View style={styles.destBeaconHalo1} />
            <View style={styles.destBeaconCore} />
          </View>
        </Marker>
      </MapView>
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
    backgroundColor: '#F4F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  busMarkerDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141416',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  destBeaconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destBeaconHalo2: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 91, 55, 0.2)',
  },
  destBeaconHalo1: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 91, 55, 0.3)',
  },
  destBeaconCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF5B37',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF5B37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
});
