import React from 'react';
import Field from './Field';

export default function DriverForm({ formData, updateField }) {
  return (
    <div className="modal-form">
      <Field label="Full Name *">
        <input
          className="form-input"
          value={formData.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="e.g. A. Bandara"
        />
      </Field>
      <Field label="License Number *">
        <input
          className="form-input mono-input"
          value={formData.license}
          onChange={(event) => updateField('license', event.target.value)}
          placeholder="LK-2024-XXXXX"
        />
      </Field>
      <div className="form-grid">
        <Field label="License Expiry *">
          <input
            type="date"
            className="form-input"
            value={formData.expiry}
            onChange={(event) => updateField('expiry', event.target.value)}
          />
        </Field>
        <Field label="Phone Number *">
          <input
            className="form-input"
            value={formData.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+94 7X XXX XXXX"
          />
        </Field>
      </div>
    </div>
  );
}
