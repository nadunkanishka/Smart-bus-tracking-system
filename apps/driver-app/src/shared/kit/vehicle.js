// SmartBus UI kit: The clay bus images: Vehicle, RoadScene, VehicleLoader.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import { ASPECT, markerIndex, pick } from '../vehicleShapes';
import { IMAGES } from '../busImages';
import { MARKERS } from '../busMarkers';
import { native, themed, useReducedMotion } from './core';

// ─── Vehicles ───────────────────────────────────────────────────────────────
// Clay buses: pre-rendered images chosen by vehicleShapes.pick(). status ('idle' | 'maint' | 'off') adds a
// badge on the corner; always pair it with a text label.
export const Vehicle = themed(function Vehicle({ name = 'bus', width = 160, livery, status, heading, running, marker, label, style }) {
  if (marker) return <Image accessibilityLabel={label || 'Bus'} source={{ uri: MARKERS[markerIndex(heading)] }} style={[{ width, height: width }, style]} />;
  const { key, label: auto, badge } = pick(name, { livery, status, running });
  const size = Math.max(16, Math.round(width * 0.2));
  return (
    <View style={style} accessibilityRole="image" accessibilityLabel={label || auto}>
      <Image source={IMAGES[key]} style={{ width, height: Math.round(width * ASPECT) }} resizeMode="contain" />
      {badge ? (
        <View style={{ position: 'absolute', top: 0, right: Math.round(width * 0.14), width: size, height: size, borderRadius: size / 2, backgroundColor: badge.bg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm }}>
          <Text style={{ color: badge.fg, fontWeight: '800', fontSize: Math.round(size * 0.68), lineHeight: size }}>{badge.glyph}</Text>
        </View>
      ) : null}
    </View>
  );
});

// The scene image is 1280 x 600 and fills the width of its panel.
export const RoadScene = themed(function RoadScene({ scene = 'login', label = 'A group of buses', width, style }) {
  // The box carries the shape; the image fills it (a lone image would take its pixel height instead).
  return (
    <View style={[width ? { width, height: Math.round((width * 600) / 1280) } : { width: '100%', aspectRatio: 1280 / 600 }, style]}>
      <Image accessibilityLabel={label} source={IMAGES[`scene-${scene}`] || IMAGES['scene-login']} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
});

// A small bus driving across a road line (the bus faces left). Static when reduced motion is on.
export const VehicleLoader = themed(function VehicleLoader({ name = 'bus', label = 'Loading', width = 240 }) {
  const reduced = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 2600, easing: Easing.bezier(0.45, 0, 0.55, 1), useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [reduced, x]);
  const car = 92;
  const height = Math.round(car * ASPECT);
  return (
    <View style={{ width, height, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityLabel={label}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: Math.round(height * 0.16), height: 4, borderRadius: 2, backgroundColor: COLORS.primaryDeep, opacity: 0.25 }} />
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX: reduced ? (width - car) / 2 : x.interpolate({ inputRange: [0, 1], outputRange: [width, -car] }) }] }}>
        <Vehicle name={name} width={car} running />
      </Animated.View>
    </View>
  );
});
