// Rules of the shared mobile kit that a reviewer would otherwise have to remember.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../native/ui.js', import.meta.url), 'utf8');

test('every component ui.js exports is declared through themed(), so it re-renders on a light/dark switch', () => {
  assert.deepEqual([...ui.matchAll(/^export (?:async )?function (\w+)/gm)].map((m) => m[1]), []);
  const components = [...ui.matchAll(/^export const ([A-Z]\w*) = (\w+)\(/gm)];
  assert.ok(components.length > 20);
  for (const [, name, how] of components) assert.equal(how, 'themed', `${name} is not declared through themed()`);
});

test('the kit carries no app-specific defaults', () => {
  assert.doesNotMatch(ui, /brand = '/);
  assert.doesNotMatch(ui, /app\.json/);
});

test('the ease-out curve is written once, in tokens.js', () => {
  for (const file of ['../native/ui.js', '../native/LiveMap.js', '../sync.js']) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), 'utf8'), /0\.23, ?1, ?0\.32, ?1|\.23,1,\.32,1/, file);
  }
});
