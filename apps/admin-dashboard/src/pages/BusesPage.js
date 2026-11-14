import React from 'react';
import EntityList from '../components/EntityList';
import StatusBadge from '../components/StatusBadge';
import { mileageKm, seats } from '../format';

export default function BusesPage({ loading, buses, drivers, openModal, openConfirm }) {
  const columns = [
    { header: 'Bus ID', className: 'mono-cell', cell: (b) => b.id },
    { header: 'Registration No.', className: 'mono-cell table-strong', cell: (b) => b.registration },
    { header: 'Passenger Capacity', cell: (b) => seats(b.capacity) },
    { header: 'Total Mileage', cell: (b) => mileageKm(b.mileage) },
    { header: 'Driver', cell: (b) => drivers.find((d) => d.id === b.assignedDriver)?.name || <span className="cell-muted">Unassigned</span> },
    { header: 'Password', cell: (b) => <span className={`badge ${b.hasPassword ? 'badge-green' : 'badge-amber'}`}>{b.hasPassword ? 'Set' : 'Not set'}</span> },
    { header: 'Status', cell: (b) => <StatusBadge status={b.status} /> },
  ];
  return (
    <EntityList entity="bus" page="buses" art={{ name: 'bus', width: 120 }} records={buses} columns={columns} loading={loading} openModal={openModal} openConfirm={openConfirm} />
  );
}
