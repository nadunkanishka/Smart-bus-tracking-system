// The app shell both mobile apps share: the root frame, the toast, the Settings page skeleton and the small rows and
// styles that were copied between them. Source of truth: /shared/native/shell.js (copied to apps/*/src/shared/ by
// `node shared/sync.js`). What differs between the apps (texts, accents, sections) comes in as props.
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACE } from './theme';
import { createStyles, useTheme } from './themeRuntime';
import {
  AppBackdrop, Button, FloatingDock, IconButton, NavIcon, OverlapHeader, OverlapSheet, Segmented, SettingsRow, SettingsSection, Toast, TOP_INSET, type,
} from './ui';
import { ArrowLeftIcon, SettingsIcon } from './icons';
import { API_URL } from './api';

export const TOAST_MS = 3500;

// Style keys both apps' styles/common.js start from.
export const COMMON_STYLES = { flex: { flex: 1 } };

// One toast message at a time; it clears itself after TOAST_MS.
export function useToast() {
  const [toastMsg, setToastMsg] = useState('');
  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(''), TOAST_MS);
    return () => clearTimeout(t);
  }, [toastMsg]);
  const showToast = useCallback((msg) => setToastMsg(msg), []);
  return { toastMsg, showToast };
}

const useFrame = createStyles(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  // On desktop the signed-in app is a centred phone-width column, never a stretched mobile screen.
  column: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden', backgroundColor: 'transparent' },
}));

// Root of each app, inside <ThemeProvider>: safe area, the glowing page, a status bar that matches the mode
// (translucent on Android, which draws edge to edge) and the toast above everything.
export function AppFrame({ toastMsg, children }) {
  const F = useFrame();
  const { isDark } = useTheme();
  return (
    <SafeAreaView style={F.root}>
      <AppBackdrop />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={Platform.OS === 'android'} />
      <Toast message={toastMsg} />
      {children}
    </SafeAreaView>
  );
}

// The signed-in column: tabs, dock and modals go inside.
export function AppColumn({ children }) {
  const F = useFrame();
  return <View style={F.column}>{children}</View>;
}

const useRow = createStyles(() => StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACE[4],
    minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  last: { borderBottomWidth: 0 },
  label: { ...type('small'), color: COLORS.muted, flexShrink: 0 },
  value: { ...type('smallBold'), color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
}));

// Label on the left, value on the right. accent: a colour for the value (read from COLORS while rendering).
export function ProfileRow({ label, value, accent, last }) {
  const R = useRow();
  return (
    <View style={[R.row, last && R.last]}>
      <Text style={R.label}>{label}</Text>
      <Text style={[R.value, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const useSettings = createStyles(() => StyleSheet.create({
  scroll: { paddingBottom: 132 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingTop: TOP_INSET },
  title: { ...type('display'), color: COLORS.ink },
  pad: { padding: SPACE[3] },
}));

// The Settings screen both apps use: back header, Appearance, the app's own sections (children), About, sign out.
export function SettingsPage({ onBack, appearanceNote, version, signOutLabel, onLogout, keyboardShouldPersistTaps, children }) {
  const S = useSettings();
  const { source, mode, setMode, followSystem } = useTheme();
  const preference = source === 'system' ? 'system' : mode;
  const choose = (value) => (value === 'system' ? followSystem() : setMode(value));
  return (
    <ScrollView style={COMMON_STYLES.flex} contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
      <OverlapHeader minHeight={110}>
        <View style={S.header}>
          <IconButton label="Back to profile" onPress={onBack}><ArrowLeftIcon color={COLORS.ink} size={20} /></IconButton>
          <Text style={S.title}>Settings</Text>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        <SettingsSection title="Appearance" note={appearanceNote}>
          <View style={S.pad}>
            <Segmented label="Colour mode" options={THEME_OPTIONS} value={preference} onChange={choose} />
          </View>
        </SettingsSection>

        {children}

        <SettingsSection title="About">
          <SettingsRow label="Version" value={version} />
          <SettingsRow label="Server" value={API_URL.replace(/^https?:\/\//, '')} />
        </SettingsSection>

        <Button title={signOutLabel} tone="soft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}

// The bottom navigation both apps use. tabs: [{ id, label, glyph }], glyph being a NavIcon name ('home', 'arrow', 'route', ...).
export function NavDock({ tabs, active, onChange }) {
  const items = tabs.map((t) => ({ id: t.id, label: t.label, icon: (on) => <NavIcon name={t.glyph} active={on} /> }));
  return <FloatingDock items={items} active={active} onChange={onChange} />;
}

const useProfile = createStyles(() => StyleSheet.create({
  scroll: { paddingBottom: 120 },
  gear: { position: 'absolute', right: 0, top: TOP_INSET + 4, zIndex: 2 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.blue, borderRadius: 36, padding: SPACE[5], marginTop: TOP_INSET + 56 },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  name: { ...type('h1'), color: COLORS.onBlue },
  sub: { ...type('small'), color: COLORS.onBlue, opacity: 0.8, marginTop: SPACE[1] },
}));

// The Profile screen both apps use: a settings button, the avatar with a name and a line under it, the app's own sections
// (children), a Settings row and sign out. A one-letter avatar is drawn larger than a two-letter one.
export function ProfilePage({ initials, name, subtitle, onOpenSettings, settingsValue, signOutLabel, onLogout, children }) {
  const P = useProfile();
  return (
    <ScrollView style={COMMON_STYLES.flex} contentContainerStyle={P.scroll} showsVerticalScrollIndicator={false}>
      <OverlapHeader minHeight={210}>
        <View style={P.gear}>
          <IconButton label="Settings" onPress={onOpenSettings}><SettingsIcon color={COLORS.ink} size={20} /></IconButton>
        </View>
        <View style={P.hero}>
          <View style={P.avatar}>
            <Text style={{ ...type(initials.length > 1 ? 'h1' : 'display'), color: COLORS.onCard }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={P.name} numberOfLines={2}>{name}</Text>
            <Text style={P.sub}>{subtitle}</Text>
          </View>
        </View>
      </OverlapHeader>

      <OverlapSheet>
        {children}

        <SettingsSection>
          <SettingsRow icon={<SettingsIcon color={COLORS.ink} size={18} />} label="Settings" value={settingsValue} onPress={onOpenSettings} />
        </SettingsSection>

        <Button title={signOutLabel} tone="soft" onPress={onLogout} />
      </OverlapSheet>
    </ScrollView>
  );
}
