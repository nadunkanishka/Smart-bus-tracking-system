// SmartBus design tokens — single source of truth. `npm run sync` copies this into every app
// (RN apps: src/constants/theme.js, admin: src/design/tokens.css generated from these values).

export const COLORS = {
  // Surfaces
  bg: '#DCE6F1',
  surface: '#FFFFFF',
  surfaceSoft: '#F3F6FA',
  surfaceTint: '#EAF4FA',
  line: '#E6ECF3',

  // Brand — blue-teal primary (Reference 2), coral accent (Reference 1)
  primary: '#3A9BC9',
  primaryLight: '#6DBFE8',
  primaryDeep: '#1F5F85',
  primaryStrong: '#1F78A8', // white text on this = 4.87:1 (AA). Use for teal buttons/chips with text.
  primarySoft: '#E3F2FA',
  accent: '#F26B85', // fills, routes, icons. Text on it must be ink (6.36:1), never white (2.91:1).
  accentText: '#C93A60', // coral for text/links on white (4.93:1)
  accentSoft: '#FDE4EA',

  // Ink
  ink: '#0F1419',
  inkSoft: '#1B232B',
  muted: '#5B6673', // 5.84:1 on white, 4.63:1 on --bg
  mutedLight: '#8793A0', // decorative only (placeholders, disabled)

  // Status
  success: '#157F55',
  successSoft: '#DDF5EA',
  warning: '#9A6A00',
  warningSoft: '#FFF1D6',
  danger: '#C62F43',
  dangerSoft: '#FDE3E6',

  // Illustration extras
  taxi: '#FFC857',
  headlight: '#FFE08A',
  window: '#1F5F85',
  tire: '#0F1419',

  // Pastel gradient pairs for status cards: [from, to]
  tints: {
    bus: ['#E1F1FB', '#B9DDF2'],
    train: ['#DDF4EF', '#AFE3DA'],
    delivery: ['#FFEBD6', '#FFD3AB'],
    taxi: ['#FFE6EC', '#FFF0C9'],
    green: ['#E2F6EA', '#BFEBD2'],
  },

  white: '#FFFFFF',
  black: '#000000',

  // ── Legacy keys (kept so older imports keep compiling) ──
  bgBase: '#DCE6F1', bgSurface: '#FFFFFF', bgSurfaceMuted: '#F3F6FA', bgSurfaceSubtle: '#F3F6FA',
  bgDark: '#0F1419', bgDarkElevated: '#1B232B', bgDarkCard: '#222B34',
  borderDark: '#2A343E', borderDarkSubtle: 'rgba(255, 255, 255, 0.08)',
  borderColor: '#E6ECF3', borderLight: '#EEF2F7',
  accentOrange: '#F26B85', accentOrangeLight: 'rgba(242, 107, 133, 0.14)',
  accentOrangeGlow: 'rgba(242, 107, 133, 0.35)', accentDark: '#C93A60',
  accentBlue: '#3A9BC9', accentBlueLight: '#E3F2FA',
  successLight: 'rgba(21, 127, 85, 0.12)', warningLight: 'rgba(154, 106, 0, 0.12)',
  dangerLight: 'rgba(198, 47, 67, 0.12)',
  textPrimary: '#0F1419', textSecondary: '#3A4552', textMuted: '#5B6673', textMutedLight: '#8793A0',
  textDarkPrimary: '#FFFFFF', textDarkSecondary: '#D4DCE4', textDarkMuted: '#8793A0',
};

export const RADII = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, pill: 999 };

export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

// Type scale: one fixed size + line-height + weight per role.
export const TYPE = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  smallBold: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
};

// Soft, diffuse shadows only.
export const SHADOWS = {
  sm: { shadowColor: '#1F3A56', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  md: { shadowColor: '#1F3A56', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 5 },
  lg: { shadowColor: '#1F3A56', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 10 },
};

export const MOTION = {
  easeOut: [0.23, 1, 0.32, 1], // cubic-bezier
  press: 140,
  enter: 260,
};

export const TOUCH = 44; // minimum touch target

// ── Legacy exports (older code imports these) ──
export const TYPOGRAPHY = {
  fontFamily: 'System',
  sizes: { xxs: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, hero: 30 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700', heavy: '800' },
};
export const LAYOUT = {
  borderRadiusXs: 8, borderRadiusSm: 12, borderRadiusMd: 16, borderRadiusLg: 24, borderRadiusXl: 32,
  borderRadiusFull: 999, cardPadding: 20, screenPadding: 20,
};
