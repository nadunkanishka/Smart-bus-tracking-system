// SmartBus mobile design tokens: a flat, two-colour skin (black and orange on white), no gradients, no glow, no shadows.
// `npm run sync` copies this into both phone apps (src/shared/theme.js). The admin dashboard has its own tokens in
// adminTokens.json, which sync.js turns into CSS variables.

// Orange is the one action colour, black the one strong colour. Green marks anything active or live (a running bus, a
// connected server): a status colour, not a brand colour. Red is only for destructive actions.
export const PALETTE = { night: '#0E0E0F', orange: '#FF7A00', red: '#D92D20', green: '#1FA95B' };

// Semantic names stay the same in both modes. Rules the apps rely on:
//   ink / white are "strongest foreground" / "text on ink": they swap in dark mode, so ink-filled buttons stay readable.
//   onBright is always night: text on orange, never `ink` or `white` (white on this orange is 2.7:1, night is 8:1).
//   card / onCard: the black card (a hero, a stat) and its text; in dark mode the card is a lighter grey than the page.
const LIGHT = {
  bg: '#FFFFFF',
  surface: '#F5F5F6', // cards and rows
  surfaceSoft: '#ECECEE', // inactive pills, inputs, tracks
  line: '#E6E6E9',
  outline: '#CFCFD4', // input borders
  ring: 'rgba(14, 14, 15, 0.45)', // keyboard focus ring
  glass: '#F5F5F6', // kept as the card fill name used across the screens: flat, not translucent
  scrim: 'rgba(14, 14, 15, 0.4)', // behind sheets and dialogs
  mapChrome: 'rgba(255, 255, 255, 0.8)',
  glassLine: 'rgba(14, 14, 15, 0)', // no card borders
  glowA: 'rgba(0, 0, 0, 0)',
  glowB: 'rgba(0, 0, 0, 0)',
  orange: PALETTE.orange,
  violet: PALETTE.night, // the "second voice" of the old skin is black now: destination dots, highlights
  heroFrom: PALETTE.orange,
  heroTo: PALETTE.orange,
  heroShape: PALETTE.orange,
  backdrop: PALETTE.orange,

  primary: PALETTE.orange,
  primaryLight: '#FFE5CC',
  primaryDeep: '#A64B00',
  primaryStrong: PALETTE.orange,
  primarySoft: '#FFF0E0',
  accent: PALETTE.night,
  accentText: '#0E0E0F',
  accentSoft: '#ECECEE',

  ink: PALETTE.night,
  inkSoft: '#2A2A2C',
  muted: '#76767C', // 4.6:1 on white
  mutedLight: '#B1B1B7', // decorative only

  card: PALETTE.night,
  onCard: '#FFFFFF',
  cardMuted: '#A6A6AC',

  green: PALETTE.green,
  greenSoft: '#DDF3E6',
  success: '#0E7A3F',
  successSoft: '#DDF3E6',
  warning: '#A64B00',
  warningSoft: '#FFE5CC',
  danger: PALETTE.red,
  dangerSoft: '#FDE4E1',

  onBright: PALETTE.night,
  glow: 'rgba(0, 0, 0, 0)',

  tints: { bus: ['#F5F5F6', '#F5F5F6'] },
  tintLines: { bus: '#F5F5F6' },

  white: '#FFFFFF',
};

const DARK = {
  bg: '#0B0B0C',
  surface: '#161618',
  surfaceSoft: '#232326',
  line: '#2B2B2F',
  outline: '#3C3C42',
  ring: 'rgba(255, 122, 0, 0.7)',
  glass: '#161618',
  scrim: 'rgba(0, 0, 0, 0.6)',
  mapChrome: 'rgba(11, 11, 12, 0.8)',
  glassLine: 'rgba(255, 255, 255, 0)',
  glowA: 'rgba(0, 0, 0, 0)',
  glowB: 'rgba(0, 0, 0, 0)',
  orange: PALETTE.orange,
  violet: '#F4F4F5',
  heroFrom: PALETTE.orange,
  heroTo: PALETTE.orange,
  heroShape: PALETTE.orange,
  backdrop: PALETTE.orange,

  primary: PALETTE.orange,
  primaryLight: '#3A2410',
  primaryDeep: '#FFA24D',
  primaryStrong: PALETTE.orange,
  primarySoft: '#2A1A0C',
  accent: '#F4F4F5',
  accentText: '#F4F4F5',
  accentSoft: '#232326',

  ink: '#F4F4F5',
  inkSoft: '#D8D8DC',
  muted: '#9E9EA6', // 6.6:1 on surface
  mutedLight: '#5F5F66',

  card: '#2A2A2E',
  onCard: '#FFFFFF',
  cardMuted: '#A6A6AC',

  green: '#35D07F',
  greenSoft: '#12301F',
  success: '#5BE39A',
  successSoft: '#12301F',
  warning: '#FFA24D',
  warningSoft: '#3A2410',
  danger: '#FF7A6E',
  dangerSoft: '#3F1C1A',

  onBright: PALETTE.night,
  glow: 'rgba(0, 0, 0, 0)',

  tints: { bus: ['#161618', '#161618'] },
  tintLines: { bus: '#161618' },

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

// Rounder than before: cards 28, big blocks 32, controls are pills.
export const RADII = { sm: 16, md: 20, lg: 28, xl: 32, pill: 999 };

export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

// The strong ease-out every press, toast and switch uses: cubic-bezier control points.
export const EASE_OUT = [0.23, 1, 0.32, 1];

// Type scale: one fixed size + line-height + weight per role. Headings are large and tight, like the reference.
export const TYPE = {
  display: { fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.2 },
  h1: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.8 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8 },
};

// Flat: no shadows. Cards separate from the page by colour, not by depth. (The keys stay so style code does not change.)
const NONE = { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
export const SHADOWS = { sm: NONE, md: NONE, lg: NONE };
