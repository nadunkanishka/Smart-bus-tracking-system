import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, cubicBezier, stagger, utils } from 'animejs';

// Motion for the admin dashboard, built on anime.js. The rules it follows:
//  - Only things people see once per visit move (the page arriving, a chart growing, numbers counting). Switching pages
//    and everyday clicks stay instant, and press feedback is plain CSS.
//  - Only transform and opacity move, so nothing re-lays-out: the one-screen dashboard cannot jump.
//  - A strong ease-out (starts fast, settles slowly) and under 800 ms.
//  - With "reduce motion" on, nothing moves: the final state is simply shown.

export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

// If the browser throttles animation frames (a background tab, a busy machine), jump to the end state instead of leaving
// things half faded in.
const SAFETY_MS = 2600;

export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The page arrives: cards rise and fade in one after another, then the rows inside them.
export function useEntrance(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;
    const panels = root.querySelectorAll('.panel');
    const inner = root.querySelectorAll('.row, .mini-card, .card-action, .legend li, .pills');
    utils.set([...panels, ...inner], { opacity: 0 });
    const first = animate(panels, { opacity: [0, 1], translateY: [14, 0], duration: 520, delay: stagger(70), ease: EASE_OUT });
    const second = animate(inner, { opacity: [0, 1], translateY: [8, 0], duration: 420, delay: stagger(35, { start: 260 }), ease: EASE_OUT });
    const safety = setTimeout(() => { first.complete(); second.complete(); }, SAFETY_MS);
    return () => { clearTimeout(safety); first.revert(); second.revert(); };
  }, [rootRef]);
}

// Bars grow up from the baseline once, when the chart first has data. scaleY keeps the layout still.
export function useGrowBars(rootRef, count) {
  const done = useRef(false);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !count || done.current || prefersReducedMotion()) return undefined;
    done.current = true;
    const bars = root.querySelectorAll('.bar');
    const run = animate(bars, { scaleY: [0.04, 1], duration: 720, delay: stagger(55, { start: 240 }), ease: EASE_OUT });
    const safety = setTimeout(() => run.complete(), SAFETY_MS);
    return () => { clearTimeout(safety); run.revert(); };
  }, [rootRef, count]);
}

// A ring (conic gradient) that sweeps round to its shares the first time, then follows the data. `key` changes when the data does.
export function useSweep(ref, ringAt, key) {
  const swept = useRef(false);
  const latest = useRef(ringAt);
  latest.current = ringAt;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (swept.current || prefersReducedMotion()) { el.style.background = latest.current(1); return undefined; }
    swept.current = true;
    el.style.background = latest.current(0);
    const state = { p: 0 };
    const run = animate(state, { p: 1, duration: 900, delay: 320, ease: EASE_OUT, onUpdate: () => { el.style.background = latest.current(state.p); } });
    const safety = setTimeout(() => { run.complete(); el.style.background = latest.current(1); }, SAFETY_MS);
    return () => { clearTimeout(safety); run.pause(); };
  }, [ref, key]);
}

// A number that counts up to its value (and from the old value to a new one). Text like "12 ms" counts the 12 and keeps " ms".
export function CountUp({ value, className, duration = 800 }) {
  const el = useRef(null);
  const from = useRef(0);
  const match = String(value ?? '').match(/^(-?\d+(?:\.\d+)?)([\s\S]*)$/);
  const to = match ? Number(match[1]) : null;
  const tail = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? match[1].split('.')[1].length : 0;
  const reduced = prefersReducedMotion();

  // React renders the text once and never touches it again: the effect below owns the number from then on, so a re-render
  // in the middle of a count cannot make it jump to the end.
  const first = useRef(null);
  if (first.current === null) first.current = to != null && !reduced ? `${(0).toFixed(decimals)}${tail}` : String(value ?? '');

  useEffect(() => {
    if (!el.current) return undefined;
    if (to == null || reduced) { el.current.textContent = String(value ?? ''); from.current = to ?? 0; return undefined; }
    const state = { v: from.current };
    const run = animate(state, {
      v: to,
      duration,
      ease: EASE_OUT,
      onUpdate: () => { if (el.current) el.current.textContent = `${state.v.toFixed(decimals)}${tail}`; },
    });
    from.current = to;
    return () => run.pause();
  }, [value, to, tail, decimals, duration, reduced]);

  return <span ref={el} className={className}>{first.current}</span>;
}
