// PROTOTYPE check (ADR 0014): the DTCG source in prototype/ generates CSS with the same tokens, selectors and rules as
// packages/css/src. Not byte-identical; the test prints what differs (comments, alignment, order).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {buildTokens, cssBlocks, parseSources} from '../scripts/lib.ts';
import {toCss} from '../prototype/to-css.ts';

const read = (p: string) => readFileSync(join(import.meta.dirname, p), 'utf8');
const FILES = ['tokens.css', 'accents.css', 'options.css'] as const;
const real = Object.fromEntries(FILES.map((f) => [f, read(`../../css/src/${f}`)]));
const gen = toCss(JSON.parse(read('../prototype/monoline.tokens.json')));

const one = (s: string) => s.replace(/\s+/g, ' ').trim();
// Every declaration, custom property or not, as "selector | prop: value", sorted.
const allDecls = (css: string) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .flatMap(([, sel, body]) =>
      [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, p, v]) => `${one(sel)} | ${p}: ${one(v)}`),
    )
    .sort();

test('prototype: generated CSS declares the same tokens in the same blocks, and the same other rules', (t) => {
  for (const f of FILES) {
    const blocks = (css: string) => cssBlocks(css).map((b) => [b.selector, Object.fromEntries(b.decls)]);
    assert.deepEqual(blocks(gen[f]!), blocks(real[f]!), `${f}: token blocks`);
    assert.deepEqual(allDecls(gen[f]!), allDecls(real[f]!), `${f}: every declaration`);

    const [a, b] = [real[f]!.split('\n'), gen[f]!.split('\n')];
    const order = (css: string) => cssBlocks(css).flatMap((x) => x.decls.map(([n]) => n));
    const moved = order(gen[f]!).filter((n, i) => order(real[f]!)[i] !== n).length;
    const comments = (css: string) => (css.match(/\/\*/g) ?? []).length;
    t.diagnostic(
      `${f}: byte-identical ${gen[f] === real[f]}; ${a.length} lines real, ${b.length} generated, ` +
        `${b.filter((l) => a.includes(l)).length} generated lines verbatim in the real file; ` +
        `comments ${comments(real[f]!)} -> ${comments(gen[f]!)}; ${moved} of ${order(real[f]!).length} tokens in another position`,
    );
  }
});

test('prototype: the generated CSS passes the same parser and validation, and builds the same tokens.json', () => {
  const parse = (css: Record<string, string>) =>
    parseSources({tokens: css['tokens.css']!, accents: css['accents.css']!, options: css['options.css']!});
  assert.equal(JSON.stringify(buildTokens(parse(gen))), JSON.stringify(buildTokens(parse(real))));
});
