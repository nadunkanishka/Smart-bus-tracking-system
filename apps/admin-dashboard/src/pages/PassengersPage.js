import React, { useCallback, useEffect, useState } from 'react';
import { Vehicle } from '../design/Vehicle';
import PageHeader from '../components/PageHeader';
import TableShell, { EmptyRow, RowActions } from '../components/TableShell';
import ConfirmDialog from '../components/ConfirmDialog';
import { apiJson } from '../api';

// Passenger accounts: listed and removed by the admin. Passengers create and edit their own accounts in the passenger app.
export default function PassengersPage({ showNotification }) {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // the passenger waiting for a delete confirmation

  const load = useCallback(async () => {
    try {
      setPassengers(await apiJson('/passengers'));
    } catch (err) {
      showNotification(`Could not load passengers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    const p = deleting;
    setDeleting(null);
    try {
      await apiJson(`/passengers/${encodeURIComponent(p.id)}`, 'DELETE');
      showNotification(`Passenger ${p.name} deleted.`);
    } catch (err) {
      showNotification(`Not deleted: ${err.message}`);
    }
    load();
  };

  return (
    <section className="page-section" data-page="passengers">
      <PageHeader subtitle="Commuter accounts created in the passenger app. Remove an account here if it is abusive or was made by mistake." />
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {passengers.length === 0 ? (
              <EmptyRow colSpan="5" art={<Vehicle name="minibus" width={120} label="Nothing here yet" />}>
                {loading ? 'Loading passengers...' : 'No passengers have registered yet.'}
              </EmptyRow>
            ) : (
              passengers.map((p) => (
                <tr key={p.id}>
                  <td className="mono-cell">@{p.username}</td>
                  <td className="table-strong">{p.name}</td>
                  <td>{p.phone || <span className="cell-muted">Not provided</span>}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td><RowActions onDelete={() => setDeleting(p)} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
      {deleting && (
        <ConfirmDialog
          text="Are you sure you want to permanently remove this passenger account?"
          target={`Passenger ${deleting.name}`}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}
