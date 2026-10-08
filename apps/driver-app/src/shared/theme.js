// SmartBus design tokens — single source of truth. `npm run sync` copies this into every app
// (RN apps: src/shared/theme.js, admin: src/design/tokens.css generated from these values).

export const COLORS = {
  // Surfaces: off-white screens, white cards, warm peach backdrop for large empty areas
  bg: '#F3F4F9',
  surface: '#FFFFFF',
  surfaceSoft: '#F3F1F4',
  surfaceTint: '#E9E8F6',
  line: '#E7E6EE',
  backdrop: '#F5DCBD',

  // Brand: purple carries headers and primary actions, orange is the accent
  primary: '#6C6BC6', // white text on this = 4.61:1 (AA)
  primaryLight: '#AFB6FA', // lilac: ink text only
  primaryDeep: '#5E5FAE',
  primaryStrong: '#5E5FAE', // white text on this = 5.64:1 (AA). Use for purple buttons/chips with text.
  primarySoft: '#E9E8F6',
  accent: '#FFA265', // fills, routes, active nav. Text on it must be ink (7.61:1), never white (1.98:1).
  accentText: '#A85624', // warm brown for text/links on white (5.2:1)
  accentSoft: '#FDE7D6',

  // Ink
  ink: '#26262B',
  inkSoft: '#2A2D32',
  muted: '#6B6A72', // 4.87:1 on --bg
  mutedLight: '#9A99A3', // decorative only (placeholders, disabled)

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
  window: '#5E5FAE',
  tire: '#26262B',

  // Soft wash pairs for status cards: [from, to], each with a 1.5px outline colour in tintLines
  tints: {
    bus: ['#E9E8F6', '#DDDBF5'],
    train: ['#F6E8DF', '#F3DCCB'],
    delivery: ['#FFEBD6', '#FFD9B8'],
    taxi: ['#FBEFD9', '#F8E2BD'],
    green: ['#E2F6EA', '#BFEBD2'],
  },
  tintLines: { bus: '#8180DB', train: '#EC9458', delivery: '#EC9458', taxi: '#E8B06E', green: '#6CC79A' },

  white: '#FFFFFF',
  black: '#000000',

  // ── Legacy keys (kept so older imports keep compiling) ──
  bgBase: '#F3F4F9', bgSurface: '#FFFFFF', bgSurfaceMuted: '#F3F1F4', bgSurfaceSubtle: '#F3F1F4',
  bgDark: '#17181B', bgDarkElevated: '#2A2D32', bgDarkCard: '#33363C',
  borderDark: '#3A3D44', borderDarkSubtle: 'rgba(255, 255, 255, 0.08)',
  borderColor: '#E7E6EE', borderLight: '#EFEEF4',
  accentOrange: '#FFA265', accentOrangeLight: 'rgba(255, 162, 101, 0.18)',
  accentOrangeGlow: 'rgba(255, 162, 101, 0.4)', accentDark: '#A85624',
  accentBlue: '#6C6BC6', accentBlueLight: '#E9E8F6',
  successLight: 'rgba(21, 127, 85, 0.12)', warningLight: 'rgba(154, 106, 0, 0.12)',
  dangerLight: 'rgba(198, 47, 67, 0.12)',
  textPrimary: '#26262B', textSecondary: '#55545C', textMuted: '#6B6A72', textMutedLight: '#9A99A3',
  textDarkPrimary: '#FFFFFF', textDarkSecondary: '#D9D9E0', textDarkMuted: '#9A99A3',
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
  sm: { shadowColor: '#543418', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  md: { shadowColor: '#543418', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 5 },
  lg: { shadowColor: '#543418', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 10 },
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
