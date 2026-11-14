import { useState } from 'react';
import { apiJson } from '../api';
import { ENTITIES, missingFields, recordKey, recordLabel } from '../entities';

// The add/edit dialog and the delete confirmation for drivers, buses and routes. What differs per entity is in entities.js.
export function useEntityModal({ showNotification, fetchBackendData }) {
  const [modal, setModal] = useState({ open: false, entity: 'driver', mode: 'add', editId: null });
  const [formData, setFormData] = useState(ENTITIES.driver.blank);
  const [confirm, setConfirm] = useState(null); // { entity, record } while the delete confirmation is open

  const openModal = (entity, mode = 'add', record = null) => {
    setModal({ open: true, entity, mode, editId: record ? recordKey(record) : null });
    setFormData(record ? ENTITIES[entity].toForm(record) : ENTITIES[entity].blank);
  };

  const closeModal = () => {
    setModal((current) => ({ ...current, open: false, editId: null }));
    setFormData(ENTITIES[modal.entity].blank);
  };

  const updateField = (key, value) => setFormData((current) => ({ ...current, [key]: value }));

  // Sends a write. Returns true on success; on failure shows the server's message and keeps the form open.
  const send = async (method, path, payload, successMessage) => {
    try {
      await apiJson(path, method, payload ?? undefined);
      showNotification(successMessage);
      return true;
    } catch (err) {
      showNotification(`Not saved: ${err.message}`);
      return false;
    }
  };

  const handleSave = async () => {
    const { entity, mode, editId } = modal;
    const missing = missingFields(entity, formData, mode);
    if (missing.length) {
      showNotification(`Please fill in: ${missing.join(', ')}.`);
      return;
    }
    const { collection } = ENTITIES[entity];
    const payload = ENTITIES[entity].toPayload(formData);
    const label = recordLabel(entity, payload);
    const ok = mode === 'edit'
      ? await send('PUT', `/${collection}/${editId}`, payload, `${label} updated.`)
      : await send('POST', `/${collection}`, payload, `${label} added.`);
    if (!ok) return;
    closeModal();
    fetchBackendData();
  };

  const openConfirm = (entity, record) => setConfirm({ entity, record });
  const closeConfirm = () => setConfirm(null);

  const handleDelete = async () => {
    const { entity, record } = confirm;
    closeConfirm();
    await send('DELETE', `/${ENTITIES[entity].collection}/${encodeURIComponent(recordKey(record))}`, null, `${ENTITIES[entity].noun} deleted.`);
    await fetchBackendData();
  };

  return { modal, formData, setFormData, updateField, openModal, closeModal, handleSave, confirm, openConfirm, closeConfirm, handleDelete };
}
