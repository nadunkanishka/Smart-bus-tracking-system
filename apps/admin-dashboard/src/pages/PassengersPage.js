import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import TableShell from '../components/TableShell';
import ConfirmDialog from '../components/ConfirmDialog';
import { apiJson } from '../api';

// Passenger accounts: listed and removed by the admin. Passengers create and edit their own accounts in the passenger app.
export default function PassengersPage({ currentPageTitle, showNotification }) {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, id: '', label: '' });
  // App passes a new showNotification on every render; a ref keeps load() stable so the list is not refetched in a loop.
  const notify = useRef(showNotification);
  notify.current = showNotification;

  const load = useCallback(async () => {
    try {
      setPassengers(await apiJson('/passengers'));
    } catch (err) {
      notify.current(`Could not load passengers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    const { id, label } = confirm;
    setConfirm({ open: false, id: '', label: '' });
    try {
      await apiJson(`/passengers/${encodeURIComponent(id)}`, 'DELETE');
      notify.current(`${label} deleted.`);
    } catch (err) {
      notify.current(`Not deleted: ${err.message}`);
    }
    load();
  };

  return (
    <section className="page-section" data-page="passengers">
      <div className="section-header">
        <div>
          <h1>{currentPageTitle}</h1>
          <p>Commuter accounts created in the passenger app. Remove an account here if it is abusive or was made by mistake.</p>
        </div>
      </div>
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
              <tr>
                <td colSpan="5" className="cell-empty">
                  <div className="empty-state"><Vehicle name="minibus" width={120} label="Nothing here yet" />{loading ? 'Loading passengers...' : 'No passengers have registered yet.'}</div>
                </td>
              </tr>
            ) : (
              passengers.map((p) => (
                <tr key={p.id}>
                  <td className="mono-cell">@{p.username}</td>
                  <td className="table-strong">{p.name}</td>
                  <td>{p.phone || <span className="cell-muted">Not provided</span>}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-danger" onClick={() => setConfirm({ open: true, id: p.id, label: `Passenger ${p.name}` })}><Icon type="trash" />Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
      {confirm.open && <ConfirmDialog confirmState={{ label: confirm.label }} closeConfirm={() => setConfirm({ open: false, id: '', label: '' })} handleDelete={remove} />}
    </section>
  );
}
