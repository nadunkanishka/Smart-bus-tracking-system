import React from 'react';
import Icon from './Icon';

// A labelled form control; `icon` (an Icon name) is drawn inside the control's leading edge.
export default function Field({ label, icon, children }) {
  return (
    <label className="field">
      <span className="form-label">{label}</span>
      {icon ? <span className="input-wrap"><Icon type={icon} className="lead" />{children}</span> : children}
    </label>
  );
}

// The <option>s of a status select, from the entity's allowed values.
export const StatusOptions = ({ statuses }) => statuses.map((s) => <option key={s} value={s}>{s}</option>);
