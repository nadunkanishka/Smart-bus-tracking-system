import { useState } from 'react';
import { api } from '../api';

const modalDefaults = {
  driver: { name: '', license: '', expiry: '', phone: '' },
  bus: { registration: '', capacity: '', mileage: '', password: '', assignedDriver: '', status: 'Active' },
  route: { name: '', routeNumber: '', start: '', end: '', distance: '', stopPoints: [], path: [], assignedBus: '' },
};

// State and actions for the add/edit dialog and the delete confirmation, shared by drivers, buses and routes.
export function useEntityModal({ showNotification, fetchBackendData }) {
  // Modal & Confirm dialogs
  const [modalState, setModalState] = useState({
    open: false,
    entity: 'driver',
    mode: 'add',
    editId: null,
  });
  const [formData, setFormData] = useState(modalDefaults.driver);
  const [confirmState, setConfirmState] = useState({
    open: false,
    entity: 'driver',
    id: '',
    rawId: '',
    label: '',
  });

  const openModal = (entity, mode = 'add', record = null) => {
    setModalState({
      open: true,
      entity,
      mode,
      editId: record?.rawId || record?.id || null,
    });

    if (record) {
      if (entity === 'driver') {
        setFormData({
          name: record.name,
          license: record.license,
          expiry: record.expiry,
          phone: record.phone,
        });
      } else if (entity === 'bus') {
        setFormData({
          registration: record.registration,
          capacity: record.rawCapacity ?? String(record.capacity).replace(' seats', ''),
          mileage: record.rawMileage ?? String(record.mileage).replace(' km', '').replaceAll(',', ''),
          password: '', // write-only: blank keeps the current password
          assignedDriver: record.assignedDriver || '',
          status: record.status || 'Active',
        });
      } else {
        setFormData({
          name: record.name,
          start: record.start,
          end: record.end,
          distance: record.rawDistance ?? String(record.distance).replace(' km', ''),
          routeNumber: record.routeNumber || '',
          stopPoints: record.stopPoints || [],
          path: record.path || [],
          assignedBus: record.assignedBus || '',
        });
      }
      return;
    }

    setFormData(modalDefaults[entity]);
  };

  const closeModal = () => {
    setModalState((current) => ({ ...current, open: false, editId: null }));
    setFormData(modalDefaults[modalState.entity]);
  };

  const openConfirm = (entity, record) => {
    const label =
      entity === 'driver'
        ? `Driver: ${record.name}`
        : entity === 'bus'
          ? `Bus: ${record.registration}`
          : `Route: ${record.name}`;

    setConfirmState({
      open: true,
      entity,
      id: record.id,
      rawId: record.rawId || record._id || record.id,
      registration: record.registration || '',
      label,
    });
  };

  const closeConfirm = () => {
    setConfirmState({ open: false, entity: 'driver', id: '', rawId: '', label: '' });
  };

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  // Sends a write to the API. Returns true on success; on failure shows the server's message and keeps the form open.
  const send = async (method, path, payload, successMessage) => {
    try {
      const res = await api(path, { method, body: payload ? JSON.stringify(payload) : undefined });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showNotification(`Not saved: ${data.error || `server returned ${res.status}`}`);
        return false;
      }
      showNotification(successMessage);
      return true;
    } catch (err) {
      showNotification('Not saved: could not reach the backend server.');
      return false;
    }
  };

  const handleSave = async () => {
    const { entity, mode, editId } = modalState;
    const missing = (fields) => fields.filter(([value]) => !String(value ?? '').trim()).map(([, label]) => label);
    let payload;
    let required;
    let label;

    if (entity === 'driver') {
      required = missing([[formData.name, 'full name'], [formData.license, 'license number'], [formData.expiry, 'license expiry'], [formData.phone, 'phone number']]);
      payload = { name: formData.name.trim(), license: formData.license.trim(), expiry: formData.expiry, phone: formData.phone.trim(), status: 'Active' };
      label = `Driver ${payload.name}`;
    } else if (entity === 'bus') {
      required = missing([[formData.registration, 'registration number'], [formData.capacity, 'seating capacity'], [formData.mileage, 'mileage']]);
      if (mode !== 'edit' && !formData.password) required.push('bus password');
      payload = {
        registration: formData.registration.trim(),
        capacity: Number(formData.capacity),
        mileage: Number(formData.mileage),
        password: formData.password || '',
        assignedDriver: formData.assignedDriver || '',
        status: formData.status || 'Active',
      };
      label = `Bus ${payload.registration}`;
    } else {
      const stopPoints = (formData.stopPoints || []).map((sp) => ({ ...sp, name: sp.name.trim() }));
      required = missing([[formData.name, 'route name'], [formData.start, 'start terminal'], [formData.end, 'end terminal'], [formData.distance, 'distance']]);
      if (stopPoints.some((sp) => !sp.name)) required.push('a name for every stop');
      payload = {
        name: formData.name.trim(),
        routeNumber: String(formData.routeNumber || '').trim(),
        start: formData.start.trim(),
        end: formData.end.trim(),
        distance: Number(formData.distance),
        stopPoints,
        stops: stopPoints.map((sp) => sp.name),
        path: formData.path || [],
        assignedBus: formData.assignedBus || '',
        status: 'Active',
      };
      label = `Route ${payload.name}`;
    }

    if (required.length) {
      showNotification(`Please fill in: ${required.join(', ')}.`);
      return;
    }

    const ok = mode === 'edit'
      ? await send('PUT', `/${entity}s/${editId}`, payload, `${label} updated.`)
      : await send('POST', `/${entity}s`, payload, `${label} added.`);
    if (!ok) return;

    closeModal();
    fetchBackendData();
  };

  const handleDelete = async () => {
    const { entity, id, rawId } = confirmState;
    closeConfirm();
    await send('DELETE', `/${entity}s/${encodeURIComponent(rawId || id)}`, null, `${entity.charAt(0).toUpperCase()}${entity.slice(1)} deleted.`);
    await fetchBackendData();
  };

  return { modalState, formData, setFormData, confirmState, openModal, closeModal, openConfirm, closeConfirm, updateField, handleSave, handleDelete };
}
