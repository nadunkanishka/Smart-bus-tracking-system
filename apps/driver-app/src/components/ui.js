// SmartBus shared UI kit (React Native / react-native-web). Source of truth lives in /shared/native and is
// copied to apps/*/src/components/ui.js by `npm run sync` (so imports below are app-relative).
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput,
  View, useWindowDimensions, ScrollView,
} from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { COLORS, RADII, SHADOWS, TYPE } from '../constants/theme';
import { PALETTE, SCENES, VEHICLES, resolve } from './vehicleShapes';

// Plus Jakarta Sans on web; native keeps the system font (no font-loading dependency).
export const FONT = Platform.OS === 'web' ? { fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" } : null;
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('sb-font')) {
  const l = document.createElement('link');
  l.id = 'sb-font'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
  document.head.appendChild(l);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let on = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => on && setReduced(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => { on = false; sub?.remove?.(); };
  }, []);
  return reduced;
}

const webRing = (focused, color = 'rgba(31,120,168,0.55)') =>
  (Platform.OS === 'web' && focused ? { boxShadow: `0 0 0 3px ${color}` } : null);

// ─── Vehicles ───────────────────────────────────────────────────────────────
const SHAPE = { rect: Rect, circle: Circle, path: Path, ellipse: Ellipse };

export function VehicleShapes({ name, body }) {
  const v = VEHICLES[name];
  return v.shapes.map(([t, a, c], i) => {
    const Tag = SHAPE[t];
    return <Tag key={i} {...a} fill={resolve(c, body || v.body)} />;
  });
}

export function Vehicle({ name = 'bus', width = 160, body, label, style }) {
  const v = VEHICLES[name];
  return (
    <View style={style} accessibilityRole="image" accessibilityLabel={label || v.label}>
      <Svg width={width} height={width / 2} viewBox="0 0 240 120">
        <VehicleShapes name={name} body={body} />
      </Svg>
    </View>
  );
}

const SKYLINE = [[10, 88, 26], [44, 70, 44], [92, 96, 18], [250, 84, 30], [290, 64, 40], [326, 92, 22]];

export function RoadScene({ scene = 'login', height = 200, label = 'Vehicles driving along a road' }) {
  return (
    <View accessibilityRole="image" accessibilityLabel={label}>
    <Svg width="100%" height={height} viewBox="0 0 360 200" preserveAspectRatio="xMidYMax meet">
      <Ellipse cx="60" cy="38" rx="30" ry="10" fill="#fff" opacity="0.22" />
      <Ellipse cx="86" cy="32" rx="22" ry="9" fill="#fff" opacity="0.22" />
      <Ellipse cx="290" cy="52" rx="34" ry="10" fill="#fff" opacity="0.18" />
      {SKYLINE.map(([x, y, w], i) => <Rect key={i} x={x} y={y} width={w} height={170 - y} rx="4" fill={PALETTE.PD} opacity="0.28" />)}
      <Rect x="0" y="168" width="360" height="32" fill={PALETTE.PD} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <Rect key={i} x={14 + i * 52} y="183" width="26" height="4" rx="2" fill="#fff" opacity="0.7" />)}
      {SCENES[scene].map(([n, x, y, s, body], i) => (
        <G key={i} transform={`translate(${x} ${y}) scale(${s})`}><VehicleShapes name={n} body={body} /></G>
      ))}
    </Svg>
    </View>
  );
}

// A small vehicle gently driving across a road. Static when reduced motion is on.
export function VehicleLoader({ name = 'bus', label = 'Loading', width = 240 }) {
  const reduced = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 2600, easing: Easing.bezier(0.45, 0, 0.55, 1), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [reduced, x]);
  const car = 72;
  return (
    <View style={{ width, height: 52, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityLabel={label}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ translateX: reduced ? (width - car) / 2 : x.interpolate({ inputRange: [0, 1], outputRange: [-car, width] }) }] }}>
        <Vehicle name={name} width={car} />
      </Animated.View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primaryDeep, opacity: 0.25 }} />
    </View>
  );
}

