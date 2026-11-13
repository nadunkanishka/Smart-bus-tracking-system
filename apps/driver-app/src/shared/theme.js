// SmartBus design tokens — single source of truth. `npm run sync` copies this into every app
// (RN apps: src/shared/theme.js, admin: src/design/tokens.css generated from these values).

// ── Palette: "Ember" ─────────────────────────────────────────────────────────
// Night (warm brown-black), Cream (warm off-white), Orange (the one action colour) and Violet (the second voice:
// negative bars, secondary chips). Peach is a tint of orange; red is only for destructive actions.
// Green marks anything active or live (a running bus, a connected server, a driver on duty): it is a status colour, not a brand colour.
// Cards are glass on a glowing dark page: a faint white fill with a hairline border. Light mode is the same set on cream.
export const PALETTE = { night: '#130E0D', cream: '#FFF3EB', orange: '#FF6B35', violet: '#A25BE0', peach: '#FFB59A', red: '#FF5A6E', green: '#34D17A' };

// Semantic names stay the same in both modes. Two rules the apps rely on:
//   ink / white are "strongest foreground" / "text on ink": they swap in dark mode, so ink-filled buttons stay readable.
//   onBright is always night: use it for text on orange, peach or violet fills, never `ink` or `white`.
const LIGHT = {
  bg: '#F5E9E2',
  surface: '#FFFAF6',
  surfaceSoft: '#EBDCD3',
  surfaceTint: '#FDE6DA',
  line: '#E2D2C8',
  outline: '#CDB9AC', // input borders
  ring: 'rgba(19, 14, 13, 0.5)', // keyboard focus ring
  glass: 'rgba(255, 255, 255, 0.7)',
  scrim: 'rgba(19, 14, 13, 0.45)', // behind sheets and dialogs
  mapChrome: 'rgba(255, 255, 255, 0.7)', // the map's attribution strip
  glassLine: 'rgba(19, 14, 13, 0.08)',
  glowA: 'rgba(255, 107, 53, 0.26)', // page backdrop glows (orange top-left, violet bottom-right)
  glowB: 'rgba(162, 91, 224, 0.14)',
  orange: PALETTE.orange,
  violet: PALETTE.violet,
  peach: PALETTE.peach,
  heroFrom: '#FF7B4A', // the orange hero card
  heroTo: '#FF5D2A',
  heroShape: '#FFB59A', // its light shapes
  backdrop: '#FF9A6E', // hero and header blocks on mobile (night text)

  primary: PALETTE.orange, // orange carries the main action in both modes; text on it is onBright
  primaryLight: '#FFD9C9', // pale orange: night text only
  primaryDeep: '#8A2F0A',
  primaryStrong: PALETTE.orange,
  primarySoft: '#FFE6DA',
  accent: PALETTE.violet, // fills and highlights. Text on it must be onBright.
  accentText: '#7B32B8', // violet darkened for text on cream (6:1)
  accentSoft: '#EBD9F8',

  ink: PALETTE.night,
  inkSoft: '#2E2321',
  muted: '#76665F', // 4.9:1 on bg
  mutedLight: '#A8998F', // decorative only

  green: '#2FBF71', // fills and dots (night text on it)
  greenText: '#0E7A3F', // text on cream (5.3:1)
  greenSoft: '#D6F3E1',
  success: '#0E7A3F',
  successSoft: '#D6F3E1',
  warning: '#7B32B8',
  warningSoft: '#EBD9F8',
  danger: '#C8283F',
  dangerSoft: '#FDDDE1',

  onBright: PALETTE.night,
  glow: 'rgba(255, 107, 53, 0.45)',
  taxi: PALETTE.violet,
  headlight: '#FFE2B8',
  window: '#2E2321',
  tire: PALETTE.night,

  tints: {
    bus: ['#FFD9C9', '#FFE8DD'],
    train: ['#E9D6F8', '#F2E6FB'],
    delivery: ['#E9D6F8', '#F2E6FB'],
    taxi: ['#EBDCD3', '#F5EBE4'],
    green: ['#D3F2DF', '#E6F8EE'],
  },
  tintLines: { bus: '#FFC4A8', train: '#D9BDF0', delivery: '#D9BDF0', taxi: '#DCCABF', green: '#B5E6C8' },

  white: '#FFFFFF',
};

const DARK = {
  bg: '#110C0B',
  surface: '#1E1614',
  surfaceSoft: '#2B201D',
  surfaceTint: '#2A1B16',
  line: '#35292A',
  outline: '#4A3A36',
  ring: 'rgba(255, 107, 53, 0.65)',
  glass: 'rgba(255, 255, 255, 0.045)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  mapChrome: 'rgba(17, 12, 11, 0.75)',
  glassLine: 'rgba(255, 255, 255, 0.08)',
  glowA: 'rgba(255, 107, 53, 0.2)',
  glowB: 'rgba(70, 90, 160, 0.22)', // the page fades to a cool blue-black at the bottom
  orange: PALETTE.orange,
  violet: PALETTE.violet,
  peach: PALETTE.peach,
  heroFrom: '#FF7B4A',
  heroTo: '#FF5D2A',
  heroShape: '#FFB59A',
  backdrop: '#1E1614',

  primary: PALETTE.orange,
  primaryLight: '#3A2016',
  primaryDeep: '#FF8A5C',
  primaryStrong: PALETTE.orange,
  primarySoft: '#2D1A13',
  accent: PALETTE.violet,
  accentText: '#C58BF0',
  accentSoft: '#2E1B40',

  ink: '#F7EEE8',
  inkSoft: '#E0D2CA',
  muted: '#A89A93', // 6.6:1 on surface
  mutedLight: '#6F625C',

  green: '#3DDC84',
  greenText: '#5BE39A',
  greenSoft: '#12301F',
  success: '#5BE39A',
  successSoft: '#12301F',
  warning: '#C58BF0',
  warningSoft: '#2E1B40',
  danger: '#FF7A8A',
  dangerSoft: '#3F1C26',

  onBright: PALETTE.night,
  glow: 'rgba(255, 107, 53, 0.35)',
  taxi: PALETTE.violet,
  headlight: '#FFE2B8',
  window: '#110C0B',
  tire: PALETTE.night,

  tints: {
    bus: ['#3A2014', '#2A180F'],
    train: ['#2E1B40', '#231532'],
    delivery: ['#2E1B40', '#231532'],
    taxi: ['#2B201D', '#201815'],
    green: ['#12331F', '#0E281A'],
  },
  tintLines: { bus: '#5A3321', train: '#4A2D66', delivery: '#4A2D66', taxi: '#3F312D', green: '#1F5A36' },

  white: PALETTE.night, // "text on ink": night on the near-white fills
};

export const THEMES = { light: LIGHT, dark: DARK };

// The live colour object every style reads. `applyTheme('dark' | 'light')` swaps its values in place, so code that
// reads COLORS when it renders (not when the file loads) always sees the current mode.
export const COLORS = { ...THEMES.light };
export function applyTheme(mode) {
  const next = THEMES[mode] || THEMES.light;
  Object.assign(COLORS, next);
  return mode in THEMES ? mode : 'light';
}

export const RADII = { xs: 10, sm: 16, md: 22, lg: 30, xl: 38, pill: 999 };

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
// elevation stays 0: on Android an elevation shadow shows as a solid rectangle behind translucent cards.
export const SHADOWS = {
  sm: { shadowColor: '#130E0D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 0 },
  md: { shadowColor: '#130E0D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 0 },
  lg: { shadowColor: '#130E0D', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 0 },
};
