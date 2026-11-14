import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../shared/api';
import { EVENTS, GONE_AFTER_MS, LIVE_WINDOW_MS } from '../shared/contract';
import { pickBus } from '../utils';

// Live bus positions for the selected route, pushed over Socket.IO, plus the bus that matters to this passenger.
export function useLiveBuses({ session, selectedRouteId, selectedRoute, boardingIndex, destinationIndex, boardingStop, destinationStop }) {
  const [buses, setBuses] = useState({}); // busId -> last update (+ recvAt)
  const [conn, setConn] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef(null);

  const liveBuses = useMemo(
    () => Object.values(buses)
      .filter((b) => b.routeId === selectedRoute.id && now - b.recvAt < GONE_AFTER_MS)
      .map((b) => ({ ...b, stale: now - b.recvAt > LIVE_WINDOW_MS })),
    [buses, now, selectedRoute.id],
  );
  const tracked = useMemo(() => pickBus(liveBuses, boardingIndex, destinationIndex, boardingStop, destinationStop), [liveBuses, boardingIndex, destinationIndex, boardingStop, destinationStop]);
  const mapBuses = useMemo(
    () => liveBuses.map((b) => ({ id: b.busId, lat: b.lat, lng: b.lng, label: b.registration, stale: b.stale, heading: b.heading })),
    [liveBuses],
  );

  // One socket per session
  useEffect(() => {
    if (!session) return undefined;
    const socket = io(API_URL, { auth: { token: session.token }, transports: ['websocket'] });
    socketRef.current = socket;
    setConn('connecting');
    socket.on('connect', () => setConn('connected'));
    socket.on('disconnect', () => setConn('disconnected'));
    socket.on('connect_error', () => setConn('disconnected'));
    socket.on(EVENTS.SNAPSHOT, ({ buses: list, serverTs }) => {
      // Cached fixes may already be a while old: keep their real age so stale buses are flagged straight away.
      const at = Date.now();
      setBuses(Object.fromEntries(list.map((b) => [b.busId, { ...b, recvAt: at - Math.max(0, serverTs - b.serverEmitTs) }])));
    });
    socket.on(EVENTS.UPDATE, (b) => setBuses((prev) => ({ ...prev, [b.busId]: { ...b, recvAt: Date.now() } })));
    socket.on(EVENTS.OFFLINE, ({ busId }) => setBuses((prev) => {
      const next = { ...prev };
      delete next[busId];
      return next;
    }));
    return () => { socket.close(); socketRef.current = null; };
  }, [session]);

  // Join the selected route's room (the server leaves the previous one), also after every reconnect
  useEffect(() => {
    if (conn !== 'connected' || !selectedRouteId) return;
    setBuses({});
    socketRef.current?.emit(EVENTS.SUBSCRIBE, { routeId: selectedRouteId });
  }, [selectedRouteId, conn]);

  // Clock for "signal lost" / removal of buses that stopped reporting
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const clearBuses = useCallback(() => setBuses({}), []);

  return { conn, liveBuses, tracked, mapBuses, clearBuses };
}
