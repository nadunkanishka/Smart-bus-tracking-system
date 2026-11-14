import React from 'react';
import EntityList from '../components/EntityList';
import StatusBadge from '../components/StatusBadge';
import { parseBusRef } from '../design/contract';
import { routeReady } from '../entities';
import { distanceKm } from '../format';

// "NB-4712 (BUS-002)" as saved on the route; a reference without an id is shown as it is.
function AssignedBus({ value }) {
  if (!value) return <span className="cell-muted">Unassigned</span>;
  const { registration, busId } = parseBusRef(value);
  return <span className="mono-cell cell-bus">{busId ? `${registration} (${busId})` : registration}</span>;
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
  { header: 'Assigned Bus', cell: (r) => <AssignedBus value={r.assignedBus} /> },
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

export default function RoutesPage({ loading, routes, openModal, openConfirm }) {
  return (
    <EntityList entity="route" page="routes" art={{ name: 'coach', width: 128 }} records={routes} columns={COLUMNS} loading={loading} openModal={openModal} openConfirm={openConfirm} />
  );
}
