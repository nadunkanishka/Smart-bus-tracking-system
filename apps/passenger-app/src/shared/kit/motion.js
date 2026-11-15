// SmartBus UI kit: Animated pieces: counters, gauges, toasts, sheets and screen transitions.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, RADII, SHADOWS, TYPE } from '../theme';
import { EASE_DRAWER, EASE_OUT, FONT, native, themed, useReducedMotion } from './core';

// ─── Animated pieces ─────────────────────────────────────────────────────────
// A number that counts up to its value (700ms, strong ease-out). Shows the final number at once with reduced motion.
export const CountUp = themed(function CountUp({ value, duration = 700, suffix = '', style }) {
  const reduced = useReducedMotion();
  const target = Number(value);
  const v = useRef(new Animated.Value(0)).current;
  const [text, setText] = useState(reduced ? String(target) : '0');
  useEffect(() => {
    if (Number.isNaN(target)) return undefined;
    const id = v.addListener(({ value: x }) => setText(String(Math.round(x))));
    if (reduced) { v.setValue(target); } else {
      Animated.timing(v, { toValue: target, duration, easing: EASE_OUT, useNativeDriver: false }).start();
    }
    return () => v.removeListener(id);
  }, [target, duration, reduced, v]);
  return <Text style={style}>{Number.isNaN(target) ? '—' : `${text}${suffix}`}</Text>;
});

// A ring that fills to value/max (600ms ease-out), like the dashboard's fleet donut. Children sit in the middle.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const RingGauge = themed(function RingGauge({ value = 0, max = 100, size = 150, stroke = 12, color, track, children }) {
  const reduced = useReducedMotion();
  const frac = Math.max(0, Math.min(1, Number(value) / max || 0));
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: frac, duration: reduced ? 0 : 600, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [frac, reduced, v]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track || COLORS.line} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color || COLORS.orange} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })} />
      </Svg>
      {children}
    </View>
  );
});

// A status dot with a soft ring that expands and fades (1.8s loop). Still with reduced motion.
export const LiveDot = themed(function LiveDot({ color, size = 8 }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  const c = color || COLORS.green;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {reduced ? null : <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }] }} />}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c }} />
    </View>
  );
});

// A thin progress bar that eases to its value (500ms) instead of jumping.
export const ProgressTrack = themed(function ProgressTrack({ value = 0, height = 6, color, track, style }) {
  const reduced = useReducedMotion();
  const frac = Math.max(0, Math.min(1, Number(value) || 0));
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: frac, duration: reduced ? 0 : 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [frac, reduced, v]);
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: track || COLORS.line, overflow: 'hidden' }, style]}>
      <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: color || COLORS.orange, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
});

// Bottom sheet card used by modals.
export const Sheet = themed(function Sheet({ children, style }) {
  return <View style={[{ backgroundColor: COLORS.surface, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, padding: 24, maxHeight: '88%', width: '100%', maxWidth: 560, alignSelf: 'center', ...SHADOWS.lg }, style]}>{children}</View>;
});

// Toast: slides down 10px and fades in (220ms strong ease-out); leaves faster (160ms), as the system responding.
export const Toast = themed(function Toast({ message }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(message || null);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (message) {
      setShown(message);
      Animated.timing(v, { toValue: 1, duration: reduced ? 0 : 220, easing: EASE_OUT, useNativeDriver: native }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: reduced ? 0 : 160, easing: EASE_OUT, useNativeDriver: native }).start(({ finished }) => { if (finished) setShown(null); });
    }
  }, [message, reduced, v]);
  if (!shown) return null;
  return (
    <Animated.View
      style={{ position: 'absolute', top: 56, left: 20, right: 20, zIndex: 999, alignItems: 'center', opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <View style={{ backgroundColor: COLORS.ink, borderRadius: RADII.pill, paddingHorizontal: 20, paddingVertical: 12, maxWidth: 520, ...SHADOWS.md }}>
        <Text style={{ ...TYPE.smallBold, ...FONT, color: COLORS.white, textAlign: 'center' }}>{shown}</Text>
      </View>
    </Animated.View>
  );
});

// A tab's screen arrives with a short fade and 8px rise (180ms). Tabs are used often, so it stays small. Key it by tab.
export const ScreenFade = themed(function ScreenFade({ children, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: reduced ? 0 : 180, easing: EASE_OUT, useNativeDriver: native }).start();
  }, [reduced, v]);
  return (
    <Animated.View style={[{ flex: 1, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
});

// List item entrance: fades up 10px, staggered 40ms per item (the first six only), once when it mounts.
export const Reveal = themed(function Reveal({ index = 0, children, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: reduced ? 0 : 260, delay: reduced ? 0 : Math.min(index, 6) * 40, easing: EASE_OUT, useNativeDriver: native }).start();
  }, [index, reduced, v]);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }, style]}>{children}</Animated.View>;
});

// Bottom sheet host. The backdrop fades while the sheet itself rises (the stock "slide" animation drags the backdrop
// up with it). Opens in 280ms on the drawer curve, closes faster (180ms).
export const SheetModal = themed(function SheetModal({ visible, onClose, children }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: reduced ? 0 : 280, easing: EASE_DRAWER, useNativeDriver: native }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: reduced ? 0 : 180, easing: EASE_OUT, useNativeDriver: native }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [visible, reduced, v]);
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: v, backgroundColor: COLORS.scrim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [64, 0] }) }] }}>{children}</Animated.View>
      </View>
    </Modal>
  );
});
