// The one token parser refuses bad sources, and the contrast check fails on a bad colour. One case per class.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {contrastChecks, parseSources} from '../scripts/lib.ts';

const parse = (tokens: string, accents = '', options = '') => parseSources({tokens, accents, options});
const BASE = '[data-theme="warm"] { --foreground: #000000; }\n';

test('missing reference: names the file, block and token', () => {
  assert.throws(
    () => parse(`${BASE}:root { --a: var(--nope); }`),
    /tokens\.css :root: --a uses undefined token --nope/,
  );
});

test('circular reference in one block', () => {
  assert.throws(() => parse(`${BASE}:root { --a: var(--b); --b: var(--a); }`), /reference cycle --a -> --b -> --a/);
});

test('circular reference across layers: base, a theme and an accent', () => {
  const tokens = `${BASE}:root { --a: var(--b); --b: #000000; }\n[data-theme="dark"] { --c: #000000; }`;
  const accents = '[data-accent="x"][data-theme="dark"] { --b: var(--a); }';
  assert.throws(
    () => parse(tokens, accents),
    /accents\.css \[data-accent="x"\]\[data-theme="dark"\]: reference cycle --a -> --b -> --a \(theme dark, accent x\)/,
  );
  // The same pair is fine while no layer closes the loop.
  assert.doesNotThrow(() => parse(tokens, '[data-accent="x"] { --b: #FFFFFF; }'));
});

test('duplicate declaration: within one block, and in two blocks with the same scope', () => {
  assert.throws(() => parse(`${BASE}:root { --a: #000000; --a: #111111; }`), /--a is declared twice in this layer/);
  assert.throws(() => parse(`${BASE}:root { --a: #000000; }\n:root { --a: #111111; }`), /--a is declared twice/);
  assert.throws(
    () => parse(BASE, '[data-accent="x"] { --a: #000000; }\n[data-accent="x"] { --a: #111111; }'),
    /accents\.css \[data-accent="x"\]: --a is declared twice/,
  );
  // A theme overriding a base token is the cascade, not a duplicate; so is splitting a layer over two blocks.
  assert.doesNotThrow(() => parse(`${BASE}:root { --foreground: #111111; --a: #000000; }\n:root { --b: #000000; }`));
});

test('invalid reference: malformed var(, a non-custom-property, a fallback', () => {
  assert.throws(
    () => parse(`${BASE}:root { --a: calc(var(--b ; --b: 1px; }`),
    /tokens\.css :root: --a: "var\(--b" is not a var\(--name\)/,
  );
  assert.throws(
    () => parse(`${BASE}:root { --a: var(color); }`),
    /--a: "var\(color\)" is not a var\(--name\) reference/,
  );
  assert.throws(() => parse(`${BASE}:root { --a: var(--b, red); --b: red; }`), /has a fallback, which would hide/);
});

test('a selector list with :root and bare attributes is the base layer; other selectors are refused', () => {
  const src = parse(
    `${BASE}:root, [data-theme], [data-accent], [data-density] {\n  --rule: color-mix(in srgb, var(--foreground) 20%, transparent);\n}`,
  );
  assert.equal(src.base['--rule'], 'color-mix(in srgb, var(--foreground) 20%, transparent)');
  assert.throws(() => parse(`${BASE}.card { --a: #000000; }`), /tokens\.css: unexpected selector "\.card"/);
  assert.throws(() => parse(`${BASE}:root, .card { --a: #000000; }`), /unexpected selector/);
});

const read = (p: string) => readFileSync(join(import.meta.dirname, '../../css/src', p), 'utf8');
const real = {tokens: read('tokens.css'), accents: read('accents.css'), options: read('options.css')};

test('contrast: the real tokens pass all 126 checks (3 themes x 9 accents, code colours, more contrast)', () => {
  const {count, fails} = contrastChecks(parseSources(real), read('utilities.css'));
  assert.deepEqual(fails, []);
  assert.equal(count, 126);
});

test('contrast: a broken theme colour, accent pair and more-contrast mix each fail', () => {
  const tokens = real.tokens.replace('--muted:        #706B65', '--muted:        #BBBBBB');
  const accents = real.accents.replace('--accent-text: #0B6A52', '--accent-text: #45C29C');
  const util = read('utilities.css').replace('var(--foreground) 85%', 'var(--foreground) 40%');
  const {fails} = contrastChecks(parseSources({...real, tokens, accents}), util);
  assert.ok(
    fails.some((f) => f.startsWith('warm: --muted on --background')),
    fails.join('\n'),
  );
  assert.ok(
    fails.some((f) => f.startsWith('warm/green: --accent-text on --background')),
    fails.join('\n'),
  );
  assert.ok(
    fails.some((f) => f.startsWith('dark more-contrast: --muted on --background')),
    fails.join('\n'),
  );
});