// ─── Surfaces ───────────────────────────────────────────────────────────────
export function GradientCard({ tint = 'bus', style, children, id }) {
  const [a, b] = COLORS.tints[tint];
  const gid = id || `g-${tint}`;
  return (
    <View style={[{ borderRadius: RADII.lg, overflow: 'hidden', ...SHADOWS.sm }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gid})`} />
      </Svg>
      {children}
    </View>
  );
}

export function Avatar({ label = 'P', size = 44, tone = 'soft' }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone === 'ink' ? COLORS.ink : COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ ...TYPE.bodyBold, ...FONT, color: tone === 'ink' ? COLORS.white : COLORS.primaryDeep, fontSize: size * 0.4, lineHeight: size * 0.5 }}>
        {String(label || 'P').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function Banner({ tone = 'danger', children }) {
  const c = tone === 'success' ? [COLORS.successSoft, COLORS.success] : [COLORS.dangerSoft, COLORS.danger];
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: c[0], borderRadius: RADII.md, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
      <Text style={{ ...TYPE.smallBold, ...FONT, color: c[1] }}>{children}</Text>
    </View>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────
const TONES = {
  ink: { bg: COLORS.ink, fg: COLORS.white },
  primary: { bg: COLORS.primaryStrong, fg: COLORS.white },
  accent: { bg: COLORS.accent, fg: COLORS.ink },
  soft: { bg: COLORS.surfaceSoft, fg: COLORS.ink },
  dangerSoft: { bg: COLORS.dangerSoft, fg: COLORS.danger },
  glass: { bg: 'rgba(255,255,255,0.92)', fg: COLORS.ink },
};

export function Button({ title, onPress, tone = 'ink', size = 'lg', loading, disabled, icon, style, textStyle, accessibilityLabel, full = true }) {
  const t = TONES[tone];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed, hovered, focused }) => [
        {
          minHeight: size === 'lg' ? 52 : 44, paddingHorizontal: size === 'lg' ? 24 : 18, borderRadius: RADII.pill,
          backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          alignSelf: full ? 'stretch' : 'flex-start', opacity: off ? 0.55 : hovered ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        webRing(focused),
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={t.fg} size="small" /> : (
        <>
          {icon}
          <Text style={[{ ...TYPE.bodyBold, ...FONT, color: t.fg }, textStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

// Round icon button (≥44px target) — bell, close, call, message.
export function IconButton({ children, onPress, label, tone = 'glass', size = 44, style }) {
  const t = TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed, focused }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }], ...SHADOWS.sm },
        webRing(focused),
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone = 'primary', style }) {
  const on = selected;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!on }}
      style={({ pressed, focused }) => [
        { minHeight: 36, paddingHorizontal: 14, borderRadius: RADII.pill, justifyContent: 'center', backgroundColor: on ? (tone === 'ink' ? COLORS.ink : COLORS.primaryStrong) : COLORS.surfaceSoft, transform: [{ scale: pressed ? 0.97 : 1 }] },
        webRing(focused),
        style,
      ]}
    >
      <Text style={{ ...TYPE.smallBold, ...FONT, color: on ? COLORS.white : COLORS.ink }}>{label}</Text>
    </Pressable>
  );
}

// ─── Form controls ──────────────────────────────────────────────────────────
export function EyeIcon({ off, color = COLORS.muted, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <Circle cx="12" cy="12" r="3" />
      {off ? <Path d="M3 3l18 18" /> : null}
    </Svg>
  );
}

export function TextField({ label, icon, error, hint, secure, style, inputStyle, ...input }) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={{ ...TYPE.smallBold, ...FONT, color: COLORS.ink, marginBottom: 8 }}>{label}</Text> : null}
      <View
        style={{
          minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: RADII.md,
          backgroundColor: COLORS.surfaceSoft, borderWidth: 2,
          borderColor: error ? COLORS.danger : focused ? COLORS.primaryStrong : 'transparent',
        }}
      >
        {icon}
        <TextInput
          {...input}
          accessibilityLabel={input.accessibilityLabel || label}
          secureTextEntry={secure && !shown}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
          placeholderTextColor={COLORS.mutedLight}
          style={[{ flex: 1, ...TYPE.body, ...FONT, color: COLORS.ink, paddingVertical: 12, minHeight: 48 }, Platform.OS === 'web' ? { outlineStyle: 'none' } : null, inputStyle]}
        />
        {secure ? (
          <Pressable onPress={() => setShown((s) => !s)} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'} hitSlop={12} style={{ width: 28, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <EyeIcon off={shown} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={{ ...TYPE.small, ...FONT, color: COLORS.danger, marginTop: 6 }}>{error}</Text>
        : hint ? <Text style={{ ...TYPE.small, ...FONT, color: COLORS.muted, marginTop: 6 }}>{hint}</Text> : null}
    </View>
  );
}

export function Checkbox({ checked, onChange, children }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={({ focused }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, flexShrink: 1 }, webRing(focused)]}>
      <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: checked ? COLORS.primaryStrong : COLORS.surfaceSoft, borderWidth: 2, borderColor: checked ? COLORS.primaryStrong : COLORS.mutedLight, alignItems: 'center', justifyContent: 'center' }}>
        {checked ? <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg> : null}
      </View>
      <Text style={{ ...TYPE.small, ...FONT, color: COLORS.ink, flexShrink: 1 }}>{children}</Text>
    </Pressable>
  );
}

export function passwordStrength(pw = '') {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return { score: pw ? Math.max(1, s) : 0, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][pw ? Math.max(1, s) : 0] };
}

export function StrengthMeter({ password }) {
  const { score, label } = passwordStrength(password);
  if (!score) return null;
  const color = score <= 1 ? COLORS.danger : score === 2 ? COLORS.warning : COLORS.success;
  return (
    <View style={{ marginTop: -6, marginBottom: 16 }} accessibilityLabel={`Password strength: ${label}`}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4].map((i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= score ? color : COLORS.line }} />)}
      </View>
      <Text style={{ ...TYPE.caption, ...FONT, color, marginTop: 6 }}>{label} password</Text>
    </View>
  );
}

// ─── Auth layout (hero + curved white panel; split screen on desktop) ───────
export function AuthLayout({ scene = 'login', brand = 'SmartBus', tagline, title, subtitle, children, footer }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const hero = (
    <View style={[{ backgroundColor: COLORS.primary, paddingTop: 24, overflow: 'hidden' }, wide && { flex: 1, justifyContent: 'space-between', padding: 48 }]}>
      <View style={[{ paddingHorizontal: 24 }, wide && { paddingHorizontal: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
            <Vehicle name="bus" width={34} label="SmartBus logo" />
          </View>
          <Text style={{ ...TYPE.h1, ...FONT, color: COLORS.white }}>{brand}</Text>
        </View>
        {tagline ? (
          <View style={{ alignSelf: 'flex-start', marginTop: 16, backgroundColor: COLORS.primaryDeep, borderRadius: RADII.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ ...TYPE.small, ...FONT, color: COLORS.white }}>{tagline}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ marginTop: 8, marginBottom: wide ? 0 : 28 }}>
        <RoadScene scene={scene} height={wide ? 320 : 190} />
      </View>
    </View>
  );
  const panel = (
    <View
      style={[
        { backgroundColor: COLORS.surface, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, marginTop: -28, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, flexGrow: 1 },
        wide && { marginTop: 0, borderRadius: 0, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 48 },
      ]}
    >
      <View style={wide ? { width: '100%', maxWidth: 420 } : null}>
        <Text style={{ ...TYPE.display, ...FONT, color: COLORS.ink }}>{title}</Text>
        {subtitle ? <Text style={{ ...TYPE.body, ...FONT, color: COLORS.muted, marginTop: 4, marginBottom: 24 }}>{subtitle}</Text> : null}
        {children}
        {footer}
      </View>
    </View>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: wide ? COLORS.surface : COLORS.primary }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[{ flexGrow: 1 }, wide ? { flexDirection: 'row', minHeight: 640 } : { width: '100%', maxWidth: 560, alignSelf: 'center' }]}>
        {hero}
        {panel}
      </View>
    </ScrollView>
  );
}

// Overlapping screen header: coloured block + curved sheet that the screen content sits on.
export function OverlapHeader({ children, minHeight = 148 }) {
  return <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, minHeight, overflow: 'hidden' }}>{children}</View>;
}
export function OverlapSheet({ children, style }) {
  return <View style={[{ backgroundColor: COLORS.bg, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, marginTop: -28, paddingHorizontal: 20, paddingTop: 24 }, style]}>{children}</View>;
}

// Floating dark pill navigation with a coral active circle (Reference 1). items: [{id,label,icon(active)}]
export function FloatingDock({ items, active, onChange }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: Platform.OS === 'ios' ? 24 : 16, alignItems: 'center', paddingHorizontal: 20 }} pointerEvents="box-none">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.ink, borderRadius: RADII.pill, padding: 8, width: '100%', maxWidth: 420, justifyContent: 'space-between', ...SHADOWS.lg }}>
        {items.map((item) => {
          const on = active === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              style={({ pressed, focused }) => [{ flex: 1, minHeight: 48, borderRadius: RADII.pill, backgroundColor: on ? COLORS.accent : 'transparent', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.96 : 1 }] }, webRing(focused, 'rgba(255,255,255,0.7)')]}
            >
              {item.icon(on)}
              <Text style={{ ...TYPE.caption, ...FONT, marginTop: 2, color: on ? COLORS.ink : '#C9D3DD' }} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Bottom sheet card used by modals.
export function Sheet({ children, style }) {
  return <View style={[{ backgroundColor: COLORS.surface, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, padding: 24, maxHeight: '88%', width: '100%', maxWidth: 560, alignSelf: 'center', ...SHADOWS.lg }, style]}>{children}</View>;
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <View style={{ position: 'absolute', top: 56, left: 20, right: 20, zIndex: 999, alignItems: 'center' }} pointerEvents="none" accessibilityLiveRegion="polite">
      <View style={{ backgroundColor: COLORS.ink, borderRadius: RADII.pill, paddingHorizontal: 20, paddingVertical: 12, maxWidth: 520, ...SHADOWS.md }}>
        <Text style={{ ...TYPE.smallBold, ...FONT, color: COLORS.white, textAlign: 'center' }}>{message}</Text>
      </View>
    </View>
  );
}
