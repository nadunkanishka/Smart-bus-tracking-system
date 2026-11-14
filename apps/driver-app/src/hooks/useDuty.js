import { useCallback, useEffect, useMemo, useState } from 'react';
import * as telemetry from '../services/telemetry';
import { COLORS } from '../shared/theme';
import { MAX_LOG_ITEMS } from '../constants';
import { formatCoord, toKmh } from '../utils';

// Shown in the log and as a toast when the duty switch changes.
const DUTY_MESSAGE = {
  on: 'On duty. Broadcasting live location.',
  off: 'Off duty. Location sharing stopped.',
};

const INITIAL = { connected: false, onDuty: false, queued: 0, sent: 0, lastFix: null, nextStopIndex: null, mode: null, error: null };

const stamp = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Live telemetry (connection, duty, offline queue, last GPS fix), the transmission log and the duty switch.
export function useDuty({ showToast }) {
  const [tele, setTele] = useState(INITIAL);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState([]);

  const log = useCallback((msg) => setLogs((prev) => [`[${stamp()}] ${msg}`, ...prev].slice(0, MAX_LOG_ITEMS)), []);
  const clearLog = useCallback(() => setLogs([]), []);

  // One log line per new GPS fix, written where the fix arrives (with the connection state of that moment).
  useEffect(() => {
    let lastFix = null;
    return telemetry.subscribe((next) => {
      setTele(next);
      const f = next.lastFix;
      if (!f || f === lastFix) return;
      lastFix = f;
      log(`${next.connected ? 'Sent' : 'Buffered'}: ${formatCoord(f.lat)}, ${formatCoord(f.lng)} | ${toKmh(f.speed)} km/h`);
    });
  }, [log]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      let message;
      if (tele.onDuty) {
        await telemetry.stopDuty();
        message = DUTY_MESSAGE.off;
      } else {
        await telemetry.startDuty({ notificationColor: COLORS.orange });
        message = DUTY_MESSAGE.on;
      }
      log(message);
      showToast(message);
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  }

  const { lastFix } = tele;
  const busMarkers = useMemo(() => (lastFix ? [{ id: 'me', lat: lastFix.lat, lng: lastFix.lng, label: 'This bus' }] : []), [lastFix]);
  const driverCoordinate = useMemo(() => (lastFix ? { latitude: lastFix.lat, longitude: lastFix.lng } : null), [lastFix]);

  return {
    isOnShift: tele.onDuty,
    busy,
    toggle,
    connected: tele.connected,
    queued: tele.queued,
    mode: tele.mode,
    busSpeed: lastFix ? toKmh(lastFix.speed) : 0,
    gpsStatus: !tele.onDuty ? 'Disconnected' : lastFix ? 'Connected' : 'Searching',
    currentStopIndex: tele.nextStopIndex ?? 0,
    busMarkers,
    driverCoordinate,
    logs,
    log,
    clearLog,
  };
}
