import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../shared/api';
import { STALE_MS, GONE_MS } from '../constants';
import { pickBus } from '../utils';

// Live bus positions for the selected route, pushed over Socket.IO, plus the bus that matters to this passenger.
export function useLiveBuses({ session, selectedRouteId, selectedRoute, boardingIndex, destinationIndex }) {
  // Live data pushed over Socket.IO for the selected route
  const [buses, setBuses] = useState({}); // busId -> last update (+ recvAt)
  const [conn, setConn] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef(null);

  const liveBuses = useMemo(
    () => Object.values(buses)
      .filter((b) => b.routeId === selectedRoute.id && now - b.recvAt < GONE_MS)
      .map((b) => ({ ...b, stale: now - b.recvAt > STALE_MS })),
    [buses, now, selectedRoute.id],
  );
  const tracked = useMemo(() => pickBus(liveBuses, boardingIndex, destinationIndex), [liveBuses, boardingIndex, destinationIndex]);
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
    socket.on('route:snapshot', ({ buses: list, serverTs }) => {
      // Cached fixes may already be a while old: keep their real age so stale buses are flagged straight away.
      const at = Date.now();
      setBuses(Object.fromEntries(list.map((b) => [b.busId, { ...b, recvAt: at - Math.max(0, serverTs - b.serverEmitTs) }])));
    });
    socket.on('bus:update', (b) => setBuses((prev) => ({ ...prev, [b.busId]: { ...b, recvAt: Date.now() } })));
    socket.on('bus:offline', ({ busId }) => setBuses((prev) => {
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
    socketRef.current?.emit('route:subscribe', { routeId: selectedRouteId });
  }, [selectedRouteId, conn]);

  // Clock for "signal lost" / removal of buses that stopped reporting
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  return { conn, liveBuses, tracked, mapBuses, clearBuses: () => setBuses({}) };
}
