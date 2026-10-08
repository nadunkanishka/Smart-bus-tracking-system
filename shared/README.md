# Shared design system

The single source for everything the three apps have in common. The apps cannot import from here directly (Metro and Create React App only read files inside their own folder), so `sync.js` copies these files into each app.

```bash
node shared/sync.js              # from the repository root; also: npm run sync
```

Run it after every change in this folder, and commit the copies together with the source.

| Path | Contents | Copied to |
|---|---|---|
| `tokens.js` | Colours, type scale, radii, spacing, shadows | mobile `src/shared/theme.js`; admin `src/design/tokens.css` (generated CSS variables) |
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
