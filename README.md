# Smart Bus Tracking & Arrival Prediction System

Live bus tracking for Sri Lanka's public bus network. A driver's phone sends its GPS position, passengers watch the bus move on a map with an arrival time for every stop, and an admin manages routes, buses and drivers.

| Part | Folder | What it is | Opens at |
|---|---|---|---|
| Backend | `backend/` | Node.js, Express, Socket.IO, MongoDB | `http://localhost:5000` |
| Admin dashboard | `apps/admin-dashboard/` | React web app | `http://localhost:3000` |
| Driver app | `apps/driver-app/` | Expo (React Native), phone or browser | `http://localhost:8081` |
| Passenger app | `apps/passenger-app/` | Expo (React Native), phone or browser | `http://localhost:8082` |

Ignore the Vite files at the very top of the repository (`index.html`, `src/`, the root `package.json`). They are leftovers and nothing uses them.

---

## Before you start (install once)

1. **Node.js 20 or newer.** Download from <https://nodejs.org>. Check it with `node -v`.
2. **MongoDB Community Server.** Download from <https://www.mongodb.com/try/download/community>, install it with the default settings and let it run as a service. It listens on `127.0.0.1:27017`, which is where the backend looks. (MongoDB Compass, the visual tool, is optional.)
3. **Expo Go** on your phone, only if you want to try the apps on a real phone. Install it from the Play Store or App Store. The apps use **Expo SDK 57**, so keep Expo Go up to date: the store version only opens projects on its own SDK.

You do not need Redis or Docker. Without Redis the backend keeps the latest bus positions in memory, which is fine for development.

---

## Run everything, step by step

You will use **four terminal windows**, one per part. Keep them all open while you work. Start them in this order, and **start the two Expo apps one at a time**, waiting for the first to print its QR code before starting the second (starting both together can crash one with a cache error).

All commands are run from the project folder, `Smart-bus-tracking-system`.

### Step 1: Backend (terminal 1)

```bash
cd backend
npm install
```

Create the settings file. On Windows (Command Prompt):

```bash
copy .env.example .env
```

On Mac or Linux:

```bash
cp .env.example .env
```

Open `backend/.env` and set two values. Everything else can stay as it is.

```
JWT_SECRET=type-any-long-random-text-here
ADMIN_PASSWORD=choose-a-password-for-the-admin
```

Add the demo route (Route 138 with a road line and stops on the map). You only need this once. It is safe to run again:

```bash
npm run seed
```

Start the server:

```bash
npm start
```

You should see that it is listening on port 5000 and connected to MongoDB. To check, open <http://localhost:5000/api/health> in a browser. It should show `"status":"ok"` and `"mongo":"connected"`.

> **The admin account** is created the very first time the server starts, from `ADMIN_USERNAME` (default `admin`) and `ADMIN_PASSWORD`. Changing `ADMIN_PASSWORD` later does not change an account that already exists.

### Step 2: Admin dashboard (terminal 2)

```bash
cd apps/admin-dashboard
npm install
npm start
```

Your browser opens <http://localhost:3000>. Sign in with the admin username and the `ADMIN_PASSWORD` you chose.

**Create a bus for the driver app.** The driver app signs in as a bus, so one must exist first:

1. Open **Buses** and choose **Add New Bus**.
2. Enter a registration number (for example `NB-4712`), seats, mileage and a **bus password**. Remember both: the driver signs in with them.
3. Open **Routes**, edit **Route 138** and pick your bus in **Assign Bus (From Fleet)**.

### Step 3: Driver app (terminal 3)

```bash
cd apps/driver-app
npm install
npx expo start --port 8081
```

Open it one of two ways:

