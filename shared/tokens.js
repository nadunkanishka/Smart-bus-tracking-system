// SmartBus mobile design tokens: "Studio". Charcoal and white surfaces, big flat colour blocks (royal blue, white, black),
// light-weight oversized type, and orange as the accent only (actions, the live bus, the route line, key numbers).
// No gradients, no glow, no shadows. `npm run sync` copies this into both phone apps (src/shared/theme.js). The admin
// dashboard has its own tokens in adminTokens.json, which sync.js turns into CSS variables.

// Green marks anything active or live (a running bus, a connected server): a status colour, not a brand colour.
// Red is only for destructive actions.
export const PALETTE = { night: '#101114', orange: '#FF5A1F', blue: '#4562D9', red: '#D92D20', green: '#1FA95B' };

// Semantic names stay the same in both modes. Rules the apps rely on:
//   ink / white are "strongest foreground" / "text on ink": they swap in dark mode, so ink-filled buttons stay readable.
//   onBright is always night: text on the orange accent (white on this orange is 3.1:1, night is 6.6:1).
//   card / onCard: the black block (a hero, a stat) and its text. blue / onBlue: the blue block and its white text.
const LIGHT = {
  bg: '#ECECEF',
  surface: '#FFFFFF', // cards and rows
  surfaceSoft: '#E3E3E8', // inputs, inactive pills, tracks
  line: '#DADADF',
  outline: '#C9C9D1',
  ring: 'rgba(255, 90, 31, 0.6)', // keyboard focus ring
  glass: '#FFFFFF',
  scrim: 'rgba(16, 17, 20, 0.45)', // behind sheets and dialogs
  mapChrome: 'rgba(255, 255, 255, 0.85)',
  glassLine: 'rgba(16, 17, 20, 0)', // blocks have no border
  glowA: 'rgba(0, 0, 0, 0)',
  glowB: 'rgba(0, 0, 0, 0)',
  orange: PALETTE.orange,
  violet: PALETTE.blue, // destination dots and the "second voice"
  heroFrom: PALETTE.orange,
  heroTo: PALETTE.orange,
  heroShape: PALETTE.orange,
  backdrop: PALETTE.orange,

  primary: PALETTE.orange,
  primaryLight: '#FFDFD2',
  primaryDeep: '#B53A0A',
  primaryStrong: PALETTE.orange,
  primarySoft: '#FFEFE8',
  accent: PALETTE.blue,
  accentText: '#3550C4',
  accentSoft: '#DDE3FA',

  blue: PALETTE.blue,
  blueSoft: '#DDE3FA',
  onBlue: '#FFFFFF',

  ink: '#16171B',
  inkSoft: '#34353C',
  muted: '#6B6D77', // 4.9:1 on white
  mutedLight: '#B3B5BE', // decorative only

  card: PALETTE.night,
  onCard: '#FFFFFF',
  cardMuted: '#9A9CA6',

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

  tints: { bus: ['#FFFFFF', '#FFFFFF'] },
  tintLines: { bus: '#FFFFFF' },

  white: '#FFFFFF',
};

const DARK = {
  bg: '#17181C',
  surface: '#222328',
  surfaceSoft: '#2D2E35',
  line: '#34353C',
  outline: '#44454E',
  ring: 'rgba(255, 90, 31, 0.75)',
  glass: '#222328',
  scrim: 'rgba(0, 0, 0, 0.62)',
  mapChrome: 'rgba(23, 24, 28, 0.85)',
  glassLine: 'rgba(255, 255, 255, 0)',
  glowA: 'rgba(0, 0, 0, 0)',
  glowB: 'rgba(0, 0, 0, 0)',
  orange: PALETTE.orange,
  violet: '#6F88F2',
  heroFrom: PALETTE.orange,
  heroTo: PALETTE.orange,
  heroShape: PALETTE.orange,
  backdrop: PALETTE.orange,

  primary: PALETTE.orange,
  primaryLight: '#4A2415',
  primaryDeep: '#FF9166',
  primaryStrong: PALETTE.orange,
  primarySoft: '#33201A',
  accent: '#6F88F2',
  accentText: '#8FA3F6',
  accentSoft: '#26305E',

  blue: PALETTE.blue,
  blueSoft: '#26305E',
  onBlue: '#FFFFFF',

  ink: '#F5F5F7',
  inkSoft: '#D6D6DB',
  muted: '#9A9CA6', // 6.1:1 on surface
  mutedLight: '#5C5E68',

  card: '#0E0F12',
  onCard: '#FFFFFF',
  cardMuted: '#9A9CA6',

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

  tints: { bus: ['#222328', '#222328'] },
  tintLines: { bus: '#222328' },

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

// Big soft blocks: cards 28, hero blocks 36, controls are pills.
export const RADII = { sm: 16, md: 22, lg: 28, xl: 36, pill: 999 };

export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

// The strong ease-out every press, toast and switch uses: cubic-bezier control points.
export const EASE_OUT = [0.23, 1, 0.32, 1];

// Type scale: light, large and tight for the headings and numbers (the look of the reference), medium for labels.
// One fixed size + line-height + weight per role.
export const TYPE = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '300', letterSpacing: -1.4 },
  h1: { fontSize: 30, lineHeight: 34, fontWeight: '400', letterSpacing: -0.8 },
  h2: { fontSize: 24, lineHeight: 29, fontWeight: '400', letterSpacing: -0.5 },
  h3: { fontSize: 19, lineHeight: 24, fontWeight: '500', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8 },
};

// Flat: no shadows. Blocks separate from the page by colour, not by depth. (The keys stay so style code does not change.)
const NONE = { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
export const SHADOWS = { sm: NONE, md: NONE, lg: NONE };
