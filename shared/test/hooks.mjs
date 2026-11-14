// Module hooks for the app tests (Node 22+). The app source is written for Metro, so for Node it needs:
// - extensionless relative imports ('../shared/contract') resolved to the .js file,
// - 'react-native' replaced by a small stub (only Platform is used by the code under test),
// - .js files read as ES modules (the app folders have no "type": "module"),
// - shared/native/* files importing a sibling that only exists after sync ('./contract') resolved to shared/.
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const stubs = new URL('./stubs/', import.meta.url);

export async function resolve(specifier, context, next) {
  if (specifier === 'react-native') return { url: new URL('react-native.mjs', stubs).href, format: 'module', shortCircuit: true };
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const from = dirname(fileURLToPath(context.parentURL));
    const candidates = [join(from, specifier), join(from, `${specifier}.js`), join(from, '..', `${specifier}.js`)];
    const hit = candidates.find((p) => /\.m?js$/.test(p) && existsSync(p) && statSync(p).isFile());
    if (hit) return { url: pathToFileURL(hit).href, format: 'module', shortCircuit: true };
  }
  return next(specifier, context);
}
