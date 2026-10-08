import React from 'react';
import { Vehicle } from '../design/Vehicle';

export default function KpiCard({ label, value, subtitle, tint, vehicle, livery }) {
  return (
    <div className={`kpi-card tint-${tint}`}>
      <Vehicle name={vehicle} livery={livery} width={212} className="kpi-art" label={`${vehicle} illustration`} />
      <p className="kpi-label">{label}</p>
      <strong>{value}</strong>
      <span>{subtitle}</span>
    </div>
  );
}
