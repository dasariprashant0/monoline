// The token source is refused when a reference is bad, and the contrast check fails on a bad colour. One case per
// class. Fixtures are small models in the shape of packages/tokens/src/tokens.ts. A misspelt reference in the real
// source fails `tsc` before any of this runs; these cases cover what the type check cannot (cycles, duplicates across
// blocks, malformed var()) and fixtures, which are not type-checked against the real names.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {contrastChecks, sources} from '../scripts/lib.ts';
import {type Item, type Model, tokens} from '../src/tokens.ts';

type Tokens = Record<`--${string}`, string>;
type Row = [string, string, string, string];
const block = (selector: string, ...groups: Tokens[]): Item => ({selector, groups: groups.map((t) => ({tokens: t}))});
const model = (items: Item[], presets: Record<string, {warm: Row; dark: Row; midnight: Row}> = {}): Model => ({
  'tokens.css': [block('[data-theme="warm"]', {'--foreground': '#000000'}), ...items],
  'accents.css': {comment: '', presets},
  'options.css': [],
});
const parse = (...items: Item[]) => sources(model(items));
const row = (accent: string): Row => [accent, '#000000', '#000000', '#000000'];

test('missing reference: names the file, block and token', () => {
  assert.throws(
    () => parse(block(':root', {'--a': 'var(--nope)'})),
    /tokens\.css :root: --a uses undefined token --nope/,
  );
});

test('circular reference in one block', () => {
  assert.throws(
    () => parse(block(':root', {'--a': 'var(--b)', '--b': 'var(--a)'})),
    /reference cycle --a -> --b -> --a/,
  );
});

test('circular reference across layers: base, a theme and an accent', () => {
  const items = [block(':root', {'--a': 'var(--accent)', '--accent': '#000000'}), block('[data-theme="dark"]', {})];
  assert.throws(
    () => sources(model(items, {x: {warm: row('#FFFFFF'), dark: row('var(--a)'), midnight: row('#FFFFFF')}})),
    /accents\.css \[data-accent="x"\]\[data-theme="dark"\]: reference cycle --a -> --accent -> --a \(theme dark, accent x\)/,
  );
  // The same pair is fine while no layer closes the loop.
  assert.doesNotThrow(() =>
    sources(model(items, {x: {warm: row('#FFFFFF'), dark: row('#FFFFFF'), midnight: row('#FFFFFF')}})),
  );
});

test('duplicate declaration: in two groups of one block, and in two blocks of the same layer', () => {
  // The same name twice in one object literal is a tsc error (TS1117), so a duplicate can only span groups or blocks.
  assert.throws(
    () => parse(block(':root', {'--a': '#000000'}, {'--a': '#111111'})),
    /tokens\.css :root: --a is declared twice in this layer/,
  );
  assert.throws(
    () => parse(block(':root', {'--a': '#000000'}), block(':root, [data-theme]', {'--a': '#111111'})),
    /tokens\.css :root, \[data-theme\]: --a is declared twice/,
  );
  // A theme overriding a base token is the cascade, not a duplicate; so is splitting a layer over two blocks.
  assert.doesNotThrow(() =>
    parse(block(':root', {'--foreground': '#111111', '--a': '#000000'}), block(':root', {'--b': '#000000'})),
  );
});

test('invalid reference: malformed var(, a non-custom-property, a fallback', () => {
  assert.throws(
    () => parse(block(':root', {'--a': 'calc(var(--b + 1px)', '--b': '1px'})),
    /tokens\.css :root: --a: "var\(--b \+ 1px\)" is not a var\(--name\)/,
  );
  assert.throws(
    () => parse(block(':root', {'--a': 'var(color)'})),
    /--a: "var\(color\)" is not a var\(--name\) reference/,
  );
  assert.throws(
    () => parse(block(':root', {'--a': 'VAR(--nope)'})),
    /--a: "VAR\(--nope\)" is not a var\(--name\) reference/,
  );
  assert.throws(
    () => parse(block(':root', {'--a': 'var(--b, red)', '--b': 'red'})),
    /has a fallback, which would hide/,
  );
});

test('a selector list that starts with :root and holds bare attributes is the base layer; others are refused', () => {
  const src = parse(
    block(':root, [data-theme], [data-accent], [data-density]', {
      '--rule': 'color-mix(in srgb, var(--foreground) 20%, transparent)',
    }),
  );
  assert.equal(src.base['--rule'], 'color-mix(in srgb, var(--foreground) 20%, transparent)');
  assert.throws(() => parse(block('.card', {'--a': '#000000'})), /tokens\.css: unexpected selector "\.card"/);
  assert.throws(() => parse(block(':root, .card', {'--a': '#000000'})), /unexpected selector/);
  assert.throws(() => parse(block('[data-accent], :root', {'--a': '#000000'})), /unexpected selector/);
  // A theme rule is exactly [data-theme="x"] (warm: `:root, [data-theme="warm"]`); one that only contains it is refused.
  for (const selector of [
    '[data-theme="dark"] .card',
    '[data-theme="dark"][data-accent="x"]',
    '.x:hover, [data-theme="dark"]',
  ])
    assert.throws(() => parse(block(selector, {'--a': '#000000'})), /unexpected selector/, selector);
});

const util = readFileSync(join(import.meta.dirname, '../../css/src/utilities.css'), 'utf8');

test('contrast: the real tokens pass all 126 checks (3 themes x 9 accents, code colours, more contrast)', () => {
  const {count, fails} = contrastChecks(sources(), util);
  assert.deepEqual(fails, []);
  assert.equal(count, 126);
});

test('contrast: a broken theme colour, accent pair and more-contrast mix each fail', () => {
  // warm --muted and the warm green --accent-text each occur once in the model.
  const broken: Model = JSON.parse(
    JSON.stringify(tokens).replace('"#706B65"', '"#BBBBBB"').replace('"#0B6A52"', '"#45C29C"'),
  );
  const {fails} = contrastChecks(sources(broken), util.replace('var(--foreground) 85%', 'var(--foreground) 40%'));
  for (const start of [
    'warm: --muted on --background',
    'warm/green: --accent-text on --background',
    'dark more-contrast: --muted on --background',
  ])
    assert.ok(
      fails.some((f) => f.startsWith(start)),
      `${start}\n${fails.join('\n')}`,
    );
});
