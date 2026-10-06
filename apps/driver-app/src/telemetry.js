// Driver telemetry: captures GPS every 3 seconds while on duty and streams it to the backend over Socket.IO.
// When the connection drops, fixes are queued (and persisted) and flushed in batches once it is back.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import { API_URL } from './api';

const TASK = 'smartbus-gps';
const QUEUE_KEY = 'smartbus:gps-queue';
const INTERVAL_MS = 3000;
const BATCH_SIZE = 500;
// ponytail: the queue is capped at 2000 fixes (~100 minutes offline); older fixes are dropped first.
// Raise the cap or move to SQLite if pilots show longer dead zones.
const MAX_QUEUE = 2000;

let socket = null;
let queue = [];
let flushing = false;
let seq = 0;
let foregroundWatch = null;
const listeners = new Set();
const status = { connected: false, onDuty: false, queued: 0, sent: 0, lastFix: null, nextStopIndex: null, mode: null, error: null };

const notify = () => { status.queued = queue.length; listeners.forEach((fn) => fn({ ...status })); };
export const subscribe = (fn) => { listeners.add(fn); fn({ ...status }); return () => listeners.delete(fn); };

const persist = () => AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});

let retryTimer = null;

function enqueue(fix) {
  queue.push(fix);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
  persist();
  notify();
  // Keep trying to send while anything is queued, even if no new fix arrives (e.g. the bus is parked).
  if (!retryTimer) {
    retryTimer = setInterval(() => {
      if (queue.length) flush();
      else { clearInterval(retryTimer); retryTimer = null; }
    }, 5000);
  }
}

// Send queued fixes oldest-first. A batch is only removed after the server acknowledges it; if the ack is lost
// the batch is sent again and the server drops the repeats by timestamp, so nothing is lost or duplicated.
async function flush() {
  if (flushing || !socket?.connected || !queue.length) return;
  flushing = true;
  try {
    while (socket?.connected && queue.length) {
      const batch = queue.slice(0, BATCH_SIZE);
      const ack = await socket.timeout(10000).emitWithAck('gps:batch', batch); // eslint-disable-line no-await-in-loop
      if (!ack?.ok) { status.error = ack?.error || 'Server rejected buffered fixes'; break; }
      queue.splice(0, batch.length);
      status.sent += batch.length;
      persist();
      notify();
    }
  } catch {
    // timed out or disconnected mid-flush: keep the queue and try again on the next reconnect or fix
  } finally {
    flushing = false;
  }
}

// Metres between two fixes (equirectangular; fine over a few seconds of travel).
const metres = (a, b) => Math.hypot((b.lat - a.lat) * 111320, (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180));

export function submitFix(coords, timestamp) {
  const ts = Math.round(timestamp || Date.now());
  const prev = status.lastFix;
  // Some devices and browsers do not report speed: derive it from the previous fix instead.
  let speed = coords.speed != null && coords.speed >= 0 ? coords.speed : null;
  if (speed == null) speed = prev && ts > prev.ts ? metres(prev, { lat: coords.latitude, lng: coords.longitude }) / ((ts - prev.ts) / 1000) : 0;
  const fix = {
    lat: coords.latitude,
    lng: coords.longitude,
    speed: Math.min(speed, 40), // m/s
    heading: coords.heading != null && coords.heading >= 0 ? coords.heading : null,
    accuracy: coords.accuracy ?? null,
    ts,
    seq: (seq += 1),
  };
  status.lastFix = fix;
  status.error = null;

  // Keep strict order: while anything is queued or being flushed, new fixes join the queue behind it.
  if (!socket?.connected || queue.length || flushing) {
    enqueue(fix);
    flush();
    return;
  }
  socket.timeout(5000).emit('gps:fix', fix, (err, ack) => {
    if (err) { enqueue(fix); return; } // no ack: assume it never arrived
    status.sent += 1;
    if (ack?.nextStopIndex != null) status.nextStopIndex = ack.nextStopIndex;
    if (ack && !ack.ok) status.error = ack.error || ack.result;
    notify();
  });
  notify();
}

// Background updates (Android foreground service) arrive here, including when the screen is off.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(TASK, ({ data, error }) => {
    if (error || !data?.locations) return;
    data.locations.forEach((loc) => submitFix(loc.coords, loc.timestamp));
  });
}

export async function connect(token) {
  try { queue = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || '[]'); } catch { queue = []; }
  socket?.close();
  socket = io(API_URL, { auth: { token }, transports: ['websocket'], reconnectionDelayMax: 5000 });
  socket.on('connect', () => {
    status.connected = true;
    if (status.onDuty) socket.emit('driver:duty', { onDuty: true });
    notify();
    flush();
  });
  socket.on('disconnect', () => { status.connected = false; notify(); });
  notify();
}

export async function startDuty() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('Location permission is needed to share the bus position.');

  status.onDuty = true;
  socket?.emit('driver:duty', { onDuty: true });

  let background = false;
  if (Platform.OS !== 'web') {
    try {
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status === 'granted') {
        await Location.startLocationUpdatesAsync(TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: INTERVAL_MS,
          distanceInterval: 0,
          pausesUpdatesAutomatically: false,
          foregroundService: {
            notificationTitle: 'SmartBus Driver is on duty',
            notificationBody: 'Sharing the live bus location with passengers.',
            notificationColor: '#3A9BC9',
          },
        });
        background = true;
      }
    } catch {
      background = false; // e.g. Expo Go, which cannot run background location
    }
  }
  if (!background) {
    foregroundWatch = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: INTERVAL_MS, distanceInterval: 0 },
      (loc) => submitFix(loc.coords, loc.timestamp),
    );
  }
  status.mode = background ? 'background' : 'foreground';
  notify();
}

export async function stopDuty() {
  status.onDuty = false;
  status.mode = null;
  foregroundWatch?.remove();
  foregroundWatch = null;
  if (Platform.OS !== 'web') {
    try {
      if (await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK);
    } catch { /* task was never started */ }
  }
  await flush();
  socket?.emit('driver:duty', { onDuty: false });
  notify();
}

export async function disconnect() {
  await stopDuty();
  socket?.close();
  socket = null;
  status.connected = false;
  status.sent = 0;
  status.lastFix = null;
  status.nextStopIndex = null;
  notify();
}
