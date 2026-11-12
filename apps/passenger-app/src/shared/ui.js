// SmartBus shared UI kit (React Native / react-native-web). Source of truth lives in /shared/native and is
// copied to apps/*/src/shared/ui.js by `npm run sync` (so imports below are app-relative).
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput,
  View, useWindowDimensions, ScrollView, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from './theme';
import { useTheme } from './themeRuntime';
import { ASPECT, markerIndex, pick } from './vehicleShapes';
import { Activity, ChartColumn, ChevronRight, Gauge, House, Navigation, Route as RouteGlyph, User, Users, Bus as BusGlyph } from 'lucide-react-native';
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

// Press feel shared by every tappable thing: instant scale(0.97) on press; on the web the release eases back
// over 160ms (strong ease-out). Native releases instantly.
export const PRESS_WEB = Platform.OS === 'web'
  ? { transitionProperty: 'transform, background-color, opacity', transitionDuration: '160ms', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }
  : null;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_DRAWER = Easing.bezier(0.32, 0.72, 0, 1);
const native = Platform.OS !== 'web';

// Drop-in for TouchableOpacity: scale feedback instead of an opacity flash, plus the keyboard focus ring.
export function Tap({ onPress, style, children, scale = 0.97, ...rest }) {
  useTheme();
  return (
    <Pressable
      onPress={onPress}
      {...rest}
      style={(state) => [typeof style === 'function' ? style(state) : style, PRESS_WEB, { transform: [{ scale: state.pressed ? scale : 1 }] }, webRing(state.focused)]}
    >
      {children}
    </Pressable>
  );
}

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
        PRESS_WEB,
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
export function IconButton({ children, onPress, label, tone = 'glass', size = 44, style, disabled }) {
  useTheme();
  const t = tones()[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed, focused }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed && !disabled ? 0.94 : 1 }], ...SHADOWS.sm },
        PRESS_WEB,
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
        PRESS_WEB,
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
          minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingHorizontal: SPACE[4], borderRadius: RADII.sm,
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

// Screen header and body. They used to be a coloured block with a curved sheet over it; now they are plain
// containers on the glowing page (AppBackdrop), the same look as the admin dashboard. The names are kept so every
// screen keeps working.
export function OverlapHeader({ children }) {
  useTheme();
  return <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>{children}</View>;
}
export function OverlapSheet({ children, style }) {
  useTheme();
  return <View style={[{ paddingHorizontal: 20, paddingTop: 4 }, style]}>{children}</View>;
}

// The dashboard's page background: an orange glow top-left and a cool glow bottom-right over the base colour.
export function AppBackdrop() {
  const { mode } = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={`bd-a-${mode}`} cx="6" cy="-4" rx="78" ry="42" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={COLORS.glowA} />
            <Stop offset="1" stopColor={COLORS.glowA} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`bd-b-${mode}`} cx="100" cy="106" rx="80" ry="40" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={COLORS.glowB} />
            <Stop offset="1" stopColor={COLORS.glowB} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill={`url(#bd-a-${mode})`} />
        <Rect width="100" height="100" fill={`url(#bd-b-${mode})`} />
      </Svg>
    </View>
  );
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
  const reduced = useReducedMotion();
  const n = items.length;
  const index = Math.max(0, items.findIndex((i) => i.id === active));
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(index)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: index, duration: reduced ? 0 : 260, easing: EASE_DRAWER, useNativeDriver: native }).start();
  }, [index, reduced, x]);
  const itemW = width ? (width - 12) / n : 0;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: (Platform.OS === 'ios' ? 28 : 14) + SAFE_BOTTOM }}
    >
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.pill, padding: 6, width: '100%', maxWidth: 420, justifyContent: 'space-between', ...SHADOWS.md }}
      >
        {itemW ? (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', top: 8, left: 6 + (itemW - 42) / 2, width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.orange, transform: [{ translateX: x.interpolate({ inputRange: [0, n - 1 || 1], outputRange: [0, itemW * (n - 1)] }) }] }}
          />
        ) : null}
        {items.map((item) => {
          const on = active === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              style={({ pressed, focused }) => [{ flex: 1, minHeight: 64, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center', gap: 2, transform: [{ scale: pressed ? 0.94 : 1 }] }, PRESS_WEB, webRing(focused)]}
            >
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
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
export function NotchStat({ label, value, tone = 'orange', icon, valueColor, style, pill, pillTone = 'green' }) {
  useTheme();
  const [wash, ink] = tone === 'purple' ? [COLORS.accentSoft, COLORS.accentText] : [COLORS.primaryLight, COLORS.primaryDeep];
  const pillBg = pillTone === 'red' ? COLORS.danger : pillTone === 'violet' ? COLORS.violet : COLORS.green;
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[{ flex: 1, minHeight: 112, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: 14, gap: 2, justifyContent: 'space-between', ...SHADOWS.sm }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...TYPE.small, ...FONT, color: COLORS.muted, flexShrink: 1 }} numberOfLines={1}>{label}</Text>
        {icon ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: wash, alignItems: 'center', justifyContent: 'center' }}>{icon(ink)}</View> : null}
      </View>
      {typeof value === 'string' || typeof value === 'number'
        ? <Text style={{ ...TYPE.bodyBold, fontSize: 14, ...FONT, color: valueColor || COLORS.ink, letterSpacing: -0.2 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        : value}
      {pill ? <View style={{ alignSelf: 'flex-start', backgroundColor: pillBg, borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ ...TYPE.caption, ...FONT, color: COLORS.onBright }}>{pill}</Text></View> : null}
    </View>
  );
}

// ─── Animated pieces ─────────────────────────────────────────────────────────
// A number that counts up to its value (700ms, strong ease-out). Shows the final number at once with reduced motion.
export function CountUp({ value, duration = 700, suffix = '', style }) {
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
}

// A ring that fills to value/max (600ms ease-out), like the dashboard's fleet donut. Children sit in the middle.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function RingGauge({ value = 0, max = 100, size = 150, stroke = 12, color, track, children }) {
  useTheme();
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
}

// A status dot with a soft ring that expands and fades (1.8s loop). Still with reduced motion.
export function LiveDot({ color, size = 8 }) {
  useTheme();
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
}

// A thin progress bar that eases to its value (500ms) instead of jumping.
export function ProgressTrack({ value = 0, height = 6, color, track, style }) {
  useTheme();
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
}

// Bottom sheet card used by modals.
export function Sheet({ children, style }) {
  useTheme();
  return <View style={[{ backgroundColor: COLORS.surface, borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl, padding: 24, maxHeight: '88%', width: '100%', maxWidth: 560, alignSelf: 'center', ...SHADOWS.lg }, style]}>{children}</View>;
}

// Toast: slides down 10px and fades in (220ms strong ease-out); leaves faster (160ms), as the system responding.
export function Toast({ message }) {
  useTheme();
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
}

// A tab's screen arrives with a short fade and 8px rise (180ms). Tabs are used often, so it stays small. Key it by tab.
export function ScreenFade({ children, style }) {
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
}

// List item entrance: fades up 10px, staggered 40ms per item (the first six only), once when it mounts.
export function Reveal({ index = 0, children, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: reduced ? 0 : 260, delay: reduced ? 0 : Math.min(index, 6) * 40, easing: EASE_OUT, useNativeDriver: native }).start();
  }, [index, reduced, v]);
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }, style]}>{children}</Animated.View>;
}

