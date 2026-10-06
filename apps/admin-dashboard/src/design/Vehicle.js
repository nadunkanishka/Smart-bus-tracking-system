import React from 'react';
import { SCENES, PALETTE, build, paint } from './vehicleShapes';

// Inline-SVG buses for DOM apps (admin dashboard). Colours come from PALETTE so tokens and art never drift.
export function VehicleShapes({ name, body, accent, status }) {
  const { v, shapes, palette } = build(name, status);
  return shapes.map((s, i) => React.createElement(s[0], { key: i, ...s[1], ...paint(s, v, { body, accent, palette }) }));
}

export function Vehicle({ name = 'bus', width = 160, body, accent, status, label, className, style }) {
  const { box, label: auto } = build(name, status);
  return (
    <svg className={className} style={style} width={width} height={Math.round((width * box[3]) / box[2])} viewBox={box.join(' ')} role="img" aria-label={label || auto}>
      <VehicleShapes name={name} body={body} accent={accent} status={status} />
    </svg>
  );
}

const SKYLINE = [[10, 88, 26], [44, 70, 44], [92, 96, 18], [250, 84, 30], [290, 64, 40], [326, 92, 22]];

export function RoadScene({ scene = 'login', label = 'Buses driving along a road', className }) {
  return (
    <svg className={className} viewBox="0 0 360 200" preserveAspectRatio="xMidYMax meet" role="img" aria-label={label}>
      <ellipse cx="60" cy="38" rx="30" ry="10" fill="#fff" opacity=".22" />
      <ellipse cx="86" cy="32" rx="22" ry="9" fill="#fff" opacity=".22" />
      <ellipse cx="290" cy="52" rx="34" ry="10" fill="#fff" opacity=".18" />
      {SKYLINE.map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={170 - y} rx="4" fill={PALETTE.PD} opacity=".28" />)}
      <rect x="0" y="168" width="360" height="32" fill={PALETTE.PD} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={14 + i * 52} y="183" width="26" height="4" rx="2" fill="#fff" opacity=".7" />)}
      {SCENES[scene].map(([n, x, y, s, body], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><VehicleShapes name={n} body={body} /></g>
      ))}
    </svg>
  );
}
