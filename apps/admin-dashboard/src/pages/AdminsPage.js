import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import Field from '../components/Field';
import TableShell from '../components/TableShell';
import ConfirmDialog from '../components/ConfirmDialog';
import { apiJson } from '../api';

const EMPTY = { username: '', name: '', password: '', currentPassword: '' };
const TITLES = { add: 'Add Administrator', edit: 'Edit Administrator', password: 'Change My Password' };

// Administrator accounts: add, rename, reset a password, delete, and change your own password.
export default function AdminsPage({ currentPageTitle, user, showNotification }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit' | 'password', id? }
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: '', label: '' });
  // App passes a new showNotification on every render; a ref keeps load() stable so the list is not refetched in a loop.
  const notify = useRef(showNotification);
  notify.current = showNotification;

  const load = useCallback(async () => {
    try {
      setAdmins(await apiJson('/admins'));
    } catch (err) {
      notify.current(`Could not load administrators: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (mode, record) => {
    setError('');
    setForm(record ? { ...EMPTY, username: record.username, name: record.name } : EMPTY);
    setModal({ mode, id: record?.id });
  };
  const close = () => setModal(null);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const save = async () => {
    setError('');
    try {
      if (modal.mode === 'add') {
        await apiJson('/admins', 'POST', { username: form.username.trim(), name: form.name.trim(), password: form.password });
        notify.current(`Administrator ${form.username.trim()} added.`);
      } else if (modal.mode === 'edit') {
        await apiJson(`/admins/${modal.id}`, 'PUT', { name: form.name.trim(), ...(form.password ? { password: form.password } : {}) });
        notify.current('Administrator updated.');
      } else {
        await apiJson('/admins/me/password', 'PUT', { currentPassword: form.currentPassword, newPassword: form.password });
        notify.current('Your password was changed.');
      }
      close();
      load();
    } catch (err) {
      setError(err.message); // keep the dialog open so the input is not lost
    }
  };

  const remove = async () => {
    const { id, label } = confirm;
    setConfirm({ open: false, id: '', label: '' });
    try {
      await apiJson(`/admins/${id}`, 'DELETE');
      notify.current(`${label} deleted.`);
    } catch (err) {
      notify.current(`Not deleted: ${err.message}`);
    }
    load();
  };

  const isMe = (a) => a.id === user?.id;

  return (
    <section className="page-section" data-page="admins">
      <div className="section-header">
        <div>
          <h1>{currentPageTitle}</h1>
          <p>People who can sign in to this console</p>
        </div>
        <div className="table-actions">
          <button type="button" className="btn btn-secondary" onClick={() => open('password')}><Icon type="lock" />Change My Password</button>
          <button type="button" className="btn btn-primary" onClick={() => open('add')}><Icon type="plus" />Add Administrator</button>
        </div>
      </div>
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="5" className="cell-empty">
                  <div className="empty-state"><Vehicle name="minibus" width={120} label="Nothing here yet" />{loading ? 'Loading administrators...' : 'No administrators found.'}</div>
                </td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr key={a.id}>
                  <td className="mono-cell">{a.username}{isMe(a) && <span className="badge badge-green" style={{ marginLeft: 8 }}>You</span>}</td>
                  <td className="table-strong">{a.name}</td>
                  <td>{a.role}</td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-edit" onClick={() => open('edit', a)}><Icon type="edit" />Edit</button>
                      <button type="button" className="btn btn-danger" disabled={isMe(a)} title={isMe(a) ? 'You cannot delete the account you are signed in with' : undefined} onClick={() => setConfirm({ open: true, id: a.id, label: `Administrator ${a.username}` })}><Icon type="trash" />Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {modal && (
        <div className="overlay" onClick={(event) => event.target === event.currentTarget && close()}>
          <div className="modal-box" role="dialog" aria-modal="true" aria-label={TITLES[modal.mode]}>
            <header className="modal-head">
              <span className="notch"><i><Icon type={modal.mode === 'password' ? 'lock' : 'user'} /></i></span>
              <div className="modal-head-copy">
                <span className="eyebrow">{modal.mode === 'add' ? 'New record' : 'Update record'}</span>
                <h3 className="modal-title">{TITLES[modal.mode]}</h3>
              </div>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close"><Icon type="close" /></button>
            </header>
            <div className="modal-form">
              {error && <p className="notification-text" role="alert">{error}</p>}
              {modal.mode !== 'password' && (
                <Field label="Username *">
                  <input className="form-input mono-input" value={form.username} onChange={set('username')} disabled={modal.mode === 'edit'} placeholder="e.g. dispatcher.1" autoComplete="off" />
                </Field>
              )}
              {modal.mode !== 'password' && (
                <Field label="Full Name">
                  <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Nimali Silva" />
                </Field>
              )}
              {modal.mode === 'password' && (
                <Field label="Current Password *">
                  <input type="password" className="form-input" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
                </Field>
              )}
              <Field label={modal.mode === 'add' ? 'Password * (8+ characters)' : modal.mode === 'edit' ? 'New Password (optional)' : 'New Password * (8+ characters)'}>
                <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder={modal.mode === 'edit' ? 'Leave blank to keep the current one' : ''} autoComplete="new-password" />
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={save}><Icon type="check" />Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirm.open && <ConfirmDialog confirmState={{ label: confirm.label }} closeConfirm={() => setConfirm({ open: false, id: '', label: '' })} handleDelete={remove} />}
    </section>
  );
}
