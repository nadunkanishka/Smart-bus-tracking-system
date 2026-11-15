import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isActiveRoute, request, toRoute } from '../shared/api';
import { JOURNEY_KEY, NO_ROUTE } from '../constants';
import { restoreJourney, searchRoutes } from '../utils';

// The route list from the backend, the selected route and the passenger's boarding and destination stops.
export function useRoutes({ session, showToast }) {
  const [routes, setRoutes] = useState([]);
  const [routesState, setRoutesState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [boardingStop, setBoardingStopRaw] = useState(null);
  const [destinationStop, setDestinationStopRaw] = useState(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || NO_ROUTE;

  const filteredRoutes = useMemo(() => searchRoutes(routes, routeSearchQuery, selectedRouteId), [routes, routeSearchQuery, selectedRouteId]);

  const boardingIndex = selectedRoute.stops.indexOf(boardingStop);
  const destinationIndex = selectedRoute.stops.indexOf(destinationStop);

  // loadRoutes reads the selection when the response arrives, not when the load started.
  const selectedIdRef = useRef(selectedRouteId);
  selectedIdRef.current = selectedRouteId;
  const journeyKey = useRef(JOURNEY_KEY);
  journeyKey.current = `${JOURNEY_KEY}:${session?.user?.id || ''}`;

  // Save every change of route or stops, so the next start opens on the same journey.
  useEffect(() => {
    if (!selectedRouteId) return;
    AsyncStorage.setItem(journeyKey.current, JSON.stringify({ routeId: selectedRouteId, boarding: boardingStop, destination: destinationStop })).catch(() => {});
  }, [selectedRouteId, boardingStop, destinationStop]);

  const selectRoute = useCallback((route) => {
    setSelectedRouteId(route.id);
    setBoardingStopRaw(route.stops[0] || null);
    setDestinationStopRaw(route.stops[route.stops.length - 1] || null);
  }, []);

  const loadRoutes = useCallback(async () => {
    setRoutesState('loading');
    try {
      const list = (await request('/routes')).filter(isActiveRoute).map(toRoute);
      setRoutes(list);
      setRoutesState('ready');
      // Keep the chosen route if it is still listed; otherwise the one saved from last time; otherwise the first trackable one.
      if (!list.some((r) => r.id === selectedIdRef.current) && list.length) {
        let saved = null;
        try { saved = JSON.parse(await AsyncStorage.getItem(journeyKey.current)); } catch { /* nothing saved */ }
        const back = restoreJourney(list, saved);
        if (back) {
          setSelectedRouteId(back.route.id);
          setBoardingStopRaw(back.boarding);
          setDestinationStopRaw(back.destination);
        } else {
          selectRoute(list.find((r) => r.trackable) || list[0]);
        }
      }
    } catch (err) {
      setRoutesState('error');
      showToast(err.message);
    }
  }, [showToast, selectRoute]);

  useEffect(() => { if (session) loadRoutes(); }, [session, loadRoutes]);

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

  return {
    routes, routesState, loadRoutes,
    routeSearchQuery, setRouteSearchQuery, filteredRoutes,
    selectedRouteId, selectedRoute, selectRoute,
    boardingStop, setBoardingStop, boardingIndex,
    destinationStop, setDestinationStop, destinationIndex,
  };
}
