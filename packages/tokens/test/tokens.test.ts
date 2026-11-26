import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {
  buildTokens,
  classify,
  cssBlocks,
  figmaVariables,
  flatten,
  nativeTokens,
  parseSources,
  tokensCss,
  typesDts,
} from '../scripts/lib.ts';
import type {TokensJson} from '../scripts/lib.ts';

const here = import.meta.dirname;
const read = (p: string) => readFileSync(join(here, p), 'utf8');
const sources = {
  tokens: read('../../css/src/tokens.css'),
  accents: read('../../css/src/accents.css'),
  options: read('../../css/src/options.css'),
};
const src = parseSources(sources);
const json: TokensJson = JSON.parse(read('../dist/tokens.json'));
const THEMES = ['warm', 'dark', 'midnight'];

// The token stored for a CSS custom property in one scope: base, theme.<t>, accent.<a>.<t>, option.<kind>.<value>.
const valueAt = (scope: string[], name: string) => {
  const {group, leaf} = classify(name);
  // any: walks a path of any depth through tokens.json
  return scope.reduce((tree: any, key) => tree?.[key], json)?.[group]?.[leaf]?.$value;
};

test('every custom property in tokens.css is in tokens.json, with the same value', () => {
  for (const {selector, decls} of cssBlocks(sources.tokens)) {
    const theme = selector.match(/data-theme="(\w+)"/)?.[1] ?? 'warm';
    const scope = selector.includes(':root') && !selector.includes('data-theme="') ? ['base'] : ['theme', theme];
    for (const [name, value] of decls) {
      assert.equal(valueAt(scope, name), value, `${selector} ${name}`);
    }
  }
});

test('accent presets round-trip: generic rule is the warm look, theme rules override it', () => {
  const accentBlocks = cssBlocks(sources.accents);
  assert.equal(Object.keys(json.accent).length, Object.keys(src.accents).length);
  for (const {selector, decls} of accentBlocks) {
    const name = selector.match(/data-accent="([\w-]+)"/)![1];
    const theme = selector.match(/data-theme="(\w+)"/)?.[1] ?? 'warm';
    for (const [prop, value] of decls)
      assert.equal(valueAt(['accent', name, theme], prop), value, `${selector} ${prop}`);
  }
});

test('option presets (font, radius, density) round-trip', () => {
  for (const {selector, decls} of cssBlocks(sources.options)) {
    const m = selector.match(/^\[data-(\w+)="([\w-]+)"\]$/);
    if (!m) continue;
    for (const [prop, value] of decls)
      assert.equal(valueAt(['option', m[1], m[2]], prop), value, `${selector} ${prop}`);
  }
});

test('themes are warm, dark and midnight; there are eight accents and three densities', () => {
  assert.deepEqual(Object.keys(json.theme), THEMES);
  assert.equal(Object.keys(json.accent).length, 8);
  assert.deepEqual(Object.keys(json.option.density).sort(), ['compact', 'spacious']);
});

test('tokens.css re-export parses back to the same values as tokens.json', () => {
  const css = cssBlocks(tokensCss(json));
  const base = css.find((b) => b.selector === ':root');
  assert.deepEqual(Object.fromEntries(base!.decls), Object.fromEntries(flatten(json.base)));
  const dark = css.find((b) => b.selector === '[data-theme="dark"]');
  assert.deepEqual(Object.fromEntries(dark!.decls), Object.fromEntries(flatten(json.theme.dark)));
  const options = Object.values(json.option).reduce((n, values) => n + Object.keys(values).length, 0);
  assert.equal(css.length, 1 + THEMES.length + Object.keys(json.accent).length * THEMES.length + options);
});

test('tokens.css in dist is the same re-export that the build writes', () => {
  assert.equal(read('../dist/tokens.css').trim(), tokensCss(json).trim());
});

test('figma variables: four collections, colours per theme and accent, values as the browser computes them', () => {
  const fig = figmaVariables(src);
  assert.deepEqual(
    fig.collections.map((c) => c.name),
    ['Colors', 'Spacing', 'Radius', 'Typography'],
  );
  const colors = fig.collections[0];
  assert.equal(colors.modes.length, 3 * 8);
  for (const v of colors.variables) {
    assert.equal(v.resolvedType, 'COLOR');
    assert.deepEqual(Object.keys(v.valuesByMode).sort(), [...colors.modes].sort(), v.name);
    for (const c of Object.values(v.valuesByMode))
      for (const k of ['r', 'g', 'b', 'a'] as const) assert.ok(c[k] >= 0 && c[k] <= 1, `${v.name} ${k}`);
  }
  const ink2 = colors.variables.find((v) => v.name === 'color/ink-2')!.valuesByMode['warm / orange'];
  assert.deepEqual([ink2.r.toFixed(3), ink2.g.toFixed(3), ink2.b.toFixed(3), ink2.a], ['0.086', '0.071', '0.055', 0.7]);
  const accentMidnightGreen = colors.variables.find((v) => v.name === 'color/accent')!.valuesByMode['midnight / green'];
  assert.equal(Math.round(accentMidnightGreen.g * 255), 0xd6);
});

