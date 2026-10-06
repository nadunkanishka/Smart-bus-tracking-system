// Live route map (Android / iOS build): react-native-maps with OpenStreetMap tiles.
// Bus markers use an AnimatedRegion so they glide between GPS fixes instead of jumping.
// Source of truth: /shared/native/LiveMap.native.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, MarkerAnimated, Polyline, UrlTile } from 'react-native-maps';
import { Vehicle } from './ui';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const FALLBACK = { latitude: 6.9, longitude: 79.87, latitudeDelta: 0.12, longitudeDelta: 0.12 };

function BusMarker({ bus }) {
  const position = useRef(new AnimatedRegion({ latitude: bus.lat, longitude: bus.lng, latitudeDelta: 0, longitudeDelta: 0 })).current;
  useEffect(() => {
    position.timing({ latitude: bus.lat, longitude: bus.lng, duration: 2800, useNativeDriver: false }).start();
  }, [bus.lat, bus.lng, position]);
  return (
    <MarkerAnimated coordinate={position} anchor={{ x: 0.5, y: 0.5 }} title={bus.label || bus.id}>
      <View style={[styles.bus, bus.stale && styles.stale]}>
        <Vehicle name="bus" width={48} label="Bus" />
      </View>
    </MarkerAnimated>
  );
}

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding }) {
  const map = useRef(null);
  const line = useMemo(() => (path || []).map(([latitude, longitude]) => ({ latitude, longitude })), [path]);

  useEffect(() => {
    if (line.length > 1) {
      map.current?.fitToCoordinates(line, { edgePadding: { top: padding?.top ?? 40, bottom: padding?.bottom ?? 40, left: 32, right: 32 }, animated: true });
    }
  }, [line, padding]);

  return (
    <View style={styles.fill}>
      <MapView
        ref={map}
        style={styles.fill}
        initialRegion={FALLBACK}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        toolbarEnabled={false}
      >
        <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />
        {line.length > 1 ? <Polyline coordinates={line} strokeColor="#F26B85" strokeWidth={6} lineCap="round" lineJoin="round" /> : null}
        {(stops || []).map((s, i) => (
          <Marker key={`${s.name}-${i}`} coordinate={{ latitude: s.lat, longitude: s.lng }} title={s.name} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.stop, i === highlightStop && styles.stopOn]} />
          </Marker>
        ))}
        {(buses || []).map((bus) => <BusMarker key={bus.id} bus={bus} />)}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#EEF2F7' },
  bus: {
    width: 68, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1F3A56', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 8,
  },
  stale: { opacity: 0.55 },
  stop: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0F1419', borderWidth: 3, borderColor: '#FFFFFF' },
  stopOn: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#F26B85' },
});
