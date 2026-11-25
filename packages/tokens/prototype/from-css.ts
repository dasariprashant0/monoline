// PROTOTYPE (ADR 0014), not part of `npm run tokens`. Converts packages/css/src/{tokens,accents,options}.css once into
// monoline.tokens.json, the DTCG source that to-css.ts turns back into the three CSS files. This is the migration step
// a switch to "DTCG JSON as source" would take; rerun it only to re-sync the prototype after the CSS changes.
// Run: node packages/tokens/prototype/from-css.ts
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {classify, typeOf} from '../scripts/lib.ts';

type Token = {$value: string; $type?: string; $description?: string};
type Layer = Record<string, unknown> & {$description?: string};

const here = import.meta.dirname;
const one = (s: string) => s.replace(/\s+/g, ' ').trim();
// var(--foreground) -> {color.foreground}: a DTCG alias, also inside color-mix() and calc().
const alias = (v: string) =>
  v.replace(/var\((--[\w-]+)\)/g, (_, n: string) => {
    const {group, leaf} = classify(n);
    return `{${group}.${leaf}}`;
  });
const layerName = (selector: string) =>
  [...selector.matchAll(/\[data-(\w+)="([\w-]+)"\]/g)].map(([, k, v]) => (k === 'theme' ? v : `${k}-${v}`)).join('-') ||
  'base';

const doc: Record<string, unknown> = {
  $description:
    'PROTOTYPE (docs/decisions/0014-token-source-of-truth.md). Monoline tokens as DTCG JSON. Each top-level group is one CSS block (a token set); aliases such as {color.foreground} resolve within the merged sets for a theme and accent, not as absolute paths. Generate the CSS with to-css.ts. Not used by the build.',
};
const headers: Record<string, string> = {};
const rules: Record<string, string[]> = {};
for (const file of ['tokens.css', 'accents.css', 'options.css']) {
  const css = readFileSync(join(here, '../../css/src', file), 'utf8');
  for (const [, prelude, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const comments = [...prelude.matchAll(/\/\*([\s\S]*?)\*\//g)].map((m) => one(m[1]));
    if (!(file in headers)) headers[file] = comments.shift() ?? '';
    const selector = one(prelude.replace(/\/\*[\s\S]*?\*\//g, ''));
    if (!/--[\w-]+\s*:/.test(body)) {
      // A rule with no tokens (options.css: `[data-font="sans"] .display {...}`) stays CSS, kept verbatim.
      (rules[file] ??= []).push(...comments.map((c) => `/* ${c} */`), `${selector} { ${one(body)} }`);
      continue;
    }
    const layer: Layer = {};
    const extra: Record<string, string> = {};
    let key = layerName(selector);
    while (key in doc) key += '+';
    let last: Token | null = null;
    let pending: string[] = [];
    let end = 0;
    for (const m of body.matchAll(/\/\*([\s\S]*?)\*\/|([\w-]+)\s*:\s*([^;]+);/g)) {
      if (m[1] !== undefined) {
        // A comment on the declaration's own line describes it; one on its own line describes what follows.
        if (last && !body.slice(end, m.index).includes('\n'))
          last.$description = [last.$description, one(m[1])].filter(Boolean).join(' ');
        else pending.push(one(m[1]));
      } else if (m[2].startsWith('--')) {
        const {group, leaf} = classify(m[2]);
        const value = m[3].trim();
        last = {$value: alias(value), ...typeOf(group, value)};
        if (pending.length) last.$description = pending.join(' ');
        pending = [];
        ((layer[group] ??= {}) as Record<string, Token>)[leaf] = last;
      } else extra[m[2]] = m[3].trim(); // color-scheme
      end = (m.index ?? 0) + m[0].length;
    }
    const description = [...comments, ...pending].join(' ');
    doc[key] = {
      ...(description ? {$description: description} : {}),
      $extensions: {monoline: {file, selector, ...(Object.keys(extra).length ? {css: extra} : {})}},
      ...layer,
    };
  }
}
doc.$extensions = {monoline: {headers, rules}};
writeFileSync(join(here, 'monoline.tokens.json'), JSON.stringify(doc, null, 2) + '\n');
console.log(`prototype: wrote monoline.tokens.json (${Object.keys(doc).length - 2} sets)`);
