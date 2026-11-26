// Prototype of the check ADR 0015 proposes for Monoline: every value of a variant union has a selector in the plain
// stylesheet, either a modifier class (.btn-solid) or an attribute (.alert[data-tone="ok"]). Reads the unions from
// src/kit.tsx with a regex. Usage: node scripts/variant-check.ts [stylesheet], default src/plain/styles.css. Exits 1
// and lists what is missing. A default value may have no rule of its own: the base class styles it.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const at = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const kit = readFileSync(at('../src/kit.tsx'), 'utf8');
const css = readFileSync(process.argv[2] ?? at('../src/plain/styles.css'), 'utf8');

// type → the prop it feeds, the component's base class, and the default value.
const unions = [
  {type: 'Variant', prop: 'variant', block: 'btn', fallback: 'solid'},
  {type: 'Size', prop: 'size', block: 'btn', fallback: 'md'},
  {type: 'Tone', prop: 'tone', block: 'alert', fallback: 'info'},
];

const missing: string[] = [];
for (const {type, prop, block, fallback} of unions) {
  const union = kit.match(new RegExp(`export type ${type} = ([^;]+);`))?.[1];
  if (!union) throw new Error(`type ${type} not found in src/kit.tsx`);
  for (const value of [...union.matchAll(/'([^']+)'/g)].map((m) => m[1]!)) {
    const cls = new RegExp(`\\.${block}-${value}(?![\\w-])`);
    const attr = new RegExp(`\\.${block}\\[data-${prop}="${value}"\\]`);
    if (!cls.test(css) && !attr.test(css) && value !== fallback)
      missing.push(`${prop}="${value}": no .${block}-${value} or .${block}[data-${prop}="${value}"]`);
  }
}
for (const m of missing) console.log(`missing  ${m}`);
console.log(missing.length ? `${missing.length} variant value(s) without a rule` : 'every variant value has a rule');
process.exit(missing.length ? 1 : 0);
