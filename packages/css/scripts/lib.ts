// Shared by the build and check scripts. Token parsing, validation and contrast maths live in one place:
// packages/tokens/scripts/lib.ts (parseSources, resolve, contrastChecks).
import {readFileSync} from 'node:fs';
import {parseSources} from '../../tokens/scripts/lib.ts';

export const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** The token sources parsed and validated: {base, themes, accents, options}. Throws on a bad reference. */
export const parseTokens = () =>
  parseSources({tokens: read('src/tokens.css'), accents: read('src/accents.css'), options: read('src/options.css')});