test('figma spacing, radius and typography: px become numbers, calc is evaluated, clamp stays a string', () => {
  const fig = figmaVariables(src);
  const [, spacing, radius, typography] = fig.collections;
  assert.equal(spacing.variables.find((v) => v.name === 'control/sm')!.valuesByMode.comfortable, 36);
  assert.equal(spacing.variables.find((v) => v.name === 'space/s2')!.valuesByMode.compact, 6);
  assert.deepEqual(radius.variables.find((v) => v.name === 'radius/radius')!.valuesByMode, {
    square: 0,
    soft: 6,
    round: 12,
  });
  assert.equal(typography.modes.length, 9);
  assert.equal(typography.variables.find((v) => v.name === 'type/text-base')!.valuesByMode['mono / compact'], 14);
  assert.equal(typography.variables.find((v) => v.name === 'type/display-md')!.resolvedType, 'STRING');
  assert.ok(fig.$skipped.includes('--z-drawer') && fig.$skipped.includes('--hatch'));
});

test('typescript types list the token names and themes', () => {
  const dts = read('../dist/tokens.d.ts');
  assert.match(dts, /export type Theme = "warm" \| "dark" \| "midnight";/);
  const colorToken = dts.match(/export type ColorToken = (.*);/)![1];
  for (const name of ['background', 'ink-1', 'code-keyword']) assert.ok(colorToken.includes(`"${name}"`), name);
  assert.match(dts, /export type CssVariable = .*"--control-sm"/);
  assert.equal(typesDts(json), dts);
});

test('a missing reference fails the build instead of writing a wrong value', () => {
  const broken = {...sources, tokens: sources.tokens.replace('--ink-1:', '--ink-1: var(--nope);\n  --x:')};
  assert.throws(() => figmaVariables(parseSources(broken)), /undefined token --nope/);
});

test('a selector list that starts with :root (scoped derived tokens, ADR 0012) is base; any other list fails', () => {
  assert.equal(src.base['--rule'], 'color-mix(in srgb, var(--foreground) 20%, transparent)');
  assert.equal(src.base['--focus-ring'], '2px solid var(--accent)');
  assert.equal(src.base['--control-md'], 'var(--s7)');
  const extra = (css: string) => ({...sources, tokens: `${sources.tokens}\n${css}`});
  assert.throws(() => parseSources(extra('[data-accent], :root { --x: 1; }')), /unexpected selector/);
});

test('build output matches a fresh build of the sources (dist is not stale)', () => {
  assert.equal(read('../dist/tokens.json'), JSON.stringify(buildTokens(src), null, 2) + '\n');
});

test('react native: colours per theme x accent resolved, lengths and calc as numbers, ms, bezier; the rest listed', () => {
  const text = read('../dist/native.json');
  assert.equal(text, JSON.stringify(nativeTokens(src), null, 2) + '\n');
  const native = JSON.parse(text);
  assert.deepEqual(Object.keys(native.colors), THEMES);
  for (const t of THEMES) {
    assert.deepEqual(Object.keys(native.colors[t]), Object.keys(json.accent));
    for (const colours of Object.values<Record<string, string>>(native.colors[t]))
      for (const [n, c] of Object.entries(colours))
        assert.match(c, /^#[0-9A-F]{6}$|^rgba\(\d+, \d+, \d+, [\d.]+\)$/, n);
  }
  assert.equal(native.colors.warm.orange['ink-2'], 'rgba(22, 18, 14, 0.7)');
  assert.equal(native.colors.midnight.green.accent, '#5FD6B2');
  assert.equal(native.colors.dark.blue['surface-text'], 'rgba(240, 237, 231, 0.85)');
  assert.equal(native.values['control-sm'], 36);
  assert.equal(native.values['radius-lg'], 0);
  assert.equal(native.values.fast, 120);
  assert.deepEqual(native.values.ease, [0.76, 0, 0.24, 1]);
  for (const n of ['--hatch', '--heading-1', '--font-body', '--measure', '--focus-ring', '--shadow-toast'])
    assert.ok(native.$omitted.includes(n), n);
  // Every token is either exported or listed as omitted.
  const exported = new Set(
    [...Object.keys(native.colors.warm.orange), ...Object.keys(native.values)].map((n) => `--${n}`),
  );
  for (const n of Object.keys({...src.base, ...src.themes.warm}))
    assert.ok(exported.has(n) !== native.$omitted.includes(n), n);
});
