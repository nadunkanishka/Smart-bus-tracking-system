import React from 'react';
import Icon from './Icon';

// CHANGED (visual only): a leading icon chosen from the label text.
const FIELD_ICONS = [[/password/i, 'lock'], [/license number/i, 'card'], [/expiry/i, 'calendar'], [/phone/i, 'phone'], [/registration/i, 'bus'], [/capacity/i, 'drivers'], [/mileage/i, 'gauge'],
  [/status/i, 'pulse'], [/route number/i, 'hash'], [/terminal/i, 'pin'], [/distance/i, 'ruler'], [/assign(ed)? driver/i, 'user'], [/bus/i, 'bus'], [/route name/i, 'route'], [/name/i, 'user']];
export default function Field({ label, children }) {
  const icon = (FIELD_ICONS.find(([re]) => re.test(label)) || [])[1];
  return (
    <label className="field">
      <span className="form-label">{label}</span>
      {icon ? <span className="input-wrap"><Icon type={icon} className="lead" />{children}</span> : children}
    </label>
  );
}
