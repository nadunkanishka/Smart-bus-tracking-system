// SmartBus shared UI kit (React Native / react-native-web). Source of truth lives in /shared/native and is
// copied to apps/*/src/shared/ui.js by `npm run sync` (so imports below are app-relative).
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, TextInput,
  View, useWindowDimensions, ScrollView, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, TYPE } from './theme';
import { useTheme } from './themeRuntime';
import { ASPECT, markerIndex, pick } from './vehicleShapes';
import { Activity, ChartColumn, Gauge, House, Navigation, Route as RouteGlyph, User, Users, Bus as BusGlyph } from 'lucide-react-native';
import { IMAGES } from './busImages';
import { MARKERS } from './busMarkers';

// Urbanist on web (same as the admin); native keeps the system font (no font-loading dependency).
// Android draws edge to edge, so the status bar and gesture bar overlap the app. iOS is handled by SafeAreaView.
const SAFE_TOP = Platform.OS === 'android' ? Math.max(24, initialWindowMetrics?.insets.top ?? 0) : 0;
const SAFE_BOTTOM = Platform.OS === 'android' ? (initialWindowMetrics?.insets.bottom ?? 0) : 0;

export const FONT = Platform.OS === 'web' ? { fontFamily: "'Urbanist', system-ui, sans-serif" } : null;
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('sb-font')) {
  const l = document.createElement('link');
  l.id = 'sb-font'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700;800&display=swap';
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

const webRing = (focused, color = COLORS.ring) =>
  (Platform.OS === 'web' && focused ? { boxShadow: `0 0 0 3px ${color}` } : null);

// ─── Vehicles ───────────────────────────────────────────────────────────────
// Clay buses: pre-rendered images chosen by vehicleShapes.pick(). status ('idle' | 'maint' | 'off') adds a
// badge on the corner; always pair it with a text label.
export function Vehicle({ name = 'bus', width = 160, livery, status, heading, running, marker, label, style }) {
  useTheme();
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
}

// The scene image is 1280 x 600 and fills the width of its panel.
export function RoadScene({ scene = 'login', label = 'A group of buses', width, style }) {
  // The box carries the shape; the image fills it (a lone image would take its pixel height instead).
  return (
    <View style={[width ? { width, height: Math.round((width * 600) / 1280) } : { width: '100%', aspectRatio: 1280 / 600 }, style]}>
      <Image accessibilityLabel={label} source={IMAGES[`scene-${scene}`] || IMAGES['scene-login']} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
}

// A small bus driving across a road line (the bus faces left). Static when reduced motion is on.
export function VehicleLoader({ name = 'bus', label = 'Loading', width = 240 }) {
  useTheme();
  const reduced = useReducedMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 2600, easing: Easing.bezier(0.45, 0, 0.55, 1), useNativeDriver: Platform.OS !== 'web' }));
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
}

