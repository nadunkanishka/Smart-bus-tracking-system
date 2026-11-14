// The page registry: every console page once, in menu order. The sidebar, the header title, each page's heading and
// the page switch in App all read this list. `fit` marks the one-screen dashboard (the page area does not scroll).
import DashboardPage from './DashboardPage';
import DriversPage from './DriversPage';
import BusesPage from './BusesPage';
import RoutesPage from './RoutesPage';
import LiveMonitor from './LiveMonitor';
import Analytics from './Analytics';
import PassengersPage from './PassengersPage';
import AdminsPage from './AdminsPage';
import SettingsPage from './SettingsPage';

export const PAGES = [
  { key: 'dashboard', label: 'Dashboard', title: 'Administrator Dashboard', section: 'Administrator', icon: 'tiles', component: DashboardPage, fit: true },
  { key: 'drivers', label: 'Drivers', title: 'Driver Management', section: 'Fleet', icon: 'drivers', component: DriversPage },
  { key: 'buses', label: 'Buses', title: 'Bus & Fleet Inventory', section: 'Fleet', icon: 'bus', component: BusesPage },
  { key: 'routes', label: 'Routes', title: 'Create & Manage Routes', section: 'Network', icon: 'route', component: RoutesPage },
  { key: 'live', label: 'Live Monitor', title: 'Live Monitor', section: 'Network', icon: 'pulse', component: LiveMonitor },
  { key: 'analytics', label: 'Analytics', title: 'Trip Analytics', section: 'Network', icon: 'chart', component: Analytics },
  { key: 'passengers', label: 'Passengers', title: 'Passenger Accounts', section: 'Accounts', icon: 'drivers', component: PassengersPage },
  { key: 'admins', label: 'Administrators', title: 'Administrator Accounts', section: 'Accounts', icon: 'lock', component: AdminsPage },
  { key: 'settings', label: 'Settings', title: 'Settings', section: 'System', icon: 'settings', component: SettingsPage },
];

// Menu sections in the order their first page appears.
export const SECTIONS = [...new Set(PAGES.map((p) => p.section))];
