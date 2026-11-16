// SmartBus UI kit: Surfaces, buttons and form controls.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, RADII, SHADOWS, SPACE, TYPE } from '../theme';
import { useTheme } from '../themeRuntime';
import { EASE_OUT, FONT, IS_WEB, PRESS_WEB, native, themed, useReducedMotion, webRing } from './core';

// ─── Surfaces ───────────────────────────────────────────────────────────────
// A flat card. tint 'bus' (the default) is the white card with a hairline border, 'hero' the orange card, 'ink' the black card whose
// text is white (onCard). No gradient, no shadow. (The name is from the old skin.)
export const GradientCard = themed(function GradientCard({ tint = 'bus', style, children }) {
  const fill = tint === 'hero' ? COLORS.orange : tint === 'ink' ? COLORS.card : COLORS.surface;
  return <View style={[{ borderRadius: RADII.lg, overflow: 'hidden', backgroundColor: fill, borderWidth: fill === COLORS.surface ? 1 : 0, borderColor: COLORS.glassLine }, style]}>{children}</View>;
});

export const Banner = themed(function Banner({ tone = 'danger', children }) {
  const c = tone === 'success' ? [COLORS.successSoft, COLORS.success] : [COLORS.dangerSoft, COLORS.danger];
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: c[0], borderRadius: RADII.md, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
      <Text style={{ ...TYPE.smallBold, ...FONT, color: c[1] }}>{children}</Text>
    </View>
  );
});

// ─── Buttons ────────────────────────────────────────────────────────────────
// Read at render time so a mode switch is picked up. Text on lime or lavender fills is always dark (onBright).
const tones = () => ({
  ink: { bg: COLORS.ink, fg: COLORS.white },
  primary: { bg: COLORS.primaryStrong, fg: COLORS.onBright },
  accent: { bg: COLORS.accent, fg: COLORS.onBright },
  orange: { bg: COLORS.orange, fg: '#0E0E0F' },
  soft: { bg: COLORS.surfaceSoft, fg: COLORS.ink },
  dangerSoft: { bg: COLORS.dangerSoft, fg: COLORS.danger },
  glass: { bg: COLORS.surface, fg: COLORS.ink },
});

export const Button = themed(function Button({ title, onPress, tone = 'primary', size = 'lg', loading, disabled, icon, style, textStyle, accessibilityLabel, full = true }) {
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
          minHeight: size === 'lg' ? 56 : 44, paddingHorizontal: size === 'lg' ? 24 : 18, borderRadius: RADII.pill,
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
});

// Round icon button (≥44px target) — bell, close, call, message.
export const IconButton = themed(function IconButton({ children, onPress, label, tone = 'glass', size = 44, style, disabled }) {
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
});

// Light / dark switch. The icon turns a quarter as it swaps (220ms, strong ease-out); still when reduced motion is on.
export const ThemeToggle = themed(function ThemeToggle({ size = 44, style }) {
  const { isDark, toggle } = useTheme();
  const reduced = useReducedMotion();
  const turn = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(turn, { toValue: isDark ? 1 : 0, duration: reduced ? 0 : 220, easing: EASE_OUT, useNativeDriver: native }).start();
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
});

export const Chip = themed(function Chip({ label, selected, onPress, style }) {
  const on = selected;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!on }}
      style={({ pressed, focused }) => [
        { minHeight: 40, paddingHorizontal: 18, borderRadius: RADII.pill, justifyContent: 'center', backgroundColor: on ? COLORS.ink : COLORS.surfaceSoft, transform: [{ scale: pressed ? 0.97 : 1 }] },
        PRESS_WEB,
        webRing(focused),
        style,
      ]}
    >
      <Text style={{ ...TYPE.smallBold, ...FONT, color: on ? COLORS.white : COLORS.ink }}>{label}</Text>
    </Pressable>
  );
});

// ─── Form controls ──────────────────────────────────────────────────────────
const EyeIcon = themed(function EyeIcon({ off, color, size = 20 }) {
  color = color || COLORS.muted;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <Circle cx="12" cy="12" r="3" />
      {off ? <Path d="M3 3l18 18" /> : null}
    </Svg>
  );
});

export const TextField = themed(function TextField({ label, icon, error, hint, secure, style, inputStyle, ...input }) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={{ ...TYPE.smallBold, ...FONT, color: COLORS.ink, marginBottom: 8, marginLeft: 8 }}>{label}</Text> : null}
      <View
        style={{
          minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingHorizontal: SPACE[4], borderRadius: RADII.md,
          backgroundColor: COLORS.surface, borderWidth: 1.5,
          borderColor: error ? COLORS.danger : focused ? COLORS.ink : 'transparent',
          ...(IS_WEB && focused ? { boxShadow: error ? `0 0 0 4px ${COLORS.dangerSoft}` : `0 0 0 4px ${COLORS.primaryLight}` } : null),
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
          style={[{ flex: 1, ...TYPE.body, ...FONT, color: COLORS.ink, paddingVertical: 12, minHeight: 48 }, IS_WEB ? { outlineStyle: 'none' } : null, inputStyle]}
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
});

export const Checkbox = themed(function Checkbox({ checked, onChange, children }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={({ focused }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, flexShrink: 1 }, webRing(focused)]}>
      <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: checked ? COLORS.primaryStrong : COLORS.surfaceSoft, borderWidth: 2, borderColor: checked ? COLORS.primaryStrong : COLORS.mutedLight, alignItems: 'center', justifyContent: 'center' }}>
        {checked ? <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.onBright} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg> : null}
      </View>
      <Text style={{ ...TYPE.small, ...FONT, color: COLORS.ink, flexShrink: 1 }}>{children}</Text>
    </Pressable>
  );
});

function passwordStrength(pw = '') {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return { score: pw ? Math.max(1, s) : 0, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][pw ? Math.max(1, s) : 0] };
}

export const StrengthMeter = themed(function StrengthMeter({ password }) {
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
});
