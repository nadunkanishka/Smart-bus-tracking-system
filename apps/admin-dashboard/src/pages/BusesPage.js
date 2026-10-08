import React from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import TableShell from '../components/TableShell';

export default function BusesPage({ currentPageTitle, buses, drivers, openModal, openConfirm }) {
  return (
    <section className="page-section" data-page="buses">
      <div className="section-header">
        <div>
          <h1>{currentPageTitle}</h1>
          <p>Register new transit buses into MongoDB inventory</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal('bus')}>
          <Icon type="plus" />
          Add New Bus
        </button>
      </div>
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Bus ID</th>
              <th>Registration No.</th>
              <th>Passenger Capacity</th>
              <th>Total Mileage</th>
              <th>Driver</th>
              <th>Password</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td colSpan="8" className="cell-empty">
                  <div className="empty-state"><Vehicle name="bus" width={120} label="Nothing here yet" />No buses registered yet. Click "Add New Bus" to register a bus!</div>
                </td>
              </tr>
            ) : (
              buses.map((bus) => (
                <tr key={bus.id}>
                  <td className="mono-cell">{bus.id}</td>
                  <td className="mono-cell table-strong">{bus.registration}</td>
                  <td>{bus.capacity}</td>
                  <td>{bus.mileage}</td>
                  <td>
                    {drivers.find((d) => d.id === bus.assignedDriver)?.name || <span className="cell-muted">Unassigned</span>}
                  </td>
                  <td>
                    <span className={`badge ${bus.hasPassword ? 'badge-green' : 'badge-amber'}`}>{bus.hasPassword ? 'Set' : 'Not set'}</span>
                  </td>
                  <td>
                    <StatusBadge status={bus.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-edit" onClick={() => openModal('bus', 'edit', bus)}><Icon type="edit" />Edit</button>
                      <button type="button" className="btn btn-danger" onClick={() => openConfirm('bus', bus)}><Icon type="trash" />Delete</button>
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
