import React from 'react';
import { CountUp } from '../motion';

export default function Stat({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong><CountUp value={value} /></strong>
      <span>{hint}</span>
    </div>
  );
}