- **In the browser:** press `w` in the terminal (or go to <http://localhost:8081>).
- **On a phone:** see "Using a real phone" below first, then scan the QR code with Expo Go (Android) or the Camera app (iPhone).

Sign in with the **bus registration** and **bus password** from Step 2. Then tap the big **On Duty** button to start sending the bus's position.

### Step 4: Passenger app (terminal 4)

Start this after the driver app has printed its QR code.

```bash
cd apps/passenger-app
npm install
npx expo start --port 8082
```

Open it the same way: press `w`, or go to <http://localhost:8082>, or scan the QR code.

Choose **Create an account**, register, and sign in. Pick Route 138, and you will see the bus on the map as soon as a driver is on duty.

---

## Using a real phone

On a phone, `localhost` means the phone itself, not your computer, so the apps need your computer's address.

1. Put the phone and the computer on the **same Wi-Fi**.
2. Find your computer's address. On Windows run `ipconfig` and read **IPv4 Address** (for example `192.168.8.168`). On Mac run `ipconfig getifaddr en0`.
3. In **each** app folder (`apps/driver-app` and `apps/passenger-app`), create a file named `.env` containing:

   ```
   EXPO_PUBLIC_API_URL=http://192.168.8.168:5000
   ```

   Use your own address, not this example. The file `.env.example` in each folder shows the format.
4. Stop the app (`Ctrl+C`) and start it again with `npx expo start -c --port 8081` (use `--port 8082` for the passenger app). The `-c` clears the cache so the new address is picked up.
5. If Windows Firewall asks about Node.js, choose **Allow**.

The Android emulator needs nothing extra. It reaches your computer at `10.0.2.2` automatically.

---

## Stopping and starting again

- Stop any part with `Ctrl+C` in its terminal.
- Next time, you do **not** repeat `npm install`, `.env` or `npm run seed`. Just start MongoDB (it usually starts with Windows), then run the four start commands again in order:
  `npm start` in `backend`, `npm start` in `apps/admin-dashboard`, `npx expo start --port 8081` in `apps/driver-app`, `npx expo start --port 8082` in `apps/passenger-app`.

---

## If something goes wrong

| What you see | What it means and what to do |
|---|---|
| **"Cannot reach the server. Check your connection and try again."** | The app cannot find the backend. Check Step 1 is still running and <http://localhost:5000/api/health> opens. On a real phone, follow "Using a real phone". |
| Backend prints a MongoDB error or `"mongo":"disconnected"` | MongoDB is not running. Start the **MongoDB** service (Windows: Services, or reinstall with "Run as a service" ticked), then restart the backend. |
| Admin sign-in says "Invalid username or password" | The admin account was created with an earlier password. Use that one, or ask for a reset. |
| Driver sign-in fails | Use the **bus registration and bus password** you created in the dashboard, not the admin login. The bus must also be assigned to a route. |
| Driver app says the bus has no route with a map path and stops | Run `npm run seed` in `backend`, then assign the bus to Route 138 in the dashboard. |
| Expo crashes at start with `ENOENT … native-modules-cache` | Two Expo apps started at the same moment. Start them one at a time. If it keeps happening, delete the folder `native-modules-cache` inside `.expo` in your user folder. |
| Expo says port 8081 or 8082 is already in use | An old copy is still running. Close its terminal, or use another port, for example `--port 8083`. |
| Expo Go says the project is incompatible, or asks for a different SDK | The app and Expo Go are on different SDK versions. The apps are on SDK 57: update Expo Go from the store. If you change the SDK later, run `npx expo install expo@^NN.0.0` then `npx expo install --fix` in both app folders. |
| Phone cannot load the app at all | Phone and computer must be on the same Wi-Fi. Corporate and guest Wi-Fi often block this; use your phone's hotspot instead. |
| `Missing script: "dev"` in the admin dashboard | Use `npm start`. |
| Buses on the map seem stuck | The driver must be **On Duty** with GPS allowed. In a desktop browser the position only changes if you move or use the simulator below. |

---

## Try it without a phone (simulated buses)

With the backend running, this makes three fake buses drive along a route for two minutes:

```bash
cd backend
npm run replay -- --route RT-001 --buses 3 --duration 120
```

Replace `RT-001` with the route id shown in the dashboard's Routes table. To remove the simulated data afterwards, run `npm run clear-sim`.

---

## For developers

**Tests**

```bash
cd backend && npm test                              # ETA engine, GPS pipeline, API
cd apps/admin-dashboard && npm test -- --watchAll=false
```

**The design system.** Colours, type, radii and shadows live in `shared/tokens.js`. The shared mobile components live in `shared/native/`, the bus illustrations in `shared/buses/`, and the navigation icons in `shared/navIcons.js`. After changing anything in `shared/`, copy it into the apps:

```bash
node shared/sync.js
```

To regenerate the 3D bus images (needs Edge or Chrome installed):

```bash
node shared/buses/export.mjs
node shared/sync.js
```

Open `shared/buses/export.html` in a browser to preview every bus image.

**Documentation**

| Document | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture diagram, data flow, ETA engine, offline buffer |
| [docs/API.md](docs/API.md) | REST endpoints and Socket.IO events |
| [docs/DATABASE.md](docs/DATABASE.md) | MongoDB collections, indexes and Redis keys |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, Redis, Render hosting, driver APK build |
| [docs/EVALUATION.md](docs/EVALUATION.md) | Measuring latency, ETA accuracy and load; user study |
