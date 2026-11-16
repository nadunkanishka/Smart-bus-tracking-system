// SmartBus UI kit: Settings building blocks: Segmented, SettingsSection, SettingsRow.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { COLORS, RADII, TYPE } from '../theme';
import { ChevronRight } from 'lucide-react-native';
import { EASE_OUT, FONT, Tap, native, themed, useReducedMotion } from './core';

// ─── Settings building blocks ────────────────────────────────────────────────
// Choose one of a few options; the pill slides to the choice (200ms strong ease-out).
export const Segmented = themed(function Segmented({ options, value, onChange, label }) {
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
      style={{ flexDirection: 'row', padding: 4, borderRadius: RADII.pill, backgroundColor: COLORS.surfaceSoft }}
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
});

// A titled group of rows on one card.
export const SettingsSection = themed(function SettingsSection({ title, note, children }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ marginBottom: 20 }}>
      {title ? <Text style={{ ...TYPE.overline, ...FONT, color: COLORS.muted, marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }}>{title}</Text> : null}
      <View style={{ backgroundColor: COLORS.surface, borderRadius: RADII.xl, overflow: 'hidden' }}>
        {rows.map((row, i) => (React.isValidElement(row) && row.type === SettingsRow ? React.cloneElement(row, { first: i === 0 }) : row))}
      </View>
      {note ? <Text style={{ ...TYPE.caption, ...FONT, color: COLORS.muted, marginTop: 8, marginHorizontal: 8 }}>{note}</Text> : null}
    </View>
  );
});

// One row: optional icon, label, a value on the right, a chevron when it opens something. tone="danger" for destructive rows.
export const SettingsRow = themed(function SettingsRow({ icon, label, value, onPress, tone, first, children }) {
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
});
