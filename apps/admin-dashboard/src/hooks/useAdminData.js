import { useEffect, useState } from 'react';
import { api } from '../api';

// Drivers, buses, routes and the dashboard summary, loaded from the backend once an admin is signed in.
// onSessionExpired() runs when the backend rejects the token.
export function useAdminData({ user, onSessionExpired }) {
  // Data Collections (real data from MongoDB)
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState({
    activeRoutes: 0,
    registeredBuses: 0,
    activeDrivers: 0,
    fleetDistribution: {
      active: 0,
      idle: 0,
      maintenance: 0,
    },
  });
  const [backendConnected, setBackendConnected] = useState(false);

  // Fetch live MongoDB backend data & summary metrics
  const fetchBackendData = async () => {
    try {
      const [resD, resB, resR, resS] = await Promise.all([
        api('/drivers'),
        api('/buses'),
        api('/routes'),
        api('/dashboard/summary'),
      ]);

      // Session expired or signed in before tokens existed: ask the admin to sign in again.
      if (resD.status === 401 || resD.status === 403) {
        onSessionExpired();
        return;
      }

      let connected = false;

      if (resD.ok) {
        const dataD = await resD.json();
        if (Array.isArray(dataD)) {
          setDrivers(
            dataD.map((d) => ({
              id: d.driverId || d._id || d.id,
              rawId: d._id,
              name: d.name,
              license: d.license,
              expiry: d.expiry,
              phone: d.phone,
              status: d.status || 'Active',
            }))
          );
        }
        connected = true;
      }

      if (resB.ok) {
        const dataB = await resB.json();
        if (Array.isArray(dataB)) {
          setBuses(
            dataB.map((b) => ({
              id: b.busId || b._id || b.id,
              rawId: b._id,
              registration: b.registration,
              capacity: `${b.capacity} seats`,
              mileage: `${Number(b.mileage || 0).toLocaleString('en-US')} km`,
              hasPassword: !!b.hasPassword,
              assignedDriver: b.assignedDriver || '',
              rawCapacity: b.capacity,
              rawMileage: b.mileage,
              status: b.status || 'Active',
            }))
          );
        }
        connected = true;
      }

      if (resR.ok) {
        const dataR = await resR.json();
        if (Array.isArray(dataR)) {
          setRoutes(
            dataR.map((r) => ({
              id: r.routeId || r._id || r.id,
              rawId: r._id,
              name: r.name,
              start: r.start,
              end: r.end,
              distance: `${r.distance} km`,
              rawDistance: r.distance,
              routeNumber: r.routeNumber || '',
              stops: Array.isArray(r.stops) ? r.stops : [],
              // GeoJSON [lng, lat] from the API -> [lat, lng] for the map editor
              stopPoints: (r.stopPoints || []).map((sp) => ({ name: sp.name, lat: sp.location.coordinates[1], lng: sp.location.coordinates[0] })),
              path: (r.path?.coordinates || []).map(([lng, lat]) => [lat, lng]),
              assignedBus: r.assignedBus || '',
              status: r.status || 'Active',
            }))
          );
        }
        connected = true;
      }

      if (resS.ok) {
        const summaryData = await resS.json();
        setSummary(summaryData);
      }

      setBackendConnected(connected);
    } catch (err) {
      setBackendConnected(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBackendData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return { drivers, buses, routes, summary, backendConnected, fetchBackendData };
}
