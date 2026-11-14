# Shared design system

The single source for everything the three apps have in common. The apps cannot import from here directly (Metro and Create React App only read files inside their own folder), so `sync.js` copies these files into each app.

```bash
node shared/sync.js              # from the repository root; also: npm run sync
```

Run it after every change in this folder, and commit the copies together with the source.

| Path | Contents | Copied to |
|---|---|---|
| `tokens.js` | The "Ember" palette (night, cream, orange, violet; red only for alerts) in a light and a dark set, plus type scale, radii, spacing, shadows | mobile `src/shared/theme.js`; admin `src/design/tokens.css` (generated CSS variables, light `:root` plus a dark block) |
| `native/themeRuntime.js` | Mobile light/dark mode: `ThemeProvider`, `useTheme()`, `createStyles()` | mobile `src/shared/` |
| `native/ui.js` | Mobile UI kit: buttons, fields, layouts, dock; `TOP_INSET` (the one top inset) and `type()` | mobile `src/shared/` |
| `native/shell.js` | Mobile app shell: `AppFrame` (safe area, backdrop, status bar, toast), `AppColumn`, `useToast`, `ProfileRow`, `SettingsPage` (header, Appearance, About, sign out around the app's own sections), `COMMON_STYLES` | mobile `src/shared/` |
| `contract.js` | Event names, statuses, ids and timing windows shared by the server and the three clients | mobile `src/shared/`, admin `src/design/`, CommonJS copy at `backend/lib/contract.js` |
| `native/icons.js` | Mobile icon components, wrappers around Lucide (`lucide-react-native`) with the old `{ color, size }` props | mobile `src/shared/` |
| `native/LiveMap.js`, `LiveMap.native.js` | Map for web and for phones | mobile `src/shared/` |
| `native/api.js` | Backend address, `request` (one "cannot reach" message for network errors), `toRoute`, `isActiveRoute` | mobile `src/shared/` |
| `native/busImages.js`, `web/busImages.js` | Lookup from a bus name to its image | mobile `src/shared/`, admin `src/design/` |
| `web/Vehicle.js` | Vehicle illustration component for the admin | admin `src/design/` |
| `vehicleShapes.js`, `busMarkers.js` | Vehicle definitions, map markers | all three apps |
| `buses/out/` | The baked bus and scene images | mobile `assets/buses/`, admin `src/design/buses/` |
| `buses/clay.js`, `export.mjs`, `export.html` | Renders the bus images (needs Edge or Chrome) | not copied |

To regenerate the images: `node shared/buses/export.mjs`, then `node shared/sync.js`. Open `buses/export.html` in a browser to preview them.

## Light and dark mode

`tokens.js` holds one colour set per mode with the same names. `COLORS` is a live object: `applyTheme(mode)` swaps its values in place.

- Mobile: wrap the app in `<ThemeProvider>`. Build styles with `createStyles(() => StyleSheet.create({ ... }))` and call the returned hook in the component (a plain `StyleSheet.create` at import time would freeze the first mode). Every component `native/ui.js` exports is declared through `themed()`, which subscribes it to the theme so it re-renders on a switch; `shared/test/kit.test.mjs` fails on a plain `export function` there. The choice is saved through AsyncStorage (on the web that is `localStorage`, read synchronously for the first paint); until one is made the phone's setting is followed.
- The ease-out curve is `EASE_OUT` in `tokens.js`: the kit, the web map and the admin's `--ease-out` variable all read it.
- Admin: `src/theme.js` sets `data-theme` on `<html>` and saves the choice; the generated `tokens.css` carries the dark values. Without a saved choice, `prefers-color-scheme` decides.
- Two rules: `ink` and `white` swap in dark mode (so ink-filled buttons keep their contrast), and text on an orange or violet fill must use `onBright`, never `ink` or `white`.
- Map tiles are OpenStreetMap everywhere (Carto's basemaps need a key). The web maps recolour them with a CSS filter (grey, or inverted dark); the native map dims them in dark mode. The route line is orange.
- Bus colours: `shared/buses/clay.js` defines the liveries in palette colours. After changing them run `node shared/buses/export.mjs`, then `node shared/sync.js`.
- Icons are Lucide everywhere: `lucide-react` in the admin (`src/components/Icon.js` maps the page icon names to Lucide components) and `lucide-react-native` on mobile (`native/icons.js`, and the dock's `NavIcon` in `native/ui.js`).
- Font: Urbanist on the web builds (admin and the Expo web export). Native keeps the system font, so no font file has to ship.
- Green (`green`, `greenText`, `greenSoft`) is the status colour for anything active or live. It is not a brand colour: use it for running buses, connected servers and drivers on duty, nothing else.

## Motion and settings parts in `native/ui.js`

- `Tap` replaces `TouchableOpacity`: scale(0.97) on press and the keyboard focus ring (on the web the release eases back in 160ms). Use it for anything pressable that is not a `Button`.
- `ScreenFade` (key it by tab), `Reveal` (list entrance, 40ms stagger, first six only), `Toast` (slides and fades) and `SheetModal` (backdrop fades while the sheet rises; use it instead of React Native's `Modal` with `animationType="slide"`). All respect reduced motion.
- `Segmented`, `SettingsSection` and `SettingsRow` build the Settings screens; `SettingsPage` in `native/shell.js` puts them together the same way in both apps. The admin has its own `SettingsPage` and a CSS `.segmented` control.

## Tests

`npm run test:apps` (repository root, Node 22+) runs `shared/test/*.test.mjs` with `node:test`. `shared/test/register.mjs` adds module hooks so Node can load the Metro-style app source (extensionless imports, a `react-native` stub with only `Platform`). The tests cover `pickBus`/`trackedSummary`, `toRoute`/`request`, the driver's `telemetryCore` and `utils`, and the kit rules above. `npm test` runs them after the backend and admin tests.
- The admin dashboard (`pages/DashboardPage.js`) fits the window with no scrolling (`.page-scroll.fit`); on windows shorter than 760px or narrower than 1100px it falls back to scrolling.

## Mobile screens follow the dashboard

- `AppBackdrop` (first child of each app) draws the dashboard's page: base colour with an orange glow top-left and a cool glow bottom-right. `OverlapHeader` and `OverlapSheet` are plain containers (no coloured block, no curved sheet), so titles sit on the glowing page. Cards use `COLORS.glass` with a hairline border; cards that sit over a map stay opaque (`COLORS.surface`).
- `NotchStat` is the dashboard's small stat card (label, big number, coloured pill). `GradientCard tint="hero"` is the orange card.
- Animated pieces (all react-native `Animated`, no extra dependency, all still with reduced motion): `FloatingDock` (the orange circle slides between tabs), `CountUp`, `RingGauge`, `LiveDot`, `ProgressTrack`, plus `Reveal` for staggered entrances.
