import React from 'react';

export default function Stat({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </div>
  );
}
