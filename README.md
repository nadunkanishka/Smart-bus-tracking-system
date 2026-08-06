# 🚌 Smart Bus Tracking & Arrival Prediction System

A complete real-time bus tracking system. Broadcast live GPS locations from a driver's phone to a live passenger map and an admin dashboard.

---

## 📌 Quick Overview (Architecture)

The system consists of **4 main parts**:

1. **Backend (`/backend`)**: Node.js & Express server with Socket.io for live updates.
2. **Admin Dashboard (`/apps/admin-dashboard`)**: React web app for managing routes, stops, and monitoring active buses.
3. **Driver App (`/apps/driver-app`)**: Mobile app (Expo / React Native) that streams live GPS coordinates.
4. **Passenger App (`/apps/passenger-app`)**: Mobile/Web app (Expo / React Native) for passengers to track buses and see estimated arrival times.

---

## 🛠️ Prerequisites (Install First)

Make sure you have installed on your computer:
1. **[Node.js](https://nodejs.org/)** (v18 or higher)
2. **[Expo Go App](https://expo.dev/go)** on your mobile phone (available on Google Play Store and Apple App Store) if testing mobile apps on physical devices.
3. **Wi-Fi Connection**: Make sure your phone and laptop are on the **same Wi-Fi network** if using physical mobile devices.

---

## 🚀 Step-by-Step Run Guide (A to Z)

To run the entire system simultaneously, open **4 separate terminal windows**.

---

### Step 1: Start the Backend Server

The backend must be running first so the apps and dashboard can connect to it.

1. Open **Terminal #1** and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies *(only required on first run)*:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node index.js
   ```
   *(Or `npx nodemon index.js` for development mode)*

> 🟢 **Backend status:** Running at `http://localhost:5000`

---

### Step 2: Start the Admin Dashboard

1. Open **Terminal #2** and navigate to the admin dashboard folder:
   ```bash
   cd apps/admin-dashboard
   ```
2. Install dependencies *(only required on first run)*:
   ```bash
   npm install
   ```
3. Start the dashboard web application:
   ```bash
   npm start
   ```

> 🟢 **Admin Dashboard status:** Open your browser and go to `http://localhost:3000`

---

### Step 3: Start the Driver Mobile App

1. Open **Terminal #3** and navigate to the driver app folder:
   ```bash
   cd apps/driver-app
   ```
2. Install dependencies *(only required on first run)*:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start -c
   ```
4. **Launch the App:**
   - **On Phone:** Open **Expo Go** app on your mobile phone and scan the QR code displayed in the terminal.
   - **On Web Browser:** Press `w` in your terminal to test in your desktop web browser.

---

### Step 4: Start the Passenger Mobile App

1. Open **Terminal #4** and navigate to the passenger app folder:
   ```bash
   cd apps/passenger-app
   ```
2. Install dependencies *(only required on first run)*:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start -c
   ```
4. **Launch the App:**
   - **On Phone:** Open **Expo Go** app on your mobile phone and scan the QR code displayed in the terminal.
   - **On Web Browser:** Press `w` in your terminal to test in your desktop web browser.

---

## 📱 Mobile IP Configuration (Crucial for Physical Devices)

When running the mobile apps on a real phone via Expo Go, `localhost` points to your phone, **not your computer server**. You must update the backend server address with your computer's local IP address.

### 1. Find Your Computer's IP Address
- **Windows:** Open Command Prompt (`cmd`) and type `ipconfig`. Find **IPv4 Address** (e.g., `192.168.1.15`).
- **Mac / Linux:** Open Terminal and type `ipconfig getifaddr en0` or `ifconfig`.

### 2. Update Socket URL in Apps
Inside both `apps/driver-app` and `apps/passenger-app`, update the server IP setting:
```javascript
// Replace 192.168.1.15 with YOUR computer's actual local IP address
const SOCKET_URL = "http://192.168.1.15:5000";
```

---

## ❓ Troubleshooting & FAQs

| Issue | Solution |
| :--- | :--- |
| **`Missing script: "dev"` in Admin Dashboard** | Run `npm start` instead of `npm run dev`. |
| **Expo version mismatch error on phone** | Run `npx expo install --fix` and restart with `npx expo start -c`. |
| **App won't connect to backend** | Verify both devices are on the same Wi-Fi network and check your computer's firewall settings for port `5000`. |
