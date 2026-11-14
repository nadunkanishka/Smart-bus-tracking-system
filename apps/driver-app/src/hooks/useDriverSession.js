import { useMemo, useState } from 'react';
import { request, toRoute } from '../shared/api';
import * as telemetry from '../services/telemetry';

const SIGNED_OUT = { bus: null, assignedRoute: null, driverName: null };

// The signed-in bus: the login form, the bus, its route and its driver. Nothing is kept from a previous sign-in.
// login() resolves to the bus registration once signed in (null when it failed), so the caller decides what follows.
export function useDriverSession() {
  const [busRegistration, setBusRegistration] = useState('');
  const [busPassword, setBusPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(null); // SIGNED_OUT shape once the server accepted the bus, null before

  async function login() {
    setLoginError('');
    if (!busRegistration.trim() || !busPassword.trim()) {
      setLoginError('Bus registration number and password are required.');
      return null;
    }
    setLoginLoading(true);
    try {
      const data = await request('/auth/driver-login', {
        method: 'POST',
        body: { registration: busRegistration.trim(), password: busPassword.trim() },
      });
      // Only a bus whose telemetry connection is set up counts as signed in.
      await telemetry.connect(data.token);
      setSignedIn({ bus: data.bus, assignedRoute: data.assignedRoute, driverName: data.driver?.name || null });
      return data.bus?.registration || busRegistration;
    } catch (err) {
      setLoginError(err.message);
      return null;
    } finally {
      setLoginLoading(false);
    }
  }

  // Signs out even when stopping telemetry fails, and forgets the bus, route, driver and the form.
  async function logout() {
    try {
      await telemetry.disconnect();
    } catch {
      /* the socket is closed by disconnect() regardless; nothing else to undo */
    } finally {
      setSignedIn(null);
      setBusRegistration('');
      setBusPassword('');
      setLoginError('');
    }
  }

  const { bus, assignedRoute, driverName } = signedIn || SIGNED_OUT;
  const route = useMemo(() => toRoute(assignedRoute), [assignedRoute]);

  return {
    isAuthenticated: !!signedIn,
    form: { loginError, busRegistration, setBusRegistration, busPassword, setBusPassword, loginLoading },
    login,
    logout,
    // What the screens show about this bus.
    registration: bus?.registration || busRegistration,
    driverName,
    route,
    routeStops: route?.stops || [],
    routeNumber: route ? route.shortName : 'No route assigned',
    routeLabel: route ? `${route.startTerminal} ➔ ${route.endTerminal}` : 'Ask the admin to assign this bus to a route',
  };
}
