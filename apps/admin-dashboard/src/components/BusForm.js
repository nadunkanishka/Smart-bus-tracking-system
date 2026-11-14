import React from 'react';
import Field, { StatusOptions } from './Field';
import { ENTITIES } from '../entities';

export default function BusForm({ formData, updateField, mode, drivers }) {
  return (
    <div className="modal-form">
      <Field label="Registration Number (e.g. NB-4712) *" icon="bus">
        <input
          className="form-input mono-input"
          value={formData.registration}
          onChange={(event) => updateField('registration', event.target.value)}
          placeholder="e.g. NB-4712"
        />
      </Field>
      <div className="form-grid">
        <Field label="Seating Capacity *" icon="drivers">
          <input
            type="number"
            className="form-input"
            value={formData.capacity}
            onChange={(event) => updateField('capacity', event.target.value)}
            placeholder="52"
          />
        </Field>
        <Field label="Initial Mileage (km) *" icon="gauge">
          <input
            type="number"
            className="form-input"
            value={formData.mileage}
            onChange={(event) => updateField('mileage', event.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label={mode === 'edit' ? 'New Bus Password (optional)' : 'Bus Password *'} icon="lock">
          <input
            type="password"
            className="form-input mono-input"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder={mode === 'edit' ? 'Leave blank to keep the current one' : 'Driver app login password'}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Bus Operating Status" icon="pulse">
          <select
            className="form-input"
            value={formData.status}
            onChange={(event) => updateField('status', event.target.value)}
          >
            <StatusOptions statuses={ENTITIES.bus.statuses} />
          </select>
        </Field>
      </div>
      <Field label="Assigned Driver" icon="user">
        <select
          className="form-input"
          value={formData.assignedDriver}
          onChange={(event) => updateField('assignedDriver', event.target.value)}
        >
          <option value="">-- No Driver Assigned --</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
          ))}
        </select>
      </Field>
    </div>
  );
}
