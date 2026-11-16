// Live route map (Android / iOS build), drawn by the app itself: map tiles as ordinary images, then the route line, the stops
// and the buses on top. No WebView and no Google Maps key. The route is fitted on screen to start with; one finger moves the map,
// two fingers pinch to zoom, the + and - buttons zoom, Bus centres on the tracked bus and Fit brings the whole route back.
// Tiles: Esri's light and dark gray basemaps, made for drawing routes on top of, free without a key (OpenStreetMap's own tile
// server blocks apps that do not send a browser-like request, and an Android image request cannot).
// shortcut: Esri's free use is for development and pilots with the credit shown; for a launch use a provider with a key.
// Source of truth: /shared/native/LiveMap.native.js (copied into each app by `node shared/sync.js`).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Vehicle, type } from './ui';
import { COLORS, RADII } from './theme';
import { useTheme } from './themeRuntime';
import { fitView, moveView, project, tilesFor } from './mapMath';

const GLIDE_MS = 2800; // a bus moves to its new position over about the time between two GPS fixes
const STEP_ZOOM = 2; // one tap on + or - changes the scale by this factor

const tileUrl = (t, dark) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_Base/MapServer/tile/${t.zoom}/${t.y}/${t.x}`;
const middle = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// A bus glides from where it was to where the latest fix puts it; moving the map only moves the marker, it does not animate it.
function BusMarker({ bus, view }) {
  const [at, setAt] = useState({ lat: bus.lat, lng: bus.lng });
  const shown = useRef(at);
  useEffect(() => {
    const from = shown.current;
    const t = new Animated.Value(0);
    const id = t.addListener(({ value }) => {
      shown.current = { lat: from.lat + (bus.lat - from.lat) * value, lng: from.lng + (bus.lng - from.lng) * value };
      setAt(shown.current);
    });
    const run = Animated.timing(t, { toValue: 1, duration: GLIDE_MS, useNativeDriver: false });
    run.start();
    return () => { run.stop(); t.removeListener(id); };
  }, [bus.lat, bus.lng]);
  const p = project(at.lat, at.lng, view);
  return (
    <View pointerEvents="none" style={[styles.bus, bus.stale && styles.stale, { left: p.x - 26, top: p.y - 26 }]}>
      <Vehicle name="bus" marker heading={bus.heading} width={52} label="Bus" />
    </View>
  );
}

function MapButton({ label, text, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

export default function LiveMap({ path, stops, buses, highlightStop = -1, padding, focus = null }) {
  const { mode } = useTheme();
  const dark = mode === 'dark';
  const box = useRef(null);
  const page = useRef({ x: 0, y: 0 }); // where the map sits on the screen, to turn touch positions into map positions
  const [size, setSize] = useState(null);
  const [camera, setCamera] = useState(null); // null: the route fitted on screen; otherwise where the passenger moved the map
  const top = padding?.top ?? 40;
  const bottom = padding?.bottom ?? 40;

  // The route decides the first view; a route with no road line yet falls back to its stops.
  const points = useMemo(() => (path && path.length > 1 ? path : (stops || []).map((s) => [s.lat, s.lng])), [path, stops]);
  const routeKey = `${points.length}:${points[0]}:${points[points.length - 1]}`;
  const fitted = useMemo(() => (size ? fitView(points, size.width, size.height, { left: 32, right: 32, top, bottom }) : null), [points, size, top, bottom]);
  useEffect(() => setCamera(null), [routeKey]); // another route: start from its fitted view again
  const view = camera || fitted;
  const latest = useRef(view);
  latest.current = view;

  const tiles = useMemo(() => (view ? tilesFor(view, size.width, size.height) : []), [view, size]);
  const line = useMemo(() => (view && path?.length > 1 ? path.map(([lat, lng]) => { const p = project(lat, lng, view); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') : ''), [view, path]);

  // One finger moves the map, two fingers move and pinch it. The gesture is measured from the view and touches at its start
  // (or when a finger is added or lifted), so the map point under the fingers stays under the fingers.
  const drag = useRef({ base: null, count: 0 }).current;
  const responder = useMemo(() => {
    const ends = () => { drag.base = null; };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // a map inside a scrolling page keeps the gesture
      onPanResponderGrant: () => { box.current?.measureInWindow((x, y) => { page.current = { x, y }; }); },
      onPanResponderMove: (e) => {
        const touches = [...e.nativeEvent.touches].map((t) => ({ x: t.pageX - page.current.x, y: t.pageY - page.current.y }));
        if (!touches.length || !latest.current) return;
        const centre = touches.length > 1 ? middle(touches[0], touches[1]) : touches[0];
        const spread = touches.length > 1 ? Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y) : 0;
        if (!drag.base || drag.count !== touches.length) {
          drag.base = { view: latest.current, centre, spread };
          drag.count = touches.length;
          return;
        }
        const scale = spread > 0 && drag.base.spread > 0 ? spread / drag.base.spread : 1;
        setCamera(moveView(drag.base.view, drag.base.centre, centre, scale));
      },
      onPanResponderRelease: ends,
      onPanResponderTerminate: ends,
    });
  }, [drag]);

  // The middle of the part of the map that no card covers.
  const centre = size ? { x: size.width / 2, y: (top + size.height - bottom) / 2 } : null;
  const zoomBy = (factor) => {
    if (!latest.current || !centre) return;
    setCamera(moveView(latest.current, centre, centre, factor));
  };
  // Moves the map so `focus` (the tracked bus: { lat, lng }) sits in the middle of the free part, keeping the zoom.
  const showFocus = () => {
    if (!latest.current || !centre || !focus) return;
    setCamera(moveView(latest.current, project(focus.lat, focus.lng, latest.current), centre));
  };

  return (
    <View
      ref={box}
      style={[styles.fill, { backgroundColor: COLORS.bg }]}
      onLayout={(e) => { setSize(e.nativeEvent.layout); box.current?.measureInWindow((x, y) => { page.current = { x, y }; }); }}
      {...responder.panHandlers}
    >
      {tiles.map((t) => (
        <Image key={t.key} source={{ uri: tileUrl(t, dark) }} style={{ position: 'absolute', left: t.left, top: t.top, width: t.size, height: t.size }} />
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
      <View style={[styles.controls, { top: top + 76 }]}>
        <MapButton label="Zoom in" text="+" onPress={() => zoomBy(STEP_ZOOM)} />
        <MapButton label="Zoom out" text="−" onPress={() => zoomBy(1 / STEP_ZOOM)} />
        {focus ? <MapButton label="Show the bus" text="Bus" onPress={showFocus} /> : null}
        {camera ? <MapButton label="Show the whole route" text="Fit" onPress={() => setCamera(null)} /> : null}
      </View>
      <Text style={[styles.credit, { bottom: Math.max(4, bottom - 18) }]}>Esri, HERE, Garmin, © OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  bus: { position: 'absolute', width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  stale: { opacity: 0.55 },
  credit: { ...type('caption'), position: 'absolute', left: 8, fontSize: 9, color: COLORS.muted },
  controls: { position: 'absolute', right: 12, gap: 8 },
  button: { width: 44, height: 44, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine },
  pressed: { opacity: 0.7 },
  buttonText: { ...type('bodyBold'), color: COLORS.ink },
});
