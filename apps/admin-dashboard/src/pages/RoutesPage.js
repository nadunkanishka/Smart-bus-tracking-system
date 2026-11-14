import React from 'react';
import EntityList from '../components/EntityList';
import StatusBadge from '../components/StatusBadge';
import { routeReady } from '../entities';
import { distanceKm } from '../format';

// The buses on the route: their registrations, or "No buses".
function Buses({ buses }) {
  if (!buses.length) return <span className="cell-muted">No buses</span>;
  return (
    <div>
      <span className="table-strong">{buses.length} bus{buses.length > 1 ? 'es' : ''}</span>
      <div className="cell-hint">{buses.join(', ')}</div>
    </div>
  );
}

function Stops({ stops }) {
  if (stops.length === 0) return <span className="cell-muted">Direct Route</span>;
  return (
    <div>
      <span className="table-strong">{stops.length} stop{stops.length > 1 ? 's' : ''}</span>
      <div className="cell-hint">{stops.join(' → ')}</div>
    </div>
  );
}

const COLUMNS = [
  { header: 'Route ID', className: 'mono-cell', cell: (r) => r.id },
  { header: 'Route Name', className: 'table-strong', cell: (r) => r.name },
  { header: 'Buses', cell: (r) => <Buses buses={r.busRegistrations} /> },
  { header: 'Start Terminal', cell: (r) => r.start },
  { header: 'End Terminal', cell: (r) => r.end },
  { header: 'Distance', cell: (r) => distanceKm(r.distance) },
  { header: 'Stops', cell: (r) => <Stops stops={r.stops} /> },
  {
    header: 'Live Tracking',
    cell: (r) => (routeReady(r) ? <span className="badge badge-green">Ready</span> : <span className="badge badge-amber">Needs map path and stops</span>),
  },
  { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
];

const BUS_FILTER = {
  label: 'Buses',
  options: [{ value: 'with', label: 'With buses' }, { value: 'without', label: 'No buses' }],
  test: (r, value) => (value === 'with' ? r.busIds.length > 0 : r.busIds.length === 0),
};

export default function RoutesPage({ loading, routes, openModal, openConfirm }) {
  return (
    <EntityList entity="route" page="routes" art={{ name: 'coach', width: 128 }} records={routes} extraFilter={BUS_FILTER} columns={COLUMNS} loading={loading} openModal={openModal} openConfirm={openConfirm} />
  );
}
