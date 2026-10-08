import React from 'react';
import { NAV_ICONS } from '../design/navIcons'; // CHANGED: shared vehicle illustration set

// CHANGED (visual only): sidebar items use the same filled two-tone glyphs as the mobile apps' bar.
export const NAV_FOR = { grid: 'home', drivers: 'people', bus: 'bus', route: 'route', pulse: 'pulse', chart: 'chart' };
export default function NavGlyph({ name }) {
  return (
    <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true">
      {(NAV_ICONS[name] || NAV_ICONS.home).map(([d, role, sw], i) => (sw
        ? <path key={i} d={d} className={`g-${role}-line`} fill="none" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        : <path key={i} d={d} className={`g-${role}`} />))}
    </svg>
  );
}
