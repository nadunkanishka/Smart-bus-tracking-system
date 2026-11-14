import { useEffect, useState } from 'react';
import { api } from '../api';
import { ENTITIES } from '../entities';

const EMPTY_SUMMARY = {
  activeRoutes: 0,
  registeredBuses: 0,
  activeDrivers: 0,
  fleetDistribution: { active: 0, idle: 0, maintenance: 0 },
};

// Drivers, buses, routes and the dashboard summary, loaded once the console opens and on fetchBackendData().
// A rejected token signs the admin out inside api().
export function useAdminData() {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true); // true until the first answer (or failure) arrives

  const fetchBackendData = async () => {
    try {
      const [resD, resB, resR, resS] = await Promise.all([api('/drivers'), api('/buses'), api('/routes'), api('/dashboard/summary')]);
      let connected = false;
      for (const [res, entity, setRows] of [[resD, 'driver', setDrivers], [resB, 'bus', setBuses], [resR, 'route', setRoutes]]) {
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data)) setRows(data.map(ENTITIES[entity].fromApi));
        connected = true;
      }
      if (resS.ok) setSummary(await resS.json());
      setBackendConnected(connected);
    } catch {
      setBackendConnected(false); // unreachable server or unreadable answer
    }
    setLoading(false);
  };

  useEffect(() => { fetchBackendData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { drivers, buses, routes, summary, backendConnected, loading, fetchBackendData };
}
