// SmartBus design tokens — single source of truth. `npm run sync` copies this into every app
// (RN apps: src/shared/theme.js, admin: src/design/tokens.css generated from these values).

export const COLORS = {
  // Surfaces: cool grey screens, white cards, a pale blue backdrop for headers and the sign-in hero
  bg: '#EEF0F4',
  surface: '#FFFFFF',
  surfaceSoft: '#F3F4F7',
  surfaceTint: '#E6F3F8',
  line: '#E6E8EE',
  backdrop: '#CBE8F2',

  // Brand: ink carries primary actions, blue is the brand tone, peach is the accent
  primary: '#2C6E8A', // white text on this = 5.7:1 (AA)
  primaryLight: '#BFE3F1', // pale blue: ink text only
  primaryDeep: '#245B73',
  primaryStrong: '#245B73', // white text on this = 7.2:1 (AA). Use for blue buttons/chips with text.
  primarySoft: '#DDEFF6',
  accent: '#F29A78', // fills and highlights. Text on it must be ink, never white.
  accentText: '#A2492A', // warm brown for text/links on white (6.4:1)
  accentSoft: '#FBE1D5',

  // Ink
  ink: '#131416',
  inkSoft: '#1F2733',
  muted: '#5C6675', // 5.3:1 on --bg
  mutedLight: '#9AA2AE', // decorative only (placeholders, disabled)

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
  window: '#245B73',
  tire: '#131416',

  // Soft wash pairs for status cards: [from, to], each with a 1.5px outline colour in tintLines
  tints: {
    bus: ['#D3ECF6', '#E6F3F8'],
    train: ['#FBDCCB', '#FCEBDD'],
    delivery: ['#FBDCCB', '#FCEBDD'],
    taxi: ['#FCE6C8', '#FDF1DF'],
    green: ['#E0F2CE', '#EEF7E4'],
  },
  tintLines: { bus: '#BFE3F1', train: '#F8CDB8', delivery: '#F8CDB8', taxi: '#F5D9AE', green: '#CDE8B4' },

  white: '#FFFFFF',
  black: '#000000',

  // ── Legacy keys (kept so older imports keep compiling) ──
  bgBase: '#EEF0F4', bgSurface: '#FFFFFF', bgSurfaceMuted: '#F3F4F7', bgSurfaceSubtle: '#F3F4F7',
  bgDark: '#131416', bgDarkElevated: '#1F2733', bgDarkCard: '#2A2F38',
  borderDark: '#3A3D44', borderDarkSubtle: 'rgba(255, 255, 255, 0.08)',
  borderColor: '#E6E8EE', borderLight: '#EEF0F4',
  accentOrange: '#F29A78', accentOrangeLight: 'rgba(242, 154, 120, 0.18)',
  accentOrangeGlow: 'rgba(242, 154, 120, 0.4)', accentDark: '#A2492A',
  accentBlue: '#2C6E8A', accentBlueLight: '#DDEFF6',
  successLight: 'rgba(21, 127, 85, 0.12)', warningLight: 'rgba(154, 106, 0, 0.12)',
  dangerLight: 'rgba(198, 47, 67, 0.12)',
  textPrimary: '#131416', textSecondary: '#4A5361', textMuted: '#5C6675', textMutedLight: '#9AA2AE',
  textDarkPrimary: '#FFFFFF', textDarkSecondary: '#D9D9E0', textDarkMuted: '#9AA2AE',
};

export const RADII = { xs: 8, sm: 14, md: 20, lg: 28, xl: 36, pill: 999 };

export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

// Type scale: one fixed size + line-height + weight per role.
export const TYPE = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8 },
};

// Soft, diffuse shadows only.
export const SHADOWS = {
  sm: { shadowColor: '#131416', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  md: { shadowColor: '#131416', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 5 },
  lg: { shadowColor: '#131416', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 10 },
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