// Bottom sheet host. The backdrop fades while the sheet itself rises (the stock "slide" animation drags the backdrop
// up with it). Opens in 280ms on the drawer curve, closes faster (180ms).
export function SheetModal({ visible, onClose, children }) {
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
}

// ─── Settings building blocks ────────────────────────────────────────────────
// Choose one of a few options; the pill slides to the choice (200ms strong ease-out).
export function Segmented({ options, value, onChange, label }) {
  useTheme();
  const reduced = useReducedMotion();
  const n = options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(index)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: index, duration: reduced ? 0 : 200, easing: EASE_OUT, useNativeDriver: native }).start();
  }, [index, reduced, x]);
  const seg = width ? (width - 8) / n : 0;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', padding: 4, borderRadius: RADII.pill, backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.glassLine }}
    >
      {seg ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 4, bottom: 4, left: 4, width: seg, borderRadius: RADII.pill, backgroundColor: COLORS.primaryStrong, transform: [{ translateX: x.interpolate({ inputRange: [0, n - 1 || 1], outputRange: [0, seg * (n - 1)] }) }] }} /> : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Tap key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={o.label} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...TYPE.smallBold, ...FONT, color: on ? COLORS.onBright : COLORS.muted }}>{o.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

// A titled group of rows on one card.
export function SettingsSection({ title, note, children }) {
  useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ marginBottom: 20 }}>
      {title ? <Text style={{ ...TYPE.overline, ...FONT, color: COLORS.muted, marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }}>{title}</Text> : null}
      <View style={{ backgroundColor: COLORS.surface, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.glassLine, overflow: 'hidden' }}>
        {rows.map((row, i) => (React.isValidElement(row) && row.type === SettingsRow ? React.cloneElement(row, { first: i === 0 }) : row))}
      </View>
      {note ? <Text style={{ ...TYPE.caption, ...FONT, color: COLORS.muted, marginTop: 8, marginHorizontal: 8 }}>{note}</Text> : null}
    </View>
  );
}

// One row: optional icon, label, a value on the right, a chevron when it opens something. tone="danger" for destructive rows.
export function SettingsRow({ icon, label, value, onPress, tone, first, children }) {
  useTheme();
  const danger = tone === 'danger';
  const body = (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: COLORS.glassLine }}>
      {icon ? <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: danger ? COLORS.dangerSoft : COLORS.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>{icon}</View> : null}
      <View style={value ? { flexShrink: 0, maxWidth: '58%' } : { flex: 1, minWidth: 0 }}>
        <Text style={{ ...TYPE.bodyBold, ...FONT, color: danger ? COLORS.danger : COLORS.ink }}>{label}</Text>
        {children}
      </View>
      {value ? <Text style={{ ...TYPE.small, ...FONT, color: COLORS.muted, flex: 1, textAlign: 'right' }} numberOfLines={2}>{value}</Text> : null}
      {onPress ? <ChevronRight size={18} color={COLORS.mutedLight} strokeWidth={1.75} /> : null}
    </View>
  );
  if (!onPress) return body;
  return <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={label} scale={0.99}>{body}</Tap>;
}
