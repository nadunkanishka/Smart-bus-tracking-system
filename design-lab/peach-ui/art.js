// Icons (one outline set: 24 grid, 2px round strokes) and illustrations, all original inline SVG.
window.PEACH_ART = (function () {
  const PATHS = {
    home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
    list: 'M5 7h3M5 12h3M5 17h3M12 7h7M12 12h7M12 17h7',
    award: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 14l-1 6 4-2 4 2-1-6',
    book: 'M4 6a2 2 0 0 1 2-2h5v16H6a2 2 0 0 1-2-2zM11 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
    bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
    bolt: 'M13 3L5 13h6l-1 8 8-10h-6z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    back: 'M15 6l-6 6 6 6',
    external: 'M10 6H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3M13 5h6v6M19 5l-8 8',
    clock: 'M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 9v4l2.5 2M9 3h6',
    chart: 'M6 19V11M12 19V5M18 19v-6',
    chevron: 'M7 10l5 5 5-5',
    dots: 'M6 12h.01M12 12h.01M18 12h.01',
    layers: 'M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4',
    spiral: 'M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6',
    helix: 'M7 3c0 6 10 6 10 12 0 3-2 5-5 6M17 3c0 6-10 6-10 12 0 3 2 5 5 6M9 7h6M9 17h6',
    alert: 'M12 8v5M12 16.5v.01M12 3l9 16H3z',
  };
  const icon = (name, size = 20, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${name === 'dots' ? 3 : 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}><path d="${PATHS[name] || PATHS.dots}"/></svg>`;

  const star = (cx, cy, r, fill, points = 5, inner = 0.45) => {
    const p = Array.from({ length: points * 2 }, (_, i) => { const a = (Math.PI * i) / points - Math.PI / 2, rr = i % 2 ? r * inner : r; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; });
    return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
  };
  const sparkle = (cx, cy, r, fill = '#FFFFFF') => star(cx, cy, r, fill, 4, 0.28);
  const svg = (vb, label, body, cls = '') => `<svg viewBox="${vb}" class="${cls}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;

  const ART = {
    trophy: (cls) => svg('0 0 160 172', 'Trophy with a star', `
      <path d="M44 46c-24-6-32 16-22 32s30 16 36 4" fill="none" stroke="#B9B3F2" stroke-width="11" stroke-linecap="round"/>
      <path d="M116 46c24-6 32 16 22 32s-30 16-36 4" fill="none" stroke="#A39CEB" stroke-width="11" stroke-linecap="round"/>
      <path d="M40 32h80c0 46-14 74-40 74S40 78 40 32z" fill="#F6C344"/>
      <path d="M98 32h22c0 46-14 74-40 74 16-10 22-42 18-74z" fill="#E3A82F"/>
      <ellipse cx="80" cy="32" rx="40" ry="11" fill="#F7A8D8"/><ellipse cx="80" cy="33.5" rx="31" ry="6.5" fill="#E77FC0"/>
      ${star(80, 66, 17, '#8E86E0')}
      <rect x="72" y="102" width="16" height="24" rx="6" fill="#F79B62"/><circle cx="80" cy="108" r="10" fill="#FFA265"/>
      <path d="M52 144c0-13 12-22 28-22s28 9 28 22z" fill="#F6C344"/><rect x="44" y="140" width="72" height="15" rx="7.5" fill="#E3A82F"/>
      ${sparkle(26, 22, 8)}${sparkle(140, 120, 6)}${star(132, 18, 7, '#F6C344')}`, cls),
    cap: (cls) => svg('0 0 230 180', 'Graduation cap', `
      <path d="M6 150C40 110 30 60 70 20" fill="none" stroke="rgba(38,38,43,.32)" stroke-width="1.6" stroke-dasharray="5 7"/>
      <path d="M150 6c40 20 70 60 76 110" fill="none" stroke="rgba(38,38,43,.32)" stroke-width="1.6" stroke-dasharray="5 7"/>
      <path d="M78 96v34c0 16 92 16 92 0V96l-46 20z" fill="#B9B3F2"/>
      <path d="M124 116l46-20v34c0 9-20 13-46 13z" fill="#A39CEB"/>
      <polygon points="30,74 124,34 218,74 124,114" fill="#7C7BE0"/>
      <polygon points="30,74 124,114 124,122 30,82" fill="#5E5FAE"/><polygon points="218,74 124,114 124,122 218,82" fill="#6C6BC6"/>
      <path d="M124 74l80 6v40" fill="none" stroke="#3F3F8C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="198" y="118" width="12" height="20" rx="4" fill="#F6C344"/><circle cx="124" cy="74" r="6" fill="#3F3F8C"/>
      ${star(86, 18, 10, '#F6C344')}${sparkle(160, 22, 6)}${sparkle(24, 40, 5)}${sparkle(200, 160, 5)}`, cls),
    medal: (cls) => svg('0 0 48 48', 'Gold medal', `<circle cx="24" cy="24" r="22" fill="#C98A3E"/><circle cx="24" cy="23" r="19" fill="#E8B06E"/><circle cx="24" cy="23" r="13" fill="#F6C344"/>${star(24, 23, 8.5, '#FFF3D6')}<circle cx="24" cy="23" r="2.4" fill="#F7A8D8"/>`, cls),
    books: (cls) => svg('0 0 32 32', '', `<rect x="5" y="20" width="22" height="6" rx="2" fill="#5BB98C"/><rect x="7" y="13" width="20" height="6" rx="2" fill="#E8534A"/><rect x="4" y="6" width="21" height="6" rx="2" fill="#6C6BC6"/><path d="M8 9h6M11 16h6M9 23h7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`, cls),
    abacus: (cls) => svg('0 0 32 32', '', `<rect x="4" y="5" width="24" height="22" rx="4" fill="#A85624"/><rect x="7" y="8" width="18" height="16" rx="2" fill="#F6E8DF"/><path d="M7 13h18M7 19h18" stroke="#A85624" stroke-width="1.4"/><circle cx="11" cy="13" r="2.4" fill="#E8534A"/><circle cx="16" cy="13" r="2.4" fill="#E8534A"/><circle cx="20" cy="19" r="2.4" fill="#6C6BC6"/><circle cx="14" cy="19" r="2.4" fill="#F6C344"/>`, cls),
    dna: (cls) => svg('0 0 32 32', '', `<path d="M10 4c0 8 12 8 12 14s-6 8-8 10" fill="none" stroke="#E77FC0" stroke-width="3" stroke-linecap="round"/><path d="M22 4c0 8-12 8-12 14s6 8 8 10" fill="none" stroke="#6C6BC6" stroke-width="3" stroke-linecap="round"/><path d="M12 9h8M12 22h8" stroke="#3F3F8C" stroke-width="2" stroke-linecap="round"/>`, cls),
    loops: (cls) => svg('0 0 200 160', '', `<path d="M10 150c30-60 80-10 60-60S120 20 150 50s-30 60 10 70 40-50 30-80" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" opacity=".28"/>`, cls),
    backdrop: (cls) => `<svg class="${cls}" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-40 120c160 40 120 260 300 280s200-200 360-140 80 300 260 320 220-120 380-60" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".28"/>
      <path d="M140 900c20-140 160-200 280-150" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".22"/>
      ${[[110, 30, 16], [40, 150, 20], [410, 760, 18], [1150, 380, 18], [820, 710, 14], [1080, 60, 12]].map(([x, y, r]) => star(x, y, r, 'rgba(255,255,255,.45)')).join('')}</svg>`,
  };

  // A simple friendly face from a few data fields; no real person is depicted.
  function avatar(p, size = 36, cls = '') {
    return `<svg class="avatar ${cls}" width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="${p.name}"><circle cx="24" cy="24" r="24" fill="${p.bg}"/>
      <path d="M11 26c-2-14 6-20 13-20s15 6 13 20z" fill="${p.hair}"/><ellipse cx="24" cy="27" rx="10.5" ry="12" fill="${p.skin}"/>
      <path d="M13 22c2-8 8-10 11-10s9 2 11 10c-4-3-8-5-11-5s-7 2-11 5z" fill="${p.hair}"/>
      <circle cx="19.5" cy="27" r="1.5" fill="#26262B"/><circle cx="28.5" cy="27" r="1.5" fill="#26262B"/>
      ${p.glasses ? '<g fill="none" stroke="#26262B" stroke-width="1.3"><circle cx="19.5" cy="27" r="4"/><circle cx="28.5" cy="27" r="4"/><path d="M23.5 27h1"/></g>' : ''}
      <path d="M20.5 32.5q3.5 3 7 0" fill="none" stroke="#26262B" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8 48c2-9 9-11 16-11s14 2 16 11z" fill="#fff" opacity=".9"/></svg>`;
  }

  return { icon, art: (name, cls = '') => (ART[name] || ART.books)(cls), avatar };
})();
