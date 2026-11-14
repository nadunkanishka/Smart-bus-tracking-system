import React from 'react';
import EntityList from '../components/EntityList';
import StatusBadge from '../components/StatusBadge';

const COLUMNS = [
  { header: 'Driver ID', className: 'mono-cell', cell: (d) => d.id },
  { header: 'Full Name', className: 'table-strong', cell: (d) => d.name },
  { header: 'License Number', className: 'mono-cell', cell: (d) => d.license },
  { header: 'License Expiry', cell: (d) => d.expiry },
  { header: 'Phone Number', cell: (d) => d.phone },
  { header: 'Status', cell: (d) => <StatusBadge status={d.status} /> },
];

export default function DriversPage({ loading, drivers, openModal, openConfirm }) {
  return (
    <EntityList entity="driver" page="drivers" art={{ name: 'minibus', width: 120 }} records={drivers} columns={COLUMNS} loading={loading} openModal={openModal} openConfirm={openConfirm} />
  );
}
