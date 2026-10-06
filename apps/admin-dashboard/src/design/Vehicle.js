import React from 'react';
import { build, buildScene } from './vehicleShapes';

// Inline-SVG isometric buses for DOM apps (admin dashboard). All geometry and colour come from vehicleShapes.
const draw = (prims) => prims.map(([tag, props], i) => React.createElement(tag, { key: i, ...props }));

// status ('idle' | 'maint' | 'off') adds a badge above the roof; always pair it with a text label.
export function Vehicle({ name = 'bus', width = 160, livery, status, heading, running, marker, label, className, style }) {
  const { prims, vb, label: auto } = build(name, { livery, status, heading, running, marker });
  return (
    <svg className={className} style={style} width={width} height={Math.round((width * vb[3]) / vb[2])} viewBox={vb.join(' ')} role="img" aria-label={label || auto}>
      {draw(prims)}
    </svg>
  );
}

export function RoadScene({ scene = 'login', label = 'Buses on a road beside a bus stop', className }) {
  const { prims, vb } = buildScene(scene);
  return (
    <svg className={className} viewBox={vb.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {draw(prims)}
    </svg>
  );
}
