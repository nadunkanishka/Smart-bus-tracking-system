// Light / dark mode for the mobile apps. Source of truth lives in /shared/native and is copied to
// apps/*/src/shared/themeRuntime.js by `node shared/sync.js`.
//
//   <ThemeProvider> once at the root, then
//   const { mode, isDark, toggle } = useTheme();           // any component that should re-render on a switch
//   export const useStyles = createStyles(() => StyleSheet.create({ ... COLORS.ink ... }));   // themed StyleSheet
//
// COLORS (from ./theme) is a live object: applyTheme() swaps its values in place before the tree re-renders, so
// anything that reads COLORS while rendering sees the current mode. A StyleSheet built at import time would freeze
// the first mode, which is why styles are built by createStyles() (once per mode, cached) instead.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, applyTheme } from './theme';

const KEY = 'smartbus.theme';
const Ctx = createContext({ mode: 'light', isDark: false, toggle: () => {}, setMode: () => {}, followSystem: () => {}, source: 'system' });

const system = () => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

// On the web the saved choice can be read synchronously, so the first paint is already in the right mode.
function initial() {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return { mode: saved, source: 'saved' };
    }
  } catch { /* storage blocked: fall through to the system setting */ }
  return { mode: system(), source: 'system' };
}

function paintWeb(mode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.colorScheme = mode;
  root.style.backgroundColor = COLORS.bg;
  if (document.body) document.body.style.backgroundColor = COLORS.bg;
}

export function ThemeProvider({ children }) {
  const [state, setState] = useState(initial);
  const { mode, source } = state;

  // Apply during render (not in an effect) so children never render once with the old colours.
  const applied = useRef(null);
  if (applied.current !== mode) { applyTheme(mode); applied.current = mode; }
  useEffect(() => { paintWeb(mode); }, [mode]);

  // Native (and web without a saved choice): load the saved choice once.
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let on = true;
    AsyncStorage.getItem(KEY).then((v) => { if (on && (v === 'dark' || v === 'light')) setState({ mode: v, source: 'saved' }); }).catch(() => {});
    return () => { on = false; };
  }, []);

  // Follow the phone's setting until the person picks one themselves.
  useEffect(() => {
    if (source !== 'system') return undefined;
    const sub = Appearance.addChangeListener(({ colorScheme }) => setState({ mode: colorScheme === 'dark' ? 'dark' : 'light', source: 'system' }));
    return () => sub.remove();
  }, [source]);

  const save = useCallback((next) => {
    setState({ mode: next, source: 'saved' });
    try { if (Platform.OS === 'web' && typeof localStorage !== 'undefined') localStorage.setItem(KEY, next); } catch { /* ignore */ }
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    source,
    setMode: save,
    toggle: () => save(mode === 'dark' ? 'light' : 'dark'),
    followSystem: () => {
      try { if (Platform.OS === 'web' && typeof localStorage !== 'undefined') localStorage.removeItem(KEY); } catch { /* ignore */ }
      AsyncStorage.removeItem(KEY).catch(() => {});
      setState({ mode: system(), source: 'system' });
    },
  }), [mode, source, save]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

// Builds a themed StyleSheet once per mode. Call the returned hook inside a component.
export function createStyles(factory) {
  const cache = {};
  return function useStyles() {
    const { mode } = useContext(Ctx);
    if (!cache[mode]) cache[mode] = factory();
    return cache[mode];
  };
}
