# Shared design system

The single source for everything the three apps have in common. The apps cannot import from here directly (Metro and Create React App only read files inside their own folder), so `sync.js` copies these files into each app.

```bash
node shared/sync.js              # from the repository root; also: npm run sync
```

Run it after every change in this folder, and commit the copies together with the source.

| Path | Contents | Copied to |
|---|---|---|
| `tokens.js` | The palette (ink, paper, lime, ember) in a light and a dark set, plus type scale, radii, spacing, shadows | mobile `src/shared/theme.js`; admin `src/design/tokens.css` (generated CSS variables, light `:root` plus a dark block) |
| `native/themeRuntime.js` | Mobile light/dark mode: `ThemeProvider`, `useTheme()`, `createStyles()` | mobile `src/shared/` |
| `native/ui.js` | Mobile UI kit: buttons, fields, layouts, dock | mobile `src/shared/` |
| `native/icons.js` | Mobile icon components | mobile `src/shared/` |
| `native/LiveMap.js`, `LiveMap.native.js` | Map for web and for phones | mobile `src/shared/` |
| `native/api.js` | Backend address and request helper | mobile `src/shared/` |
| `native/busImages.js`, `web/busImages.js` | Lookup from a bus name to its image | mobile `src/shared/`, admin `src/design/` |
| `web/Vehicle.js` | Vehicle illustration component for the admin | admin `src/design/` |
| `vehicleShapes.js`, `navIcons.js`, `busMarkers.js` | Vehicle definitions, navigation icons, map markers | all three apps |
| `buses/out/` | The baked bus and scene images | mobile `assets/buses/`, admin `src/design/buses/` |
| `buses/clay.js`, `export.mjs`, `export.html` | Renders the bus images (needs Edge or Chrome) | not copied |

To regenerate the images: `node shared/buses/export.mjs`, then `node shared/sync.js`. Open `buses/export.html` in a browser to preview them.

## Light and dark mode

`tokens.js` holds one colour set per mode with the same names. `COLORS` is a live object: `applyTheme(mode)` swaps its values in place.

- Mobile: wrap the app in `<ThemeProvider>`. Build styles with `createStyles(() => StyleSheet.create({ ... }))` and call the returned hook in the component (a plain `StyleSheet.create` at import time would freeze the first mode). Components that read `COLORS` while rendering call `useTheme()` so they re-render on a switch. The choice is saved; until one is made the phone's setting is followed.
- Admin: `src/theme.js` sets `data-theme` on `<html>` and saves the choice; the generated `tokens.css` carries the dark values. Without a saved choice, `prefers-color-scheme` decides.
- Two rules: `ink` and `white` swap in dark mode (so ink-filled buttons keep their contrast), and text on a lime or ember fill must use `onBright`, never `ink`.
- Map tiles are OpenStreetMap everywhere. The web maps recolour them with a CSS filter (grey, or inverted dark); the native map dims them in dark mode.
- Bus colours: `shared/buses/clay.js` defines the liveries in palette colours. After changing them run `node shared/buses/export.mjs`, then `node shared/sync.js`.
