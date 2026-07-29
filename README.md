# 🚌 Smart Bus Tracking & Arrival Prediction System

A full-stack, real-time public transit tracking platform designed to stream live bus GPS telemetry over WebSockets, compute segment-based ETA predictions, and display live bus locations on interactive maps.

---

## 🏗️ System Architecture Overview

The system consists of four primary components managed within this workspace:

- **Backend (`/backend`)**: Node.js, Express.js, Socket.IO, and MongoDB/Redis pipeline handling real-time telemetry, spatial data indexing, and ETA calculations.
- **Driver App (`/apps/driver-app`)**: React Native (Expo) mobile app used by drivers to stream GPS telemetry every 3 seconds.
- **Passenger App (`/apps/passenger-app`)**: React Native (Expo) app for commuters featuring real-time bus tracking and arrival time predictions.
- **Admin Dashboard (`/apps/admin-dashboard`)**: React.js web interface for route mapping, bus stop management, and live fleet monitoring.

---

## 📋 Prerequisites

Before running the applications, ensure you have the following installed and configured:

1. **Node.js**: Version 18.x or later (LTS version recommended).
2. **Expo Go App**: Downloaded on your Android or iOS mobile phone from the Google Play Store / Apple App Store.
3. **Local Network**: Ensure both your PC and mobile device are connected to the **exact same Wi-Fi network**.

---

## 🚀 Step-by-Step Setup & Execution

### 1. Backend Server Setup

The backend acts as the central WebSockets and database hub.

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if running for the first time):
   ```bash
   npm install
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```
4. The backend will start running (default port: `5000`).

### 2. Driver Mobile App (React Native / Expo)

Captures location coordinates from hardware GPS and emits them to the backend socket layer.

1. Open a new terminal and navigate to the driver app directory:
   ```bash
   cd apps/driver-app
   ```
2. Install dependencies (if running for the first time):
   ```bash
   npm install
   ```
3. Clear the Metro cache and start the Expo dev server:
   ```bash
   npx expo start -c
   ```
4. **Launch on phone**: Open the Expo Go app on your mobile phone and scan the QR code displayed in your terminal.
   _(Alternative: press `w` in the terminal to run in PC Web/Mobile view.)_

### 3. Passenger Mobile/Web App (React Native / Expo)

Subscribes to live route updates and renders active bus positions on interactive maps.

1. Open a new terminal and navigate to the passenger app directory:
   ```bash
   cd apps/passenger-app
   ```
2. Install dependencies (if running for the first time):
   ```bash
   npm install
   ```
3. Clear the Metro cache and start the Expo dev server:
   ```bash
   npx expo start -c
   ```
4. **Launch on phone**: Open the Expo Go app on your phone and scan the terminal QR code.
   _(Alternative: press `w` in the terminal to view in PC browser.)_

### 4. Admin Web Dashboard (React.js)

Web console for route management, defining polyline segments, and observing fleet health.

1. Open a new terminal and navigate to the admin dashboard directory:
   ```bash
   cd apps/admin-dashboard
   ```
2. Install dependencies (if running for the first time):
   ```bash
   npm install
   ```
3. Start the Vite/React development server:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to `http://localhost:5173` (or the local URL printed in the terminal).

---

## ⚡ Important Configuration Notes

### Local IP Address Setup for Mobile Devices

When testing on a physical phone via Expo Go, `localhost` points to the mobile device itself, not your development PC.

1. Find your development PC's local network IP address:
   - **Windows**: Run `ipconfig` in Command Prompt (look for the IPv4 Address, e.g., `192.168.1.15`).
   - **macOS / Linux**: Run `ifconfig` or `ip a` in Terminal.
2. In your mobile app code (`driver-app` & `passenger-app`), connect Socket.IO using your laptop's IP address:
   ```javascript
   // Replace 192.168.x.x with your PC's local IP address
   const socket = io("http://192.168.1.15:5000");
   ```

### Troubleshooting Expo SDK Mismatches

If Expo Go on your phone gives a version mismatch error:

```bash
# Update Expo SDK to version 54
npx expo install expo@54.0.0
npx expo install --fix
npx expo start -c
```
