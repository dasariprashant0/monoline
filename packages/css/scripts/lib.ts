// Shared by build.ts and check.ts: read the CSS files into plain objects.
import {readFileSync} from 'node:fs';

type Vars = Record<string, string>;

export const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

function blocks(css: string) {
  const out: {sel: string; vars: Vars}[] = [];
  // any: replace() is used as a match iterator and its callbacks return nothing
  strip(css).replace(/([^{}]+)\{([^{}]*)\}/g, (_, sel: string, body: string): any => {
    const vars: Vars = {};
    body.replace(/(--[\w-]+)\s*:\s*([^;]+);/g, (__, k: string, v: string): any => {
      vars[k] = v.trim();
    });
    out.push({sel: sel.trim(), vars});
  });
  return out;
}

/** {base, themes: {warm, dark, midnight}, accents: {orange: {warm, dark, midnight}, ...}} */
export function parseTokens() {
  const themes: Record<string, Vars> = {},
    base: Vars = {},
    accents: Record<string, Record<string, Vars>> = {};
  for (const {sel, vars} of blocks(read('src/tokens.css'))) {
    const t = sel.match(/\[data-theme="(\w+)"\]/);
    if (t) themes[t[1]] = {...(themes[t[1]] || {}), ...vars};
    else if (sel.split(',')[0]?.trim() === ':root') Object.assign(base, vars); // also ':root, [data-theme], ...' (ADR 0012)
  }
  for (const {sel, vars} of blocks(read('src/accents.css'))) {
    const a = sel.match(/^\[data-accent="(\w+)"\](?:\[data-theme="(\w+)"\])?$/);
    if (!a) continue;
    (accents[a[1]] ||= {})[a[2] || 'warm'] = vars;
  }
  return {base, themes, accents};
}

export const isColor = (v: string) => /^(#|rgba?\()/.test(v);

const lum = (hex: string) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
