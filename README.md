# 🚌 Smart Bus Tracking & Arrival Prediction System

Welcome! This is a complete system for tracking buses in real time. It broadcasts live bus locations from a driver's phone to an online map so passengers can see where their bus is and when it will arrive.

---

## 🧩 What Is In This Project?

This workspace contains **4 main parts**:

| Component           | Directory               | What It Does                                                                                          |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Backend**         | `/backend`              | The brain/server. It receives location data from the driver and sends it to passengers and the admin. |
| **Driver App**      | `/apps/driver-app`      | A mobile app for the bus driver that sends their phone's GPS location every 3 seconds.                |
| **Passenger App**   | `/apps/passenger-app`   | A mobile/web app for commuters to view live buses on a map and check arrival times.                   |
| **Admin Dashboard** | `/apps/admin-dashboard` | A web panel for managers to manage routes, bus stops, and monitor active buses.                       |

---

## 🧰 Prerequisites (What You Need First)

Before starting, make sure you have installed:

1. **Node.js** (Version 18 or higher) – [Download here](https://nodejs.org/)
2. **Expo Go App** on your mobile phone:

- 🤖 [Get it on Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- 🍎 [Get it on Apple App Store](https://www.google.com/search?q=https://apps.apple.com/app/expo-go/id982107779)

3. **Same Wi-Fi Network**: Make sure your laptop and your mobile phone are connected to the **exact same Wi-Fi network**.

---

## 🚀 How to Run the Project (Step-by-Step)

To run the full system, you will need to open **4 separate terminal windows** (one for each part).

### Step 1: Start the Backend Server

1. Open Terminal #1 and go to the backend folder:

```bash
cd backend

```

2. Install dependencies (only needed the first time):

```bash
npm install

```

3. Start the server:

```bash
npm run dev

```

> 🟢 Your backend is now running at `http://localhost:5000`.

---

### Step 2: Start the Driver Mobile App

1. Open Terminal #2 and go to the driver app folder:

```bash
cd apps/driver-app

```

2. Install dependencies (only needed the first time):

```bash
npm install

```

3. Start the app:

```bash
npx expo start -c

```

4. **Open on your phone:** Open the **Expo Go** app on your mobile phone and scan the **QR code** printed in your terminal.
   _(Or press `w` in your terminal to test it in your PC web browser)._

---

### Step 3: Start the Passenger Mobile App

1. Open Terminal #3 and go to the passenger app folder:

```bash
cd apps/passenger-app

```

2. Install dependencies (only needed the first time):

```bash
npm install

```

3. Start the app:

```bash
npx expo start -c

```

4. **Open on your phone:** Open **Expo Go** on your phone and scan the new QR code.
   _(Or press `w` to view it in your browser)._

---

### Step 4: Start the Admin Web Dashboard

1. Open Terminal #4 and go to the admin dashboard folder:

```bash
cd apps/admin-dashboard

```

2. Install dependencies (only needed the first time):

```bash
npm install

```

3. Start the web app:

```bash
npm start

```

4. Open your browser and go to `http://localhost:3000` (or `http://localhost:5173`).

---

## ⚠️ Important Setup for Mobile Phones

When running the app on a physical phone, `localhost` refers to your phone, not your computer. You must connect the apps using your laptop's **IP Address**.

### How to find your Laptop's IP Address:

- **Windows**: Open Command Prompt and type `ipconfig`. Look for **IPv4 Address** (e.g., `192.168.1.15`).
- **Mac**: Open Terminal and type `ipconfig getifaddr en0`.

### Update Code to Connect:

In both `driver-app` and `passenger-app`, look for where the socket connects and replace `localhost` with your IP address:

```javascript
// Replace 192.168.1.15 with YOUR computer's IP address
const socket = io("http://192.168.1.15:5000");
```

---

## ❓ Common Troubleshooting

### 1. `npm error Missing script: "dev"`

If running `npm run dev` in `apps/admin-dashboard` throws an error, use `npm start` instead!

### 2. Expo Version Mismatch Error on Phone

If your phone shows a version mismatch error when scanning the QR code, run this command inside the app folder:

```bash
npx expo install expo@54.0.0
npx expo install --fix
npx expo start -c

```
