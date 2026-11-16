// SmartBus UI kit: Auth layout, screen header and body, backdrop, navigation dock and stat cards.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import { COLORS, RADII, TYPE } from '../theme';
import { Activity, ChartColumn, Gauge, House, Navigation, Route as RouteGlyph, User, Users, Bus as BusGlyph } from 'lucide-react-native';
import { ThemeToggle } from './controls';
import { FONT, PRESS_WEB, SAFE_BOTTOM, TOP_INSET, native, themed, webRing } from './core';
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
  // Phone: a slim brand row, then a huge title and the form on one white card. Wide screens keep the road scene beside it.
  const brandRow = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' }}>
        <Vehicle name="bus" width={30} label="SmartBus logo" />
      </View>
      <Text style={{ ...TYPE.h2, ...FONT, color: COLORS.ink, flex: 1 }}>{brand}</Text>
      <ThemeToggle />
    </View>
  );
  const hero = wide ? (
    <View style={{ flex: 1, backgroundColor: COLORS.surface, justifyContent: 'space-between', padding: 48, paddingTop: 48 + TOP_INSET }}>
      <View>
        {brandRow}
        {tagline ? <Text style={{ ...TYPE.body, ...FONT, color: COLORS.muted, marginTop: 16 }}>{tagline}</Text> : null}
      </View>
      <View style={{ borderRadius: RADII.xl, backgroundColor: COLORS.bg, paddingVertical: 12, overflow: 'hidden', alignItems: 'center' }}>
        <RoadScene scene={scene} width={Math.round(width / 2) - 96} />
      </View>
    </View>
  ) : (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 + TOP_INSET }}>{brandRow}</View>
  );
  const panel = (
    <View style={[{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40, flexGrow: 1 }, wide && { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 48 }]}>
      <View style={wide ? { width: '100%', maxWidth: 420 } : null}>
        <Text style={{ ...TYPE.display, fontSize: 46, lineHeight: 50, ...FONT, color: COLORS.ink }}>{title}</Text>
        {subtitle ? <Text style={{ ...TYPE.body, ...FONT, color: COLORS.muted, marginTop: 6, marginBottom: 24 }}>{subtitle}</Text> : null}
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 32, padding: 20 }}>{children}</View>
        {footer}
      </View>
    </View>
  );
  // Edge-to-edge Android ignores adjustResize, so lift the form above the keyboard ourselves.
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled={native}>
    <ScrollView ref={scroller} style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

// The page background: one flat colour.
export const AppBackdrop = themed(function AppBackdrop() {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />;
});

// Navigation icon: Lucide outline. The current item sits on a black circle, so its icon is white; idle items are muted.
const NAV_GLYPHS = { home: House, arrow: Navigation, route: RouteGlyph, user: User, gauge: Gauge, people: Users, bus: BusGlyph, pulse: Activity, chart: ChartColumn };
export const NavIcon = themed(function NavIcon({ name, active, size = 24 }) {
  const Glyph = NAV_GLYPHS[name] || House;
  return <Glyph size={size} color={active ? COLORS.onBright : COLORS.muted} strokeWidth={active ? 2 : 1.75} />;
});

// Bottom navigation: a row of round buttons floating over the screen's bottom edge (no bar behind them). The current one is
// an orange circle, the others white circles with a hairline. Icons only; every button keeps its label for screen readers.
// items: [{ id, label, icon(active) }]
export const FloatingDock = themed(function FloatingDock({ items, active, onChange }) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16, paddingBottom: (Platform.OS === 'ios' ? 28 : 16) + SAFE_BOTTOM }}
    >
      <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {items.map((item) => {
          const on = active === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: on }}
              style={({ pressed, focused }) => [
                { width: on ? 68 : 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? COLORS.primaryStrong : COLORS.surface, borderWidth: on ? 0 : 1, borderColor: COLORS.glassLine, transform: [{ scale: pressed ? 0.94 : 1 }] },
                PRESS_WEB, webRing(focused),
              ]}
            >
              {item.icon(on)}
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
  const dark = tone === 'ink';
  const [wash, ink] = dark ? ['rgba(255, 255, 255, 0.14)', COLORS.onCard] : tone === 'purple' ? [COLORS.accentSoft, COLORS.accentText] : [COLORS.primaryLight, COLORS.primaryDeep];
  // The pill: green for live, red for a problem, otherwise a quiet neutral one (readable on both card colours).
  const neutral = pillTone !== 'red' && pillTone !== 'green';
  const pillBg = pillTone === 'red' ? COLORS.danger : neutral ? (dark ? 'rgba(255, 255, 255, 0.14)' : COLORS.surfaceSoft) : COLORS.success;
  const pillFg = neutral ? (dark ? COLORS.onCard : COLORS.muted) : COLORS.white;
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[{ flex: 1, minHeight: 112, backgroundColor: dark ? COLORS.card : COLORS.surface, borderWidth: dark ? 0 : 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: 16, gap: 2, justifyContent: 'space-between' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...TYPE.small, ...FONT, color: dark ? COLORS.cardMuted : COLORS.muted, flexShrink: 1 }} numberOfLines={1}>{label}</Text>
        {icon ? <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: wash, alignItems: 'center', justifyContent: 'center' }}>{icon(ink)}</View> : null}
      </View>
      {typeof value === 'string' || typeof value === 'number'
        ? <Text style={{ ...(String(value).length > 7 ? TYPE.bodyBold : TYPE.h2), ...FONT, color: valueColor || (dark ? COLORS.onCard : COLORS.ink) }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        : value}
      {pill ? <View style={{ alignSelf: 'flex-start', backgroundColor: pillBg, borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ ...TYPE.caption, ...FONT, color: pillFg }}>{pill}</Text></View> : null}
    </View>
  );
});
