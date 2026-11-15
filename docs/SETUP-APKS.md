# Build the phone apps (APKs with Expo EAS)

This turns the driver app and the passenger app into installable Android apps (`.apk`). They talk to the backend over the internet, so the phones do not need to share your Wi-Fi. You need the backend online first: [SETUP-RAILWAY.md](SETUP-RAILWAY.md).

The driver app tracks while it is open, with the screen kept awake. Tracking with the screen off is switched off for now (`BACKGROUND_TRACKING` in `apps/driver-app/src/services/telemetry.js`): the Android background service crashed an installed build and has not been verified on a phone yet.

## Before you build (once)

1. A free **Expo account** at expo.dev.
2. The tools on your computer:

```bash
npm install -g eas-cli
eas login
```

The maps need no key: both apps draw Esri light and dark gray map tiles with the route, stops and buses on top, so there is nothing to set up with Google. The route is fitted on screen to start with; drag to move the map, pinch or use + and - to zoom, and Fit brings the whole route back. The phone needs an internet connection to load the tiles.

## Where the backend address is set

Each app's `eas.json` has the backend address in the `preview` and `production` profiles:

```json
"preview": { "env": { "EXPO_PUBLIC_API_URL": "https://<your backend address>" }, ... }
```

**Do not rely on typing `$env:EXPO_PUBLIC_API_URL=...` before `eas build`.** The build runs on Expo's servers and never sees it: the app is then built with the emulator address (`10.0.2.2`) and says "cannot reach the server". If the backend address changes, edit it in both `eas.json` files and rebuild.

The EAS project ids are already in each app's `app.json` (`extra.eas.projectId`). If you create new EAS projects, run `eas build:configure`, which prints a project id; put it in `app.json` under `expo.extra.eas.projectId`.

## Build the driver app

```bash
cd apps/driver-app
eas build --platform android --profile preview
```

- It may ask to generate an Android keystore: say **yes** and let EAS manage it.
- It uploads the project and queues the build. The free queue can take from a few minutes to over an hour; the build itself takes about 10 to 15 minutes. It prints a link to watch progress.
- When it finishes the page has an **Install** button and a QR code.

## Build the passenger app

```bash
cd apps/passenger-app
eas build --platform android --profile preview
```

Same steps. You can run both builds at the same time in two terminals.

## Install on the phones

1. Open the build page on the phone (from the link, or the QR code) and download the APK.
2. Android asks to allow installing from your browser: allow it.
3. A build made before the version code started rising (the first ones were all version code 1) has to be uninstalled once. Newer builds install over the old app and keep its data.

**Driver phone:**
1. Sign in with the bus registration and the bus password set in the admin dashboard (Buses). The bus must be assigned to a driver and to a route (Routes -> edit -> tick the bus under "Buses on this route", or Buses -> edit).
2. Allow location while using the app, and keep the app open on the duty screen (the screen stays on while you are on duty).
3. Press **On duty**.

**Passenger phone:** create an account, pick the route and watch the bus move.

## Check it works

- The driver app shows **Server: Connected** and a GPS log that fills every 3 seconds.
- The admin dashboard shows the bus as on duty; the passenger app shows it moving with an ETA for each stop.
- The map on the driver's Route screen shows tiles and the orange route line. If it stays grey, the phone has no internet or cannot reach server.arcgisonline.com.

## The two app icons

The passenger app is an orange tile with a bus; the driver app is a dark tile with an orange steering wheel, so the two are easy to tell apart on a phone. They are drawn by `python shared/icons/make_icons.py` (needs Pillow) into each app's `assets/` folder; change the drawing there and run it again.

## Updating without reinstalling

Two things keep the installed app in place:

- **Update over the old app.** Both `eas.json` files have `autoIncrement`, so every build gets a higher version code and Android installs it over the existing app, keeping its data. Do not uninstall first. (An old build with the same version code, like the first ones, has to be uninstalled once.)
- **Send changes with no build at all.** Most changes are JavaScript (screens, map, calls to the backend). Publish them from the app's folder:

```bash
cd apps/passenger-app
eas update --channel preview --message "what changed"
cd ../driver-app
eas update --channel preview --message "what changed"
```

The installed app downloads the update the next time it opens (close it fully and open it again; the second open runs the new version). It is free.

A **new build** is still needed when something native changes: a new native package, a permission, the icon or other native settings in `app.json`, or an Expo SDK upgrade. Updates only reach builds with the same app `version` (`runtimeVersion` follows `version` in `app.json`), so raise `version` when you make a native change and rebuild.

The first build after this setup is the one that can receive updates, so build once more and install it.

## Testing without a build (Expo Go)

Good for checking screens against the hosted backend before spending a build. Both phones must be on the same Wi-Fi for this, and the phone must stay awake:

```bash
cd apps/driver-app
$env:EXPO_PUBLIC_API_URL="https://<your backend address>"; npx expo start --clear
```

Scan the QR code with Expo Go. Use `--port 8082` for the passenger app if both run together, and do not pass `--clear` to both at once.

## If something goes wrong

| Problem | Cause and fix |
|---|---|
| "Cannot reach the server" in the app | The backend address was not in `eas.json` (see above); fix it and rebuild. Or the backend is down: open `<address>/api/health`. |
| Grey or empty map | No internet on the phone, or the tile server is blocked on that network. Try mobile data. The route line and buses appear on top of the tiles once they load. |
| `Cannot automatically write to dynamic config` | Put the project id in `app.json` under `expo.extra.eas.projectId`. |
| `The field "cli.appVersionSource" is not set` | Already set to `remote` in both `eas.json` files. |
| Tracking stops when the phone is locked or the app is closed | Expected for now: positions are taken while the app is open. Keep it open on the duty screen (a phone holder and a charger help). |
| Install is blocked | Allow installing from your browser in Android settings. |
| Wrong data in the app after changing the backend | The address is baked in: edit `eas.json` and rebuild. |

## Release build (later)

`eas build --platform android --profile production` makes an app bundle (`.aab`) for the Play Store. For the pilot, the `preview` APK is enough.
