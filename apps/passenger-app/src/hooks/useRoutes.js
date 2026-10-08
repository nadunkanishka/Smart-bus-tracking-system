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
  const [boardingStop, setBoardingStop] = useState(null);
  const [destinationStop, setDestinationStop] = useState(null);

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
    setBoardingStop(route.stops[0] || null);
    setDestinationStop(route.stops[route.stops.length - 1] || null);
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
