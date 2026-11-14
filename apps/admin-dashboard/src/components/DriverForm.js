import React from 'react';
import Field, { StatusOptions } from './Field';
import { ENTITIES } from '../entities';

export default function DriverForm({ formData, updateField }) {
  return (
    <div className="modal-form">
      <Field label="Full Name *" icon="user">
        <input
          className="form-input"
          value={formData.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="e.g. A. Bandara"
        />
      </Field>
      <Field label="License Number *" icon="card">
        <input
          className="form-input mono-input"
          value={formData.license}
          onChange={(event) => updateField('license', event.target.value)}
          placeholder="LK-2024-XXXXX"
        />
      </Field>
      <div className="form-grid">
        <Field label="License Expiry *" icon="calendar">
          <input
            type="date"
            className="form-input"
            value={formData.expiry}
            onChange={(event) => updateField('expiry', event.target.value)}
          />
        </Field>
        <Field label="Phone Number *" icon="phone">
          <input
            className="form-input"
            value={formData.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+94 7X XXX XXXX"
          />
        </Field>
      </div>
      <Field label="Driver Status" icon="pulse">
        <select className="form-input" value={formData.status || ENTITIES.driver.statuses[0]} onChange={(event) => updateField('status', event.target.value)}>
          <StatusOptions statuses={ENTITIES.driver.statuses} />
        </select>
      </Field>
    </div>
  );
}
