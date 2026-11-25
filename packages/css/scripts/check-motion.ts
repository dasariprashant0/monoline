// Motion and forced-colour guards for the shared stylesheets. Imported by check.ts, so `npm run check` runs it.
//  1. base.css holds the one prefers-reduced-motion rule (animation, transition, scroll-behavior), and no stylesheet
//     re-enables motion with !important (that would beat the rule, which sits in the first layer).
//  2. accents.css maps every colour token to a system colour under forced-colors, so a fill drawn with a token survives.
//  3. Reports (does not fail) literal durations in components: those belong to the --fast/--base/--slow tokens or a
//     component-scoped custom property. Components are owned elsewhere, so this is a list to work from.
import {readdirSync} from 'node:fs';
import {read} from './lib.ts';

const fails = [];
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const comps = readdirSync(new URL('../src/components/', import.meta.url))
  .filter((f) => f.endsWith('.css'))
  .map((f) => `src/components/${f}`);
const shared = ['src/base.css', 'src/tokens.css', 'src/accents.css', 'src/options.css', 'src/utilities.css'];

const base = strip(read('src/base.css'));
const rm = base.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([^{}]*\{[^{}]*\}[^{}]*)\}/);
for (const d of ['animation: none !important', 'transition: none !important', 'scroll-behavior: auto !important']) {
  if (!rm || !rm[1].includes(d)) fails.push(`base.css: the prefers-reduced-motion rule must contain "${d}"`);
}

// The global rule only covers a file if it matches every element and both pseudo-elements, and sits in base.css (the first layer).
const globalCovers = !!rm && /\*\s*,\s*\*::before\s*,\s*\*::after\s*\{/.test(rm[1]);
if (!globalCovers)
  fails.push(
    'base.css: the prefers-reduced-motion rule must select "*, *::before, *::after" so pseudo-element animations stop too',
  );
let animating = 0;
const literal = [];
for (const f of [...shared, ...comps]) {
  const css = strip(read(f));
  // Every file that animates must be covered by the global rule (checked above), or carry its own reduced-motion guard.
  const moves = [...css.matchAll(/(?:^|[\s;{])(?:animation|transition)(?:-name|-duration)?\s*:\s*([^;}]*)/g)].some(
    (m) => !/^(none|auto|0s)\b/.test(m[1].replace(/!important/, '').trim()),
  );
  if (/(^|[\s;{])(animation|transition)[a-z-]*\s*:|@keyframes/.test(css)) animating++;
  if (moves && f !== 'src/base.css' && !globalCovers && !/@media \(prefers-reduced-motion:\s*reduce\)/.test(css))
    fails.push(
      `${f}: declares animation or transition but neither base.css's reduced-motion rule nor a guard of its own covers it`,
    );
  // !important is fine when it switches motion off (value none, auto or 0s); anything else could re-enable it.
  if (
    f !== 'src/base.css' &&
    [...css.matchAll(/(?:^|[\s;{])(?:animation|transition|scroll-behavior)[a-z-]*\s*:\s*([^;}]*)!important/g)].some(
      (m) => !/^(none|auto|0s)\s*$/.test(m[1].trim()),
    )
  )
    fails.push(`${f}: !important on animation, transition or scroll-behavior would override the reduced-motion rule`);
  if (f.startsWith('src/components/')) {
    for (const m of css.matchAll(/(?:animation|transition)(?:-duration|-delay)?\s*:[^;}]*/g)) {
      const v = m[0].replace(/var\([^)]*\)/g, ''); // a var() fallback is a component knob, fine
      if (/\b\d*\.?\d+m?s\b/.test(v)) literal.push(`${f}: ${m[0].trim().slice(0, 60)}`);
    }
  }
}

const fc = strip(read('src/utilities.css')).match(/@media \(forced-colors: active\)\s*\{([^{}]*\{[^{}]*\}[^{}]*)\}/);
for (const t of [
  '--background',
  '--foreground',
  '--muted',
  '--border',
  '--rule',
  '--accent',
  '--accent-text',
  '--on-accent',
])
  if (!fc || !new RegExp(`${t}:`).test(fc[1])) fails.push(`utilities.css: the forced-colors block must set ${t}`);
if (!/forced-colors: active\)\s*\{\s*body::after\s*\{\s*display:\s*none/.test(base))
  fails.push('base.css: the film grain must be hidden under forced-colors');

if (fails.length) {
  console.error(fails.map((f) => 'FAIL motion: ' + f).join('\n'));
  process.exit(1);
}
console.log(
  `ok: reduced-motion rule intact across ${animating} animating stylesheets, none re-enables motion; forced-colors maps every colour token.`,
);
if (literal.length)
  console.log(
    `note: ${literal.length} literal durations in components (use --fast/--base/--slow or a component knob):\n  ${literal.join('\n  ')}`,
  );
