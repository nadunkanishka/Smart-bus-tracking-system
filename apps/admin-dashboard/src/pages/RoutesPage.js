import React from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import TableShell from '../components/TableShell';

export default function RoutesPage({ currentPageTitle, routes, openModal, openConfirm }) {
  return (
    <section className="page-section" data-page="routes">
      <div className="section-header">
        <div>
          <h1>{currentPageTitle}</h1>
          <p>Setup network paths and intermediate stop lists in MongoDB</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal('route')}>
          <Icon type="plus" />
          Create Route
        </button>
      </div>
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Route ID</th>
              <th>Route Name</th>
              <th>Assigned Bus</th>
              <th>Start Terminal</th>
              <th>End Terminal</th>
              <th>Distance</th>
              <th>Stops</th>
              <th>Live Tracking</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan="10" className="cell-empty">
                  <div className="empty-state"><Vehicle name="coach" width={128} label="Nothing here yet" />No network routes created yet. Click "Create Route" to create one!</div>
                </td>
              </tr>
            ) : (
              routes.map((route) => (
                <tr key={route.id}>
                  <td className="mono-cell">{route.id}</td>
                  <td className="table-strong">{route.name}</td>
                  <td>
                    {route.assignedBus ? (
                      <span className="mono-cell cell-bus">
                        {route.assignedBus}
                      </span>
                    ) : (
                      <span className="cell-muted">Unassigned</span>
                    )}
                  </td>
                  <td>{route.start}</td>
                  <td>{route.end}</td>
                  <td>{route.distance}</td>
                  <td>
                    {Array.isArray(route.stops) ? (
                      route.stops.length > 0 ? (
                        <div>
                          <span className="table-strong">{route.stops.length} stop{route.stops.length > 1 ? 's' : ''}</span>
                          <div className="cell-hint">
                            {route.stops.join(' → ')}
                          </div>
                        </div>
                      ) : (
                        <span className="cell-muted">Direct Route</span>
                      )
                    ) : (
                      route.stops || 'N/A'
                    )}
                  </td>
                  <td>
                    {route.path.length > 1 && route.stopPoints.length > 1
                      ? <span className="badge badge-green">Ready</span>
                      : <span className="badge badge-amber">Needs map path and stops</span>}
                  </td>
                  <td>
                    <StatusBadge status={route.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-edit" onClick={() => openModal('route', 'edit', route)}><Icon type="edit" />Edit</button>
                      <button type="button" className="btn btn-danger" onClick={() => openConfirm('route', route)}><Icon type="trash" />Delete</button>
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
