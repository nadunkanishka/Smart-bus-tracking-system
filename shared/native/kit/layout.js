// SmartBus UI kit: Auth layout, screen header and body, backdrop, navigation dock and stat cards.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import Svg, { Defs, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, RADII, SHADOWS, TYPE } from '../theme';
import { useTheme } from '../themeRuntime';
import { Activity, ChartColumn, Gauge, House, Navigation, Route as RouteGlyph, User, Users, Bus as BusGlyph } from 'lucide-react-native';
import { ThemeToggle } from './controls';
import { EASE_DRAWER, FONT, PRESS_WEB, SAFE_BOTTOM, TOP_INSET, native, themed, useReducedMotion, webRing } from './core';
import { RoadScene, Vehicle } from './vehicle';

// ─── Auth layout (hero + curved white panel; split screen on desktop) ───────
export const AuthLayout = themed(function AuthLayout({ scene = 'login', brand, tagline, title, subtitle, children, footer }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const scroller = useRef(null);
  // The form sits at the bottom of the panel: once the keyboard is up, scroll down so the fields are in view.
  useEffect(() => {
    const sub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => scroller.current?.scrollToEnd({ animated: true }));
    return () => sub.remove();
  }, []);
  const hero = (
    <View style={[{ backgroundColor: COLORS.backdrop, paddingTop: 24 + TOP_INSET, overflow: 'hidden' }, wide && { flex: 1, justifyContent: 'space-between', padding: 48 }]}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox="0 0 400 300" preserveAspectRatio="xMaxYMid slice">
        <Path d="M230 330C240 230 310 140 430 96" fill="none" stroke={COLORS.ink} strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="5 7" />
        <Path d="M150 -20C165 70 235 118 340 104" fill="none" stroke={COLORS.ink} strokeOpacity="0.16" strokeWidth="1.2" strokeDasharray="5 7" />
        <Polygon points="350,36 356,54 374,60 356,66 350,84 344,66 326,60 344,54" fill={COLORS.accent} />
        <Polygon points="60,150 64,161 75,165 64,169 60,180 56,169 45,165 56,161" fill={COLORS.ink} fillOpacity="0.5" />
      </Svg>
      <View style={{ position: 'absolute', top: 16 + TOP_INSET, right: wide ? 24 : 16, zIndex: 2 }}>
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled={native}>
    <ScrollView ref={scroller} style={{ flex: 1, backgroundColor: wide ? COLORS.surface : COLORS.backdrop }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[{ flexGrow: 1 }, wide ? { flexDirection: 'row', minHeight: 640 } : { width: '100%', maxWidth: 560, alignSelf: 'center' }]}>
        {hero}
        {panel}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
});

// Screen header and body. They used to be a coloured block with a curved sheet over it; now they are plain
// containers on the glowing page (AppBackdrop), the same look as the admin dashboard. The names are kept so every
// screen keeps working.
export const OverlapHeader = themed(function OverlapHeader({ children }) {
  return <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>{children}</View>;
});
export const OverlapSheet = themed(function OverlapSheet({ children, style }) {
  return <View style={[{ paddingHorizontal: 20, paddingTop: 4 }, style]}>{children}</View>;
});

// The dashboard's page background: an orange glow top-left and a cool glow bottom-right over the base colour.
export const AppBackdrop = themed(function AppBackdrop() {
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
});

// Navigation icon: Lucide outline. The current item sits on an orange circle, so it is drawn in night; idle items are muted.
const NAV_GLYPHS = { home: House, arrow: Navigation, route: RouteGlyph, user: User, gauge: Gauge, people: Users, bus: BusGlyph, pulse: Activity, chart: ChartColumn };
export const NavIcon = themed(function NavIcon({ name, active, size = 24 }) {
  const Glyph = NAV_GLYPHS[name] || House;
  return <Glyph size={size} color={active ? COLORS.onBright : COLORS.muted} strokeWidth={active ? 2 : 1.75} />;
});

// Bottom navigation: a white pill docked in the screen's own footer (content never slides behind it). Every item
// shows its label; the current item sits in an ink circle with a white icon. items: [{ id, label, icon(active) }]
export const FloatingDock = themed(function FloatingDock({ items, active, onChange }) {
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
});

// Stat card: white card with a round tinted icon, a muted label and a bold value (the admin's KPI card in small).
// icon: (color) => element. tone: 'orange' (peach) | 'purple' (blue).
export const NotchStat = themed(function NotchStat({ label, value, tone = 'orange', icon, valueColor, style, pill, pillTone = 'green' }) {
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
});
