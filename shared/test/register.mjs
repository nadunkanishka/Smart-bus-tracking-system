// Lets plain `node --test` import the apps' source: `node --import ./shared/test/register.mjs --test ...`.
import { register } from 'node:module';

register('./hooks.mjs', import.meta.url);