// ─── Surfaces ───────────────────────────────────────────────────────────────
export function GradientCard({ tint = 'bus', style, children, id }) {
  const { mode } = useTheme();
  const hero = tint === 'hero'; // the orange card: night text, two light shapes on the right
  const [a, b] = hero ? [COLORS.heroFrom, COLORS.heroTo] : COLORS.tints[tint];
  const gid = `${id || `g-${tint}`}-${mode}`;
  return (
    <View style={[{ borderRadius: RADII.lg, overflow: 'hidden', borderWidth: hero ? 0 : 1.5, borderColor: hero ? 'transparent' : COLORS.tintLines[tint], ...SHADOWS.sm }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#${gid})`} />
        {hero ? (
          <>
            <Polygon points="66,-5 108,-5 108,105 50,105" fill={COLORS.heroShape} fillOpacity="0.5" />
            <Polygon points="84,38 108,38 108,105 70,105" fill={COLORS.heroShape} fillOpacity="0.35" />
          </>
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

export function Avatar({ label = 'P', size = 44, tone = 'soft' }) {
  useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone === 'ink' ? COLORS.ink : COLORS.primarySoft, borderWidth: tone === 'ink' ? 0 : 3, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ ...TYPE.bodyBold, ...FONT, color: tone === 'ink' ? COLORS.white : COLORS.primaryDeep, fontSize: size * 0.4, lineHeight: size * 0.5 }}>
        {String(label || 'P').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function Banner({ tone = 'danger', children }) {
  useTheme();
  const c = tone === 'success' ? [COLORS.successSoft, COLORS.success] : [COLORS.dangerSoft, COLORS.danger];
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: c[0], borderRadius: RADII.md, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
      <Text style={{ ...TYPE.smallBold, ...FONT, color: c[1] }}>{children}</Text>
    </View>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────
// Read at render time so a mode switch is picked up. Text on lime or lavender fills is always dark (onBright).
const tones = () => ({
  ink: { bg: COLORS.ink, fg: COLORS.white },
  primary: { bg: COLORS.primaryStrong, fg: COLORS.onBright },
  accent: { bg: COLORS.accent, fg: COLORS.onBright },
  orange: { bg: COLORS.orange, fg: COLORS.onBright },
  soft: { bg: COLORS.surfaceSoft, fg: COLORS.ink },
  dangerSoft: { bg: COLORS.dangerSoft, fg: COLORS.danger },
  glass: { bg: COLORS.surface, fg: COLORS.ink },
});

export function Button({ title, onPress, tone = 'primary', size = 'lg', loading, disabled, icon, style, textStyle, accessibilityLabel, full = true }) {
  useTheme();
  const t = tones()[tone];
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
  useTheme();
  const t = tones()[tone];
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

// Light / dark switch. The icon turns a quarter as it swaps (220ms, strong ease-out); still when reduced motion is on.
export function ThemeToggle({ size = 44, style }) {
  const { isDark, toggle } = useTheme();
  const reduced = useReducedMotion();
  const turn = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(turn, { toValue: isDark ? 1 : 0, duration: reduced ? 0 : 220, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [isDark, reduced, turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });
  const c = COLORS.ink;
  return (
    <IconButton label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggle} size={size} style={style}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <>
              <Circle cx="12" cy="12" r="4" />
              <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          ) : <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
        </Svg>
      </Animated.View>
    </IconButton>
  );
}

export function Chip({ label, selected, onPress, tone = 'primary', style }) {
  useTheme();
  const on = selected;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!on }}
      style={({ pressed, focused }) => [
        { minHeight: 36, paddingHorizontal: 14, borderRadius: RADII.pill, justifyContent: 'center', backgroundColor: on ? (tone === 'primary' ? COLORS.primaryStrong : COLORS.ink) : COLORS.surfaceSoft, transform: [{ scale: pressed ? 0.97 : 1 }] },
        webRing(focused),
        style,
      ]}
    >
      <Text style={{ ...TYPE.smallBold, ...FONT, color: on ? (tone === 'primary' ? COLORS.onBright : COLORS.white) : COLORS.ink }}>{label}</Text>
    </Pressable>
  );
}

// ─── Form controls ──────────────────────────────────────────────────────────
export function EyeIcon({ off, color, size = 20 }) {
  useTheme();
  color = color || COLORS.muted;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <Circle cx="12" cy="12" r="3" />
      {off ? <Path d="M3 3l18 18" /> : null}
    </Svg>
  );
}

export function TextField({ label, icon, error, hint, secure, style, inputStyle, ...input }) {
  useTheme();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={{ ...TYPE.smallBold, ...FONT, color: COLORS.ink, marginBottom: 8, marginLeft: 8 }}>{label}</Text> : null}
      <View
        style={{
          minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: RADII.sm,
          backgroundColor: COLORS.surface, borderWidth: 1.5,
          borderColor: error ? COLORS.danger : focused ? COLORS.primary : COLORS.outline,
          ...(Platform.OS === 'web' && focused ? { boxShadow: error ? `0 0 0 4px ${COLORS.dangerSoft}` : `0 0 0 4px ${COLORS.primaryLight}` } : null),
        }}
      >
        {React.isValidElement(icon) ? React.cloneElement(icon, { color: error ? COLORS.danger : COLORS.primary }) : icon}
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
  useTheme();
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={({ focused }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, flexShrink: 1 }, webRing(focused)]}>
      <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: checked ? COLORS.primaryStrong : COLORS.surfaceSoft, borderWidth: 2, borderColor: checked ? COLORS.primaryStrong : COLORS.mutedLight, alignItems: 'center', justifyContent: 'center' }}>
        {checked ? <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.onBright} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg> : null}
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
  useTheme();
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
  useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const scroller = useRef(null);
  // The form sits at the bottom of the panel: once the keyboard is up, scroll down so the fields are in view.
  useEffect(() => {
    const sub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => scroller.current?.scrollToEnd({ animated: true }));
    return () => sub.remove();
  }, []);
  const hero = (
    <View style={[{ backgroundColor: COLORS.backdrop, paddingTop: 24 + SAFE_TOP, overflow: 'hidden' }, wide && { flex: 1, justifyContent: 'space-between', padding: 48 }]}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox="0 0 400 300" preserveAspectRatio="xMaxYMid slice">
        <Path d="M230 330C240 230 310 140 430 96" fill="none" stroke={COLORS.ink} strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="5 7" />
        <Path d="M150 -20C165 70 235 118 340 104" fill="none" stroke={COLORS.ink} strokeOpacity="0.16" strokeWidth="1.2" strokeDasharray="5 7" />
        <Polygon points="350,36 356,54 374,60 356,66 350,84 344,66 326,60 344,54" fill={COLORS.accent} />
        <Polygon points="60,150 64,161 75,165 64,169 60,180 56,169 45,165 56,161" fill={COLORS.ink} fillOpacity="0.5" />
      </Svg>
      <View style={{ position: 'absolute', top: 16 + SAFE_TOP, right: wide ? 24 : 16, zIndex: 2 }}>
        <ThemeToggle />
      </View>
      <View style={[{ paddingHorizontal: 24 }, wide && { paddingHorizontal: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Vehicle name="bus" width={34} label="SmartBus logo" />
          </View>
          <Text style={{ ...TYPE.h1, ...FONT, color: COLORS.ink }}>{brand}</Text>
        </View>
        {tagline ? (
          <View style={{ alignSelf: 'flex-start', marginTop: 16, backgroundColor: COLORS.primary, borderRadius: RADII.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ ...TYPE.small, ...FONT, color: COLORS.onBright }}>{tagline}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ marginTop: wide ? 0 : 4, marginBottom: wide ? 0 : 36, paddingHorizontal: wide ? 0 : 8 }}>
        <RoadScene scene={scene} width={wide ? Math.round(width / 2) - 96 : Math.min(width, 560) - 16} />
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
  // Edge-to-edge Android ignores adjustResize, so lift the form above the keyboard ourselves.
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled={Platform.OS !== 'web'}>
    <ScrollView ref={scroller} style={{ flex: 1, backgroundColor: wide ? COLORS.surface : COLORS.backdrop }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[{ flexGrow: 1 }, wide ? { flexDirection: 'row', minHeight: 640 } : { width: '100%', maxWidth: 560, alignSelf: 'center' }]}>
        {hero}
        {panel}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Overlapping screen header: pale blue block (ink text only) with a soft light circle in the corner, plus a
// curved sheet that the screen content sits on.
export function OverlapHeader({ children, minHeight = 148 }) {
  useTheme();
  return (
    <View style={{ backgroundColor: COLORS.backdrop, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, minHeight, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.surfaceSoft, opacity: 0.55 }} />
      {children}
    </View>
  );
}
export function OverlapSheet({ children, style }) {
  useTheme();
  return <View style={[{ backgroundColor: COLORS.bg, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, marginTop: -28, paddingHorizontal: 20, paddingTop: 24 }, style]}>{children}</View>;
}

// Navigation icon: Lucide outline. The current item sits on an orange circle, so it is drawn in night; idle items are muted.
const NAV_GLYPHS = { home: House, arrow: Navigation, route: RouteGlyph, user: User, gauge: Gauge, people: Users, bus: BusGlyph, pulse: Activity, chart: ChartColumn };
export function NavIcon({ name, active, size = 24 }) {
  useTheme();
  const Glyph = NAV_GLYPHS[name] || House;
  return <Glyph size={size} color={active ? COLORS.onBright : COLORS.muted} strokeWidth={active ? 2 : 1.75} />;
}

// Bottom navigation: a white pill docked in the screen's own footer (content never slides behind it). Every item
// shows its label; the current item sits in an ink circle with a white icon. items: [{ id, label, icon(active) }]
export function FloatingDock({ items, active, onChange }) {
  useTheme();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: (Platform.OS === 'ios' ? 28 : 14) + SAFE_BOTTOM, backgroundColor: COLORS.bg, ...SHADOWS.sm, shadowOffset: { width: 0, height: -6 } }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADII.pill, padding: 6, width: '100%', maxWidth: 420, justifyContent: 'space-between', ...SHADOWS.md }}>
        {items.map((item) => {
          const on = active === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              style={({ pressed, focused }) => [{ flex: 1, minHeight: 64, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center', gap: 2, transform: [{ scale: pressed ? 0.94 : 1 }] }, webRing(focused)]}
            >
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: on ? COLORS.orange : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon(on)}
              </View>
              <Text style={{ ...TYPE.caption, ...FONT, color: on ? COLORS.ink : COLORS.muted }} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Stat card: white card with a round tinted icon, a muted label and a bold value (the admin's KPI card in small).
// icon: (color) => element. tone: 'orange' (peach) | 'purple' (blue); the names are kept for existing callers.
export function NotchStat({ label, value, tone = 'orange', icon, valueColor, style }) {
  useTheme();
  const [wash, ink] = tone === 'purple' ? [COLORS.primaryLight, COLORS.primaryDeep] : [COLORS.accentSoft, COLORS.accentText];
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[{ flex: 1, minHeight: 100, backgroundColor: COLORS.surface, borderRadius: RADII.md, padding: 12, gap: 4, ...SHADOWS.sm }, style]}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: wash, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>{icon ? icon(ink) : null}</View>
      <Text style={{ ...TYPE.caption, ...FONT, color: COLORS.muted }} numberOfLines={1}>{label}</Text>
      <Text style={{ ...TYPE.bodyBold, ...FONT, color: valueColor || COLORS.ink }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

// Bottom sheet card used by modals.
export function Sheet({ children, style }) {
  useTheme();
  return <View style={[{ backgroundColor: COLORS.surface, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, padding: 24, maxHeight: '88%', width: '100%', maxWidth: 560, alignSelf: 'center', ...SHADOWS.lg }, style]}>{children}</View>;
}

export function Toast({ message }) {
  useTheme();
  if (!message) return null;
  return (
    <View style={{ position: 'absolute', top: 56, left: 20, right: 20, zIndex: 999, alignItems: 'center' }} pointerEvents="none" accessibilityLiveRegion="polite">
      <View style={{ backgroundColor: COLORS.ink, borderRadius: RADII.pill, paddingHorizontal: 20, paddingVertical: 12, maxWidth: 520, ...SHADOWS.md }}>
        <Text style={{ ...TYPE.smallBold, ...FONT, color: COLORS.white, textAlign: 'center' }}>{message}</Text>
      </View>
    </View>
  );
}
