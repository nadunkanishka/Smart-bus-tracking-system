import React from 'react';
import { ASPECT, markerIndex, pick } from './vehicleShapes';
import { IMAGES } from './busImages';
import { MARKERS } from './busMarkers';

// Clay buses for DOM apps (admin dashboard): pre-rendered images chosen by vehicleShapes.pick().
// status ('idle' | 'maint' | 'off') adds a badge on the corner; always pair it with a text label.
export function Vehicle({ name = 'bus', width = 160, livery, status, heading, running, marker, label, className, style }) {
  if (marker) return <img className={className} style={style} src={MARKERS[markerIndex(heading)]} width={width} height={width} alt={label || 'Bus'} />;
  const { key, label: auto, badge } = pick(name, { livery, status, running });
  const size = Math.max(16, Math.round(width * 0.2));
  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative', width, height: Math.round(width * ASPECT), lineHeight: 0, ...style }} role="img" aria-label={label || auto}>
      <img src={IMAGES[key]} width={width} height={Math.round(width * ASPECT)} alt="" style={{ display: 'block' }} />
      {badge ? (
        <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: Math.round(width * 0.14), width: size, height: size, borderRadius: size, background: badge.bg, color: badge.fg, display: 'grid', placeItems: 'center', font: `800 ${Math.round(size * 0.68)}px/1 system-ui, sans-serif`, boxShadow: '0 1px 3px rgba(15,20,25,.25)' }}>{badge.glyph}</span>
      ) : null}
    </span>
  );
}

export function RoadScene({ scene = 'login', label = 'Buses on a two-lane road', className }) {
  return <img className={className} src={IMAGES[`scene-${scene}`] || IMAGES['scene-login']} alt={label} style={{ objectFit: 'contain' }} />;
}
