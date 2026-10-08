import React from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import TableShell from '../components/TableShell';

export default function DriversPage({ currentPageTitle, drivers, openModal, openConfirm }) {
  return (
    <section className="page-section" data-page="drivers">
      <div className="section-header">
        <div>
          <h1>{currentPageTitle}</h1>
          <p>Manage and register system drivers stored in MongoDB</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal('driver')}>
          <Icon type="plus" />
          Add New Driver
        </button>
      </div>
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver ID</th>
              <th>Full Name</th>
              <th>License Number</th>
              <th>License Expiry</th>
              <th>Phone Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="7" className="cell-empty">
                  <div className="empty-state"><Vehicle name="minibus" width={120} label="Nothing here yet" />No drivers registered yet. Click "Add New Driver" to add one!</div>
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="mono-cell">{driver.id}</td>
                  <td className="table-strong">{driver.name}</td>
                  <td className="mono-cell">{driver.license}</td>
                  <td>{driver.expiry}</td>
                  <td>{driver.phone}</td>
                  <td>
                    <StatusBadge status={driver.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-edit" onClick={() => openModal('driver', 'edit', driver)}><Icon type="edit" />Edit</button>
                      <button type="button" className="btn btn-danger" onClick={() => openConfirm('driver', driver)}><Icon type="trash" />Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </section>
  );
}
