import React, { useCallback, useEffect, useState } from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from '../components/Icon';
import Field from '../components/Field';
import ModalShell from '../components/ModalShell';
import PageHeader from '../components/PageHeader';
import TableShell, { EmptyRow, RowActions } from '../components/TableShell';
import ConfirmDialog from '../components/ConfirmDialog';
import { apiJson } from '../api';

const EMPTY = { username: '', name: '', password: '', currentPassword: '' };
const TITLES = { add: 'Add Administrator', edit: 'Edit Administrator', password: 'Change My Password' };
const PASSWORD_LABELS = { add: 'Password * (8+ characters)', edit: 'New Password (optional)', password: 'New Password * (8+ characters)' };

// Administrator accounts: add, rename, reset a password, delete, and change your own password.
export default function AdminsPage({ user, showNotification }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit' | 'password', id? }
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null); // the administrator waiting for a delete confirmation

  const load = useCallback(async () => {
    try {
      setAdmins(await apiJson('/admins'));
    } catch (err) {
      showNotification(`Could not load administrators: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

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
        showNotification(`Administrator ${form.username.trim()} added.`);
      } else if (modal.mode === 'edit') {
        await apiJson(`/admins/${modal.id}`, 'PUT', { name: form.name.trim(), ...(form.password ? { password: form.password } : {}) });
        showNotification('Administrator updated.');
      } else {
        // A wrong current password answers 401: show it here instead of signing out.
        await apiJson('/admins/me/password', 'PUT', { currentPassword: form.currentPassword, newPassword: form.password }, { keepSession: true });
        showNotification('Your password was changed.');
      }
      close();
      load();
    } catch (err) {
      setError(err.message); // keep the dialog open so the input is not lost
    }
  };

  const remove = async () => {
    const a = deleting;
    setDeleting(null);
    try {
      await apiJson(`/admins/${a.id}`, 'DELETE');
      showNotification(`Administrator ${a.username} deleted.`);
    } catch (err) {
      showNotification(`Not deleted: ${err.message}`);
    }
    load();
  };

  const isMe = (a) => a.id === user?.id;

  return (
    <section className="page-section" data-page="admins">
      <PageHeader subtitle="People who can sign in to this console">
        <div className="table-actions">
          <button type="button" className="btn btn-secondary" onClick={() => open('password')}><Icon type="lock" />Change My Password</button>
          <button type="button" className="btn btn-primary" onClick={() => open('add')}><Icon type="plus" />Add Administrator</button>
        </div>
      </PageHeader>
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
              <EmptyRow colSpan="5" art={<Vehicle name="minibus" width={120} label="Nothing here yet" />}>
                {loading ? 'Loading administrators...' : 'No administrators found.'}
              </EmptyRow>
            ) : (
              admins.map((a) => (
                <tr key={a.id}>
                  <td className="mono-cell">{a.username}{isMe(a) && <span className="badge badge-green" style={{ marginLeft: 8 }}>You</span>}</td>
                  <td className="table-strong">{a.name}</td>
                  <td>{a.role}</td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td>
                    <RowActions
                      onEdit={() => open('edit', a)}
                      onDelete={() => setDeleting(a)}
                      deleteDisabled={isMe(a)}
                      deleteTitle={isMe(a) ? 'You cannot delete the account you are signed in with' : undefined}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {modal && (
        <ModalShell
          icon={modal.mode === 'password' ? 'lock' : 'user'}
          eyebrow={modal.mode === 'add' ? 'New record' : 'Update record'}
          title={TITLES[modal.mode]}
          onClose={close}
          onSave={save}
        >
          <div className="modal-form">
            {error && <p className="notification-text" role="alert">{error}</p>}
            {modal.mode !== 'password' && (
              <Field label="Username *" icon="user">
                <input className="form-input mono-input" value={form.username} onChange={set('username')} disabled={modal.mode === 'edit'} placeholder="e.g. dispatcher.1" autoComplete="off" />
              </Field>
            )}
            {modal.mode !== 'password' && (
              <Field label="Full Name" icon="user">
                <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Nimali Silva" />
              </Field>
            )}
            {modal.mode === 'password' && (
              <Field label="Current Password *" icon="lock">
                <input type="password" className="form-input" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
              </Field>
            )}
            <Field label={PASSWORD_LABELS[modal.mode]} icon="lock">
              <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder={modal.mode === 'edit' ? 'Leave blank to keep the current one' : ''} autoComplete="new-password" />
            </Field>
          </div>
        </ModalShell>
      )}

      {deleting && (
        <ConfirmDialog
          text="Are you sure you want to permanently remove this administrator account?"
          target={`Administrator ${deleting.username}`}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}
