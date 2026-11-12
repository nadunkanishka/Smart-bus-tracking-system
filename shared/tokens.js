// SmartBus design tokens — single source of truth. `npm run sync` copies this into every app
// (RN apps: src/shared/theme.js, admin: src/design/tokens.css generated from these values).

// ── Palette: four colours, two modes ─────────────────────────────────────────
// Ink (warm near-black), Paper (warm off-white), Lime (primary highlight) and Ember (secondary highlight, ETAs and
// warnings). Everything else is a tint of one of these. The only extra hue is a muted red for destructive actions.
export const PALETTE = { ink: '#15140F', paper: '#F3F1E8', lime: '#D7F34B', ember: '#FF8A3D' };

// Semantic names stay the same in both modes. Two rules the apps rely on:
//   ink / white are "strongest foreground" / "text on ink": they swap in dark mode, so ink-filled buttons stay readable.
//   onBright is always dark ink: use it for text on lime or ember fills (accent, primaryLight on lime), never `ink`.
const LIGHT = {
  bg: '#F1EFE6',
  surface: '#FBFAF5',
  surfaceSoft: '#E9E6DA',
  surfaceTint: '#EEF3C9',
  line: '#DEDACB',
  outline: '#CBC7B6', // input borders
  ring: 'rgba(21, 20, 15, 0.45)', // keyboard focus ring
  lime: PALETTE.lime,
  ember: PALETTE.ember,
  backdrop: '#DDF45B', // hero and header blocks: lime in light mode (ink text)

  primary: '#15140F', // ink carries the main action in light mode
  primaryLight: '#E1F59A', // pale lime: ink text only
  primaryDeep: '#3B4A00',
  primaryStrong: '#15140F',
  primarySoft: '#EDF7C0',
  accent: PALETTE.ember, // fills and highlights. Text on it must be onBright.
  accentText: '#A8470B', // ember darkened for text on paper (5.6:1)
  accentSoft: '#FFE2CC',

  ink: PALETTE.ink,
  inkSoft: '#26241C',
  muted: '#6A675B', // 4.8:1 on bg
  mutedLight: '#A09C8D', // decorative only

  success: '#4C6600',
  successSoft: '#E6F4B0',
  warning: '#A8470B',
  warningSoft: '#FFE2CC',
  danger: '#BF2F26',
  dangerSoft: '#FBDAD5',

  onBright: PALETTE.ink,
  glow: 'rgba(215, 243, 75, 0.55)',
  taxi: PALETTE.ember,
  headlight: '#EFFF8A',
  window: '#26241C',
  tire: PALETTE.ink,

  tints: {
    bus: ['#E3F6A0', '#EFF9C8'],
    train: ['#FFD9BF', '#FFE8D6'],
    delivery: ['#FFD9BF', '#FFE8D6'],
    taxi: ['#EAE6D8', '#F3F0E5'],
    green: ['#E8F0C2', '#F2F6DA'],
  },
  tintLines: { bus: '#D2EB7A', train: '#FFC6A0', delivery: '#FFC6A0', taxi: '#DAD5C2', green: '#D9E5A5' },

  white: '#FFFFFF',
  black: '#000000',
};

const DARK = {
  bg: '#0F0E0B',
  surface: '#1A1914',
  surfaceSoft: '#25231C',
  surfaceTint: '#1F2310',
  line: '#322F26',
  outline: '#4A463A',
  ring: 'rgba(215, 243, 75, 0.6)',
  lime: PALETTE.lime,
  ember: PALETTE.ember,
  backdrop: '#1A1914',

  primary: PALETTE.lime, // lime carries the main action in dark mode
  primaryLight: '#2B3010',
  primaryDeep: PALETTE.lime,
  primaryStrong: PALETTE.lime,
  primarySoft: '#22260E',
  accent: PALETTE.ember,
  accentText: '#FF9A57',
  accentSoft: '#3B2314',

  ink: PALETTE.paper,
  inkSoft: '#D9D6C9',
  muted: '#A5A193', // 6.3:1 on surface
  mutedLight: '#6F6C60',

  success: PALETTE.lime,
  successSoft: '#2B3310',
  warning: '#FF9A57',
  warningSoft: '#3B2314',
  danger: '#FF7A6E',
  dangerSoft: '#3F1C19',

  onBright: PALETTE.ink,
  glow: 'rgba(215, 243, 75, 0.35)',
  taxi: PALETTE.ember,
  headlight: '#EFFF8A',
  window: '#0F0E0B',
  tire: PALETTE.ink,

  tints: {
    bus: ['#2A3012', '#20240F'],
    train: ['#3A2314', '#2B1B10'],
    delivery: ['#3A2314', '#2B1B10'],
    taxi: ['#2B2920', '#22211A'],
    green: ['#262B14', '#1E2210'],
  },
  tintLines: { bus: '#3C4519', train: '#5A3920', delivery: '#5A3920', taxi: '#3A372B', green: '#363D1B' },

  white: PALETTE.ink, // "text on ink": dark ink on the paper-coloured fills
  black: '#000000',
};

// Older keys, derived so they always follow the current mode.
const withLegacy = (c) => ({
  ...c,
  bgBase: c.bg, bgSurface: c.surface, bgSurfaceMuted: c.surfaceSoft, bgSurfaceSubtle: c.surfaceSoft,
  bgDark: c.ink, bgDarkElevated: c.inkSoft, bgDarkCard: c.inkSoft,
  borderDark: c.line, borderDarkSubtle: 'rgba(255, 255, 255, 0.08)',
  borderColor: c.line, borderLight: c.bg,
  accentOrange: c.accent, accentOrangeLight: c.accentSoft, accentOrangeGlow: c.glow, accentDark: c.accentText,
  accentBlue: c.primary, accentBlueLight: c.primarySoft,
  successLight: c.successSoft, warningLight: c.warningSoft, dangerLight: c.dangerSoft,
  textPrimary: c.ink, textSecondary: c.inkSoft, textMuted: c.muted, textMutedLight: c.mutedLight,
  textDarkPrimary: c.white, textDarkSecondary: c.inkSoft, textDarkMuted: c.mutedLight,
});

export const THEMES = { light: withLegacy(LIGHT), dark: withLegacy(DARK) };

// The live colour object every style reads. `applyTheme('dark' | 'light')` swaps its values in place, so code that
// reads COLORS when it renders (not when the file loads) always sees the current mode.
export const COLORS = { ...THEMES.light };
export function applyTheme(mode) {
  const next = THEMES[mode] || THEMES.light;
  Object.assign(COLORS, next);
  return mode in THEMES ? mode : 'light';
}

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
  sm: { shadowColor: '#15140F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  md: { shadowColor: '#15140F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 5 },
  lg: { shadowColor: '#15140F', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 10 },
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
