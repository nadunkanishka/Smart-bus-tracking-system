// SmartBus UI kit: Platform switches, the font, themed() and the press feedback every tappable thing shares.
// Part of shared/native/ui.js; the app imports everything from '../shared/ui'.
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing, Platform, Pressable, StatusBar } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { COLORS, EASE_OUT as EASE_CURVE, TYPE } from '../theme';
import { useTheme } from '../themeRuntime';


// One platform switch for this file: web (react-native-web) or a phone.
export const IS_WEB = Platform.OS === 'web';
export const native = !IS_WEB;

// Inter Tight on web (light-weight, tight type); native keeps the system font (no font-loading dependency).
// Android draws edge to edge, so the status bar and gesture bar overlap the app. iOS is handled by SafeAreaView.
// TOP_INSET is the one top inset every screen header uses. StatusBar.currentHeight can read 0 on edge-to-edge Android and
// both sources can read 0 at import time, so it never goes below 24dp (the smallest Android status bar).
export const TOP_INSET = Platform.OS === 'android' ? Math.max(24, initialWindowMetrics?.insets.top ?? 0, StatusBar.currentHeight ?? 0) : 0;
export const SAFE_BOTTOM = Platform.OS === 'android' ? (initialWindowMetrics?.insets.bottom ?? 0) : 0;

export const FONT = IS_WEB ? { fontFamily: "'Inter Tight', system-ui, sans-serif" } : null;
// A text style for one role of the type scale, in the kit's font: { ...type('small'), color }.
export const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });
if (IS_WEB && typeof document !== 'undefined' && !document.getElementById('sb-font')) {
  const l = document.createElement('link');
  l.id = 'sb-font'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600&display=swap';
  document.head.appendChild(l);
}

// Every component this kit exports is declared through themed(): it subscribes to the theme context, so the component
// re-renders with the swapped COLORS on a light/dark switch. Declare new exported components the same way
// (shared/test/kit.test.mjs fails on a plain `export function` here).
export function themed(render) {
  function Themed(props) {
    useTheme();
    return render(props);
  }
  Themed.displayName = render.name;
  return Themed;
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

export const webRing = (focused, color = COLORS.ring) =>
  (IS_WEB && focused ? { boxShadow: `0 0 0 3px ${color}` } : null);

// Press feel shared by every tappable thing: instant scale(0.97) on press; on the web the release eases back
// over 160ms (strong ease-out). Native releases instantly.
export const PRESS_WEB = IS_WEB
  ? { transitionProperty: 'transform, background-color, opacity', transitionDuration: '160ms', transitionTimingFunction: `cubic-bezier(${EASE_CURVE.join(', ')})` }
  : null;
export const EASE_OUT = Easing.bezier(...EASE_CURVE);
export const EASE_DRAWER = Easing.bezier(0.32, 0.72, 0, 1);

// Drop-in for TouchableOpacity: scale feedback instead of an opacity flash, plus the keyboard focus ring.
export const Tap = themed(function Tap({ onPress, style, children, scale = 0.97, ...rest }) {
  return (
    <Pressable
      onPress={onPress}
      {...rest}
      style={(state) => [typeof style === 'function' ? style(state) : style, PRESS_WEB, { transform: [{ scale: state.pressed ? scale : 1 }] }, webRing(state.focused)]}
    >
      {children}
    </Pressable>
  );
});
