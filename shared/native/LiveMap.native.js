// Live route map (Android / iOS build), drawn by the app itself: map tiles as ordinary images, then the route line, the stops
// and the buses on top. No WebView and no Google Maps key. It fits the whole route on screen (no pan or zoom yet).
// Tiles: OpenStreetMap's own server, which asks apps to identify themselves in the User-Agent. Dark mode dims the same tiles
// over the dark background. shortcut: fine for a pilot; before heavy use switch to a tile provider with a key or host tiles.
// Source of truth: /shared/native/LiveMap.native.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Vehicle, type } from './ui';
import { COLORS } from './theme';
import { useTheme } from './themeRuntime';
import { TILE, fitView, project, tilesFor } from './mapMath';

const TILE_HEADERS = { 'User-Agent': 'SmartBusTracker/1.0 (student project)' };
const DARK_TILE_OPACITY = 0.42;
const GLIDE_MS = 2800; // a bus moves to its new position over about the time between two GPS fixes

const tileUrl = (t) => `https://tile.openstreetmap.org/${t.zoom}/${t.x}/${t.y}.png`;

function BusMarker({ bus, view }) {
  const at = project(bus.lat, bus.lng, view);
  const position = useRef(new Animated.ValueXY(at)).current;
  useEffect(() => {
    Animated.timing(position, { toValue: { x: at.x, y: at.y }, duration: GLIDE_MS, useNativeDriver: false }).start();
  }, [at.x, at.y, position]);
  return (
    <Animated.View pointerEvents="none" style={[styles.bus, bus.stale && styles.stale, { transform: position.getTranslateTransform() }]}>
      <Vehicle name="bus" marker heading={bus.heading} width={52} label="Bus" />
    </Animated.View>
  );
}

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding }) {
  const { mode } = useTheme();
  const dark = mode === 'dark';
  const [size, setSize] = useState(null);
  const top = padding?.top ?? 40;
  const bottom = padding?.bottom ?? 40;

  // The route decides the view; a route with no road line yet falls back to its stops.
  const points = useMemo(() => (path && path.length > 1 ? path : (stops || []).map((s) => [s.lat, s.lng])), [path, stops]);
  const view = useMemo(() => (size ? fitView(points, size.width, size.height, { left: 32, right: 32, top, bottom }) : null), [points, size, top, bottom]);
  const tiles = useMemo(() => (view ? tilesFor(view, size.width, size.height) : []), [view, size]);
  const line = useMemo(() => (view && path?.length > 1 ? path.map(([lat, lng]) => { const p = project(lat, lng, view); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') : ''), [view, path]);

  return (
    <View style={[styles.fill, { backgroundColor: COLORS.bg }]} onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {tiles.map((t) => (
        <Image key={t.key} source={{ uri: tileUrl(t), headers: TILE_HEADERS }} style={{ position: 'absolute', left: t.left, top: t.top, width: TILE, height: TILE, opacity: dark ? DARK_TILE_OPACITY : 1 }} />
      ))}
      {view ? (
        <Svg style={styles.fill} pointerEvents="none">
          {line ? <Polyline points={line} fill="none" stroke={COLORS.orange} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {(stops || []).map((s, i) => {
            const p = project(s.lat, s.lng, view);
            const on = i === highlightStop;
            return <Circle key={`${s.name}-${i}`} cx={p.x} cy={p.y} r={on ? 9 : 6} fill={on ? COLORS.violet : dark ? COLORS.orange : COLORS.ink} stroke={dark ? '#110C0B' : '#FFFFFF'} strokeWidth={3} />;
          })}
        </Svg>
      ) : null}
      {view ? (buses || []).map((bus) => <BusMarker key={bus.id} bus={bus} view={view} />) : null}
      <Text style={[styles.credit, { bottom: Math.max(4, bottom - 18) }]}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  bus: { position: 'absolute', left: -26, top: -26, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  stale: { opacity: 0.55 },
  credit: { ...type('caption'), position: 'absolute', left: 8, fontSize: 9, color: COLORS.muted },
});
