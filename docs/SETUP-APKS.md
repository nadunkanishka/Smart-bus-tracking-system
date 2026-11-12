# Build the phone apps (APKs with Expo EAS)

This turns the driver app and the passenger app into installable Android apps (`.apk`). They talk to the backend over the internet, so the phones do not need to share your Wi-Fi. You need the backend online first: [SETUP-RAILWAY.md](SETUP-RAILWAY.md).

Background tracking (the driver's phone keeps sending positions with the screen off) only works in an installed build, not in Expo Go.

## Before you build (once)

1. A free **Expo account** at expo.dev.
2. The tools on your computer:

```bash
npm install -g eas-cli
eas login
```

3. A **Google Maps key**, because Android draws every map with Google's Maps SDK and shows a blank map without one:
   - Google Cloud console (console.cloud.google.com): create a project.
   - Enable **Maps SDK for Android**.
   - **APIs & Services -> Credentials -> Create credentials -> API key**. Copy it.
   - Under API restrictions choose **Restrict key** and tick only **Maps SDK for Android**. Leave application restrictions as None for now.
   - Google may ask for billing details even though this use is free.
4. Store the key on Expo, **once in each app's folder**. EAS builds run on Expo's servers, so a variable typed in your own terminal never reaches them:

```bash
cd apps/driver-app
eas env:create --name GOOGLE_MAPS_API_KEY --value <your key> --environment preview --visibility secret

cd ../passenger-app
eas env:create --name GOOGLE_MAPS_API_KEY --value <your key> --environment preview --visibility secret
```

Check it with `eas env:list --environment preview` (the value is hidden). A build with no key now stops with a message instead of producing an empty map.

## Where the backend address is set

Each app's `eas.json` has the backend address in the `preview` and `production` profiles:

```json
"preview": { "env": { "EXPO_PUBLIC_API_URL": "https://<your backend address>" }, ... }
```

**Do not rely on typing `$env:EXPO_PUBLIC_API_URL=...` before `eas build`.** The build runs on Expo's servers and never sees it: the app is then built with the emulator address (`10.0.2.2`) and says "cannot reach the server". If the backend address changes, edit it in both `eas.json` files and rebuild.

The EAS project ids are already in each app's `app.json` (`extra.eas.projectId`). If you create new EAS projects, run `eas build:configure`, which prints a project id; put it in `app.json` under `expo.extra.eas.projectId` (EAS cannot write it into `app.config.js`).

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
3. If an older copy of the app is installed, uninstall it first.

**Driver phone:**
1. Sign in with the bus registration and the bus password set in the admin dashboard (Buses). The bus must be assigned to a driver and to a route (Routes -> edit -> Assign bus).
2. Choose **Allow all the time** for location. If it only offers "while using the app", open the phone's Settings -> Apps -> SmartBus Driver -> Permissions -> Location -> **Allow all the time**.
3. Turn off battery optimisation for the app (Settings -> Apps -> SmartBus Driver -> Battery -> Unrestricted), or tracking stops when the screen is off.
4. Press **On duty**.

**Passenger phone:** create an account, pick the route and watch the bus move.

## Check it works

- The driver app shows **Server: Connected** and a GPS log that fills every 3 seconds.
- The admin dashboard shows the bus as on duty; the passenger app shows it moving with an ETA for each stop.
- The map on the driver's Route screen shows tiles and the orange route line (if it is blank, the Maps key is missing or wrong).

## Restrict the Maps key (after the first build)

The key is inside the APK and can be extracted, so restrict it. For each app run `eas credentials`, choose Android and the build profile, and read the **SHA-1 fingerprint**. In Google Cloud -> the key -> **Application restrictions -> Android apps**, add the package name and SHA-1:

| App | Package name |
|---|---|
| Driver | `lk.smartbus.driver` |
| Passenger | `lk.smartbus.passenger` |

## Testing without a build (Expo Go)

Good for checking screens against the hosted backend before spending a build. Both phones must be on the same Wi-Fi for this, and background tracking does not work in Expo Go:

```bash
cd apps/driver-app
$env:EXPO_PUBLIC_API_URL="https://<your backend address>"; npx expo start --clear
```

Scan the QR code with Expo Go. Use `--port 8082` for the passenger app if both run together, and do not pass `--clear` to both at once.

## If something goes wrong

| Problem | Cause and fix |
|---|---|
| "Cannot reach the server" in the app | The backend address was not in `eas.json` (see above); fix it and rebuild. Or the backend is down: open `<address>/api/health`. |
| Blank map on Android | No or wrong Maps key; the key was not stored with `eas env:create` in that app's folder; or **Maps SDK for Android** is not enabled. Rebuild. |
| `Cannot automatically write to dynamic config` | Put the project id in `app.json` under `expo.extra.eas.projectId`. |
| Build stops with `GOOGLE_MAPS_API_KEY is not set` | Run the `eas env:create` command above in that app's folder. |
| `The field "cli.appVersionSource" is not set` | Already set to `remote` in both `eas.json` files. |
| Driver tracking stops with the screen off | Location is not **Allow all the time**, or battery optimisation is on. |
| Install is blocked | Allow installing from your browser in Android settings. |
| Wrong data in the app after changing the backend | The address is baked in: edit `eas.json` and rebuild. |

## Release build (later)

`eas build --platform android --profile production` makes an app bundle (`.aab`) for the Play Store. For the pilot, the `preview` APK is enough.
