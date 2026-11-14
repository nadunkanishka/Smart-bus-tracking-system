// Driver telemetry: captures GPS every FIX_INTERVAL_MS while on duty and streams it to the backend over Socket.IO.
// When the connection drops, fixes are queued (and persisted) and flushed in batches once it is back.
// The decisions (speed, queue cap, batching) are pure functions in telemetryCore.js; this file is the socket, GPS and
// storage shell around them.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import { API_URL } from '../shared/api';
import { EVENTS, FIX_INTERVAL_MS } from '../shared/contract';
import { TIMING, buildFix, enqueueFix, removeAcked, takeBatch } from './telemetryCore';

const TASK = 'smartbus-gps';
const QUEUE_KEY = 'smartbus:gps-queue';

let socket = null;
let queue = [];
let flushing = false;
let foregroundWatch = null;
let retryTimer = null;
const listeners = new Set();
const status = { connected: false, onDuty: false, queued: 0, sent: 0, lastFix: null, nextStopIndex: null, mode: null, error: null };

const notify = () => { status.queued = queue.length; listeners.forEach((fn) => fn({ ...status })); };
export const subscribe = (fn) => { listeners.add(fn); fn({ ...status }); return () => listeners.delete(fn); };

const persist = () => AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});

function enqueue(fix) {
  queue = enqueueFix(queue, fix);
  persist();
  notify();
  // Keep trying to send while anything is queued, even if no new fix arrives (e.g. the bus is parked).
  if (!retryTimer) {
    retryTimer = setInterval(() => {
      if (queue.length) flush();
      else { clearInterval(retryTimer); retryTimer = null; }
    }, TIMING.RETRY_MS);
  }
}

// Send queued fixes oldest-first. A batch is only removed after the server acknowledges it; if the ack is lost
// the batch is sent again and the server drops the repeats by timestamp, so nothing is lost or duplicated.
async function flush() {
  if (flushing || !socket?.connected || !queue.length) return;
  flushing = true;
  try {
    while (socket?.connected && queue.length) {
      const batch = takeBatch(queue);
      // Batches go one at a time on purpose: the next one waits for this one's ack.
      const ack = await socket.timeout(TIMING.BATCH_ACK_MS).emitWithAck(EVENTS.BATCH, batch); // eslint-disable-line no-await-in-loop
      if (!ack?.ok) { status.error = ack?.error || 'Server rejected buffered fixes'; break; }
      queue = removeAcked(queue, batch.length);
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

export function submitFix(coords, timestamp) {
  const fix = buildFix(coords, timestamp, status.lastFix);
  status.lastFix = fix;
  status.error = null;

  // Keep strict order: while anything is queued or being flushed, new fixes join the queue behind it.
  if (!socket?.connected || queue.length || flushing) {
    enqueue(fix);
    flush();
    return;
  }
  socket.timeout(TIMING.FIX_ACK_MS).emit(EVENTS.FIX, fix, (err, ack) => {
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
  socket = io(API_URL, { auth: { token }, transports: ['websocket'], reconnectionDelayMax: TIMING.RECONNECT_MAX_MS });
  socket.on('connect', () => {
    status.connected = true;
    if (status.onDuty) socket.emit(EVENTS.DUTY, { onDuty: true });
    notify();
    flush();
  });
  socket.on('disconnect', () => { status.connected = false; notify(); });
  notify();
}

// notificationColor: the accent of the Android "on duty" notification (the caller passes the theme colour).
export async function startDuty({ notificationColor } = {}) {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('Location permission is needed to share the bus position.');

  status.onDuty = true;
  socket?.emit(EVENTS.DUTY, { onDuty: true });

  let background = false;
  if (Platform.OS !== 'web') {
    try {
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status === 'granted') {
        await Location.startLocationUpdatesAsync(TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: FIX_INTERVAL_MS,
          distanceInterval: 0,
          pausesUpdatesAutomatically: false,
          foregroundService: {
            notificationTitle: 'SmartBus Driver is on duty',
            notificationBody: 'Sharing the live bus location with passengers.',
            notificationColor,
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
      { accuracy: Location.Accuracy.High, timeInterval: FIX_INTERVAL_MS, distanceInterval: 0 },
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
  socket?.emit(EVENTS.DUTY, { onDuty: false });
  notify();
}

// Always closes the socket, even when stopping duty fails (the error is still thrown to the caller).
export async function disconnect() {
  try {
    await stopDuty();
  } finally {
    socket?.close();
    socket = null;
    status.connected = false;
    status.sent = 0;
    status.lastFix = null;
    status.nextStopIndex = null;
    notify();
  }
}
