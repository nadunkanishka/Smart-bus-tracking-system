import { useEffect, useMemo, useState } from 'react';
import { request, toRoute } from '../shared/api';
import { NO_ROUTE } from '../constants';

// The route list from the backend, the selected route and the passenger's boarding and destination stops.
export function useRoutes({ session, showToast }) {
  // Routes (from the backend) and stop selection
  const [routes, setRoutes] = useState([]);
  const [routesState, setRoutesState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [boardingStop, setBoardingStopRaw] = useState(null);
  const [destinationStop, setDestinationStopRaw] = useState(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || NO_ROUTE;

  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return routes;
    const q = routeSearchQuery.toLowerCase();
    return routes.filter((r) => String(r.number).toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.stops.some((s) => s.toLowerCase().includes(q)));
  }, [routeSearchQuery, routes]);

  const boardingIndex = selectedRoute.stops.indexOf(boardingStop);
  const destinationIndex = selectedRoute.stops.indexOf(destinationStop);

  // Load routes once signed in
  useEffect(() => { if (session) loadRoutes(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectRoute(route) {
    setSelectedRouteId(route.id);
    setBoardingStopRaw(route.stops[0] || null);
    setDestinationStopRaw(route.stops[route.stops.length - 1] || null);
  }

  // A trip goes forward along the route: choosing a boarding stop at or after the destination moves the destination to the
  // end of the route, and choosing a destination at or before the boarding stop moves the boarding stop to the start.
  const lastStop = selectedRoute.stops.length - 1;
  function setBoardingStop(name) {
    setBoardingStopRaw(name);
    const i = selectedRoute.stops.indexOf(name);
    if (i >= 0 && selectedRoute.stops.indexOf(destinationStop) <= i) setDestinationStopRaw(i >= lastStop ? name : selectedRoute.stops[lastStop]);
  }
  function setDestinationStop(name) {
    setDestinationStopRaw(name);
    const d = selectedRoute.stops.indexOf(name);
    if (d >= 0 && selectedRoute.stops.indexOf(boardingStop) >= d) setBoardingStopRaw(d === 0 ? name : selectedRoute.stops[0]);
  }

  async function loadRoutes() {
    setRoutesState('loading');
    try {
      const list = (await request('/routes')).filter((r) => r.status === 'Active').map(toRoute);
      setRoutes(list);
      setRoutesState('ready');
      if (!list.some((r) => r.id === selectedRouteId) && list.length) selectRoute(list.find((r) => r.trackable) || list[0]);
    } catch (err) {
      setRoutesState('error');
      showToast(err.message);
    }
  }

  return {
    routes, routesState, loadRoutes,
    routeSearchQuery, setRouteSearchQuery, filteredRoutes,
    selectedRouteId, selectedRoute, selectRoute,
    boardingStop, setBoardingStop, boardingIndex,
    destinationStop, setDestinationStop, destinationIndex,
  };
}
