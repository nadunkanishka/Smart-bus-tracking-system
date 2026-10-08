// Peach learning UI — components (functions returning HTML), three screens, the app shell and the gallery.
// Everything reads from window.PEACH_DATA. Local interactions only; lines marked HOOK are where real data or routing connects.
(function () {
  const D = window.PEACH_DATA, { icon, art, avatar } = window.PEACH_ART;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const person = (i) => D.people[i];

  // ── Components ──
  const C = {
    stack: (ids, more) => `<div class="stack">${ids.map((i) => avatar(person(i), 32)).join('')}${more ? `<span class="stack-more">+${more}</span>` : ''}</div>`,
    bell: (dot = true, disabled = false) => `<button class="icon-btn" aria-label="Notifications${dot ? ', new' : ''}"${disabled ? ' disabled' : ''}>${icon('bell')}${dot ? '<span class="dot"></span>' : ''}</button>`,
    header: () => `<header class="hdr">${avatar(person(D.user.person), 52, 'lg')}<div class="hdr-text"><span class="hdr-name">Hello, ${D.user.name}</span><span class="hdr-meta">${icon('bolt', 14, 'style="color:var(--purple-strong)"')}Progress: <b>${D.user.progress}%</b></span></div>${C.bell(D.user.hasNotifications)}</header>`,
    ring: (pct, { light = false, label = 'Open', go = '', disabled = false } = {}) => `<button class="ring-btn${light ? ' light' : ''}" aria-label="${label}, ${pct}% complete"${go ? ` data-go="${go}"` : ''}${disabled ? ' disabled' : ''}>
      <svg class="ring" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle class="track" cx="32" cy="32" r="30" stroke-width="2"/><circle class="value" cx="32" cy="32" r="30" stroke-width="2.5" stroke-dasharray="188.5" stroke-dashoffset="188.5" data-ring="${pct}"/></svg>${icon('arrow')}</button>`,
    hero: (h = D.hero) => `<section class="hero on-dark"><h2 class="hero-title">${h.title}</h2><p class="hero-sub">${h.before} <mark>${h.highlight}</mark> ${h.after}</p>${C.ring(h.progress, { label: h.title, go: 'courses' })}${art('trophy', 'hero-art')}</section>`,
    stat: (s) => `<div class="stat ${s.tone}"><span class="notch"><i>${icon(s.icon, 16)}</i></span><span class="stat-label">${s.label}</span><b class="stat-value" data-count="${s.value}">${s.value}</b></div>`,
    chip: ({ label, tone = 'plain', icon: ic, pressed, disabled }) => `<button class="chip ${tone}"${pressed != null ? ` aria-pressed="${pressed}" data-toggle` : ''}${disabled ? ' disabled' : ''}>${ic ? icon(ic, 16) : ''}${label}</button>`,
    subject: (s, on) => `<button class="chip plain subject" aria-pressed="${on}" data-subject><i>${art(s.art)}</i>${s.name}</button>`,
    seg: (options, active) => `<div class="seg" role="group" aria-label="Period">${options.map((o) => `<button aria-pressed="${o === active}" data-period="${o}">${o}</button>`).join('')}</div>`,
    drop: (options, active = 0) => `<div class="drop"><button class="chip plain" aria-haspopup="listbox" aria-expanded="false" data-drop>${icon('list', 16, 'style="color:var(--purple-strong)"')}<span data-drop-label>${options[active]}</span>${icon('chevron', 16)}</button>
      <div class="drop-menu" role="listbox" hidden>${options.map((o, i) => `<button role="option" aria-selected="${i === active}" data-filter="${i}">${o}</button>`).join('')}</div></div>`,
    dots: (n, active = 0) => `<div class="dots" role="group" aria-label="Slides">${Array.from({ length: n }, (_, i) => `<button aria-label="Slide ${i + 1}" aria-current="${i === active}" data-slide="${i}"></button>`).join('')}</div>`,
    rating: (r = D.progress.rating) => `<div class="rating">${art('medal', '').replace('<svg', '<svg width="44" height="44"')}<div class="rating-text"><b>${r.title}</b><span>${r.sub}</span></div>${C.stack(r.people)}</div>`,
    course: (c) => `<article class="course ${c.tone}${c.tone === 'dark' ? ' on-dark' : ''}">${art('loops', 'course-art')}
      <div class="course-top"><span class="badge${c.tone === 'lilac' ? ' lilac' : ''}">${icon(c.icon, 22)}</span><button class="icon-btn sm ${c.tone === 'dark' ? 'glass' : 'solid'}" aria-label="Open ${c.title} in a new view">${icon('external', 18)}</button></div>
      <span class="eyebrow">${c.eyebrow}</span><h3 class="course-title">${c.title}</h3>
      <div class="course-foot">${C.stack(c.people, c.more)}${C.ring(c.progress, { light: true, label: c.title })}</div></article>`,
    nav: (active) => `<nav class="nav" aria-label="Main" style="--i:${Math.max(0, D.nav.findIndex((n) => n.id === active))}">${D.nav.map((n) => `<button aria-label="${n.label}" data-go="${n.id}"${n.id === active ? ' aria-current="page"' : ''}>${icon(n.icon, 22)}</button>`).join('')}</nav>`,

    // Three-month stacked bar: a coloured cap per month over a hatched base. Data-driven from D.performance.months.
    stacked(months = D.performance.months) {
      const tone = { orange: '#FFA265', purple: '#AFB6FA', grey: '#D1D1D1' }, max = Math.max(...months.map((m) => m.lessons)), w = 300 / months.length;
      const cols = months.map((m, i) => { const h = 16 + (m.lessons / max) * 26, x = i * w, r = 10;
        return `<rect x="${x}" y="8" width="${w}" height="52" fill="url(#hatch-g)"/><path class="grow" style="--k:${i}" d="M${x} ${8 + h}V${8 + r}Q${x} 8 ${x + r} 8H${x + w - r}Q${x + w} 8 ${x + w} ${8 + r}V${8 + h}Z" fill="${tone[m.tone]}"/><line x1="${x + 0.75}" y1="4" x2="${x + 0.75}" y2="74" stroke="#C9CAD3" stroke-dasharray="3 4"/>`; }).join('');
      return `<div class="chart"><svg viewBox="0 0 300 76" role="img" aria-label="Lessons per month: ${months.map((m) => `${m.name} ${m.lessons}`).join(', ')}"><defs><pattern id="hatch-g" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#ECECF2"/><rect width="2" height="7" fill="#DCDCE6"/></pattern></defs>${cols}<line x1="299.25" y1="4" x2="299.25" y2="74" stroke="#C9CAD3" stroke-dasharray="3 4"/></svg></div>
        <div class="legend">${months.map((m) => `<div><b>${m.name}</b><span style="--dot:${tone[m.tone]}">${m.lessons} lessons</span></div>`).join('')}</div>`;
    },
    // Pill bars with value badges; the tallest bar is hatched. bars = [[label, value], ...]
    pills(bars) {
      const max = Math.max(...bars.map((b) => b[1])), slot = 300 / bars.length, bw = 36, H = 124, top = 12;
      const g = bars.map(([d, v], i) => { const x = i * slot + (slot - bw) / 2, h = Math.max(bw, (v / max) * H), y = top + H - h, hot = v === max;
        return `<line x1="${i * slot + 0.75}" y1="4" x2="${i * slot + 0.75}" y2="${top + H + 6}" stroke="#E4C4AF" stroke-dasharray="3 4"/>
          <g class="grow" style="--k:${i}"><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="${bw / 2}" fill="${hot ? 'url(#hatch-o)' : '#E4C4AF'}"/><rect x="${x}" y="${y}" width="${bw}" height="${bw}" rx="${bw / 2}" fill="#A85624"/><text x="${x + bw / 2}" y="${y + bw / 2 + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${v}</text></g>
          <text x="${x + bw / 2}" y="${top + H + 22}" text-anchor="middle" font-size="12" font-weight="500" fill="#55545C">${d}</text>`; }).join('');
      return `<div class="chart"><svg viewBox="0 0 300 164" role="img" aria-label="Lessons: ${bars.map(([d, v]) => `${d} ${v}`).join(', ')}"><defs><pattern id="hatch-o" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#FCAA72"/><rect width="3" height="7" fill="#F0934F"/></pattern></defs>${g}</svg>
        <table class="sr"><caption>Lessons</caption><tbody>${bars.map(([d, v]) => `<tr><th scope="row">${d}</th><td>${v}</td></tr>`).join('')}</tbody></table></div>`;
    },
    statsCard(period) {
      const p = D.progress.periods[period];
      return `<section class="stats-card" data-stats><span class="notch"><i>${icon('chart', 18)}</i></span>${C.seg(Object.keys(D.progress.periods), period)}
        <div class="bigs"><div><b data-count="${p.lessons}">${p.lessons}</b><span>lessons</span></div><div><b data-count="${p.hours}">${p.hours}</b><span>hours</span></div></div>${C.pills(p.bars)}</section>`;
    },
    state: (kind, title, text) => `<div class="state${kind === 'error' ? ' error' : ''}" ${kind === 'error' ? 'role="alert"' : ''}>${kind === 'error' ? icon('alert', 28, 'style="color:var(--error)"') : art('books').replace('<svg', '<svg width="44" height="44"')}<b>${title}</b><p>${text}</p></div>`,
  };

  // ── Screens ──
  const SCREENS = {
    home: () => `${C.header()}${C.hero()}<div class="stats">${D.stats.map(C.stat).join('')}</div>
      <section class="card"><div class="card-head"><h2 class="card-title">${D.performance.title}</h2><button class="icon-btn sm" aria-label="More options" style="border:0">${icon('dots')}</button></div>${C.stacked()}</section>`,
    courses: () => `<div class="hdr-orange">${art('cap', 'hdr-art')}<button class="icon-btn" aria-label="Back" data-go="home">${icon('back')}</button><h1 class="screen-title">${D.courses.title}</h1><div class="row">${D.courses.chips.map(C.chip).join('')}</div></div>
      <div class="sheet"><div class="chip-row" role="group" aria-label="Subjects">${D.courses.subjects.map((s, i) => C.subject(s, i === 0)).join('')}</div>${D.courses.cards.map(C.course).join('')}</div>`,
    progress: (s) => `${C.header()}<div class="title-row"><h1 class="screen-title">${D.progress.title}</h1>${C.drop(D.progress.filters)}</div>${C.statsCard(s.period)}${C.dots(D.progress.slides)}${C.rating()}`,
  };
  const emptyScreen = (id) => `${C.header()}${C.state('empty', `${D.nav.find((n) => n.id === id).label} is empty`, 'Nothing has been added here yet.')}`;

  // ── Behaviour ──
  function enhance(root) { // count-up, ring draw; both jump to the end under reduced motion
    root.querySelectorAll('[data-ring]').forEach((c) => requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = 188.5 * (1 - c.dataset.ring / 100); })));
    if (reduced) return;
    root.querySelectorAll('[data-count]').forEach((el) => { const to = +el.dataset.count, t0 = performance.now();
      (function tick(now) { const t = Math.min(1, (now - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(tick); })(t0); });
  }
  // Local interactions shared by the phones and the gallery. onChange(type, value) lets a phone react.
  function wire(root, onChange = () => {}) {
    const closeDrops = () => root.querySelectorAll('[data-drop][aria-expanded="true"]').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.nextElementSibling.hidden = true; });
    root.addEventListener('click', (e) => {
      const t = (sel) => e.target.closest(sel);
      let el;
      if ((el = t('[data-drop]'))) { const open = el.getAttribute('aria-expanded') === 'true'; closeDrops(); el.setAttribute('aria-expanded', String(!open)); el.nextElementSibling.hidden = open; return; }
      if ((el = t('[data-filter]'))) { const drop = el.closest('.drop'); drop.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-selected', String(b === el))); drop.querySelector('[data-drop-label]').textContent = el.textContent; closeDrops(); drop.querySelector('[data-drop]').focus(); onChange('filter', +el.dataset.filter); return; } // HOOK: filter the data
      closeDrops();
      if ((el = t('[data-go]'))) return onChange('go', el.dataset.go); // HOOK: router navigation
      if ((el = t('[data-period]'))) { el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); return onChange('period', el.dataset.period); }
      if ((el = t('[data-subject]'))) { el.parentElement.querySelectorAll('[data-subject]').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); return onChange('subject', el.textContent.trim()); } // HOOK: filter courses
      if ((el = t('[data-toggle]'))) return el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true'));
      if ((el = t('[data-slide]'))) { el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b === el))); return onChange('slide', +el.dataset.slide); } // HOOK: carousel
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrops(); });
  }
  function mountPhone(el, start) {
    const state = { screen: start, period: 'Weekly' };
    el.innerHTML = `<div class="slot"></div>${C.nav(start)}`;
    const slot = el.querySelector('.slot'), nav = el.querySelector('.nav');
    const draw = () => {
      slot.innerHTML = (SCREENS[state.screen] || (() => emptyScreen(state.screen)))(state);
      nav.style.setProperty('--i', D.nav.findIndex((n) => n.id === state.screen));
      nav.querySelectorAll('button').forEach((b) => (b.dataset.go === state.screen ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
      enhance(slot);
    };
    wire(el, (type, value) => {
      if (type === 'go' && value !== state.screen) { state.screen = value; draw(); }
      if (type === 'period') { state.period = value; const card = slot.querySelector('[data-stats]'); card.outerHTML = C.statsCard(value); enhance(slot.querySelector('[data-stats]')); }
    });
    draw();
  }

  // ── Page ──
  const tile = (title, body, cls = '') => `<div class="tile ${cls}"><h3>${title}</h3>${body}</div>`;
  const gallery = () => [
    tile('Avatar and avatar stack', `<div class="row">${avatar(person(0), 52, 'lg')}${avatar(person(1), 36)}${C.stack([0, 1, 2], 43)}</div>`),
    tile('Notification button: new, none, disabled', `<div class="row">${C.bell(true)}${C.bell(false)}${C.bell(false, true)}</div>`),
    tile('Chips: filled, tinted, plain, toggle, disabled', `<div class="row">${C.chip({ label: '12 Subjects', tone: 'dark', icon: 'book' })}${C.chip({ label: '43 Lessons', tone: 'tint', icon: 'layers' })}${C.chip({ label: 'Plain' })}${C.chip({ label: 'Toggle', pressed: true })}${C.chip({ label: 'Disabled', disabled: true })}</div>`),
    tile('Subject chips (scrolls sideways, tap to select)', `<div class="chip-row" style="margin-inline:0;padding-inline:0">${D.courses.subjects.map((s, i) => C.subject(s, i === 1)).join('')}</div>`),
    tile('Segmented toggle and dropdown pill', `<div class="row">${C.seg(['Weekly', 'Month'], 'Weekly')}${C.drop(D.progress.filters)}</div>`),
    tile('Progress ring button: 25%, 68%, 100%, light, disabled', `<div class="row">${C.ring(25)}${C.ring(68)}${C.ring(100)}<span style="background:var(--charcoal);border-radius:var(--r-pill);padding:2px" class="on-dark">${C.ring(72, { light: true })}</span>${C.ring(40, { disabled: true })}</div>`),
    tile('Stat cards with corner notch', `<div class="stats">${D.stats.map(C.stat).join('')}</div>`),
    tile('Carousel dots and rating row', `${C.dots(3, 0)}${C.rating()}`),
    tile('Hero card', C.hero()),
    tile('Stacked bar chart', `<div class="card">${C.stacked()}</div>`),
    tile('Pill bar chart in the stats card', C.statsCard('Weekly')),
    tile('Bottom navigation (indicator slides)', `<div data-nav-demo>${C.nav('home')}</div>`),
    tile('Course card: dark', C.course(D.courses.cards[0])),
    tile('Course card: tinted', C.course(D.courses.cards[1])),
    tile('Illustrations', `<div class="row">${['trophy', 'cap', 'medal', 'books', 'abacus', 'dna'].map((n) => `<span style="width:${n === 'cap' || n === 'trophy' ? 88 : 44}px">${art(n)}</span>`).join('')}</div>`),
    tile('Loading: skeletons shaped like the real cards', `<div class="stats" aria-busy="true" aria-label="Loading"><div class="sk" style="height:104px"></div><div class="sk" style="height:104px"></div></div><div class="sk" style="height:176px;border-radius:var(--r-xl)"></div>`),
    tile('Empty state', C.state('empty', 'No courses yet', 'Courses you join will appear here.')),
    tile('Error state', C.state('error', 'Could not load progress', 'Check your connection and try again.') ),
  ].join('');

  document.getElementById('backdrop').outerHTML = art('backdrop', 'backdrop-art');
  mountPhone(document.getElementById('app'), 'home');
  ['home', 'courses', 'progress'].forEach((id) => mountPhone(document.getElementById(`show-${id}`), id));
  const g = document.getElementById('gallery');
  g.innerHTML = gallery();
  wire(g, (type, value) => { if (type === 'go') { const nav = g.querySelector('[data-nav-demo] .nav'); const i = D.nav.findIndex((n) => n.id === value); if (i < 0) return; nav.style.setProperty('--i', i); nav.querySelectorAll('button').forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'))); } });
  enhance(g);
})();
