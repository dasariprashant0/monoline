// Pure extraction of the public selectors of a stylesheet: class names and data-*/aria-* attribute selectors.
// Comments and url() contents are removed first; only text before a `{` is scanned, so declaration values cannot match.
export type Styling = {file: string; classes: string[]; attributes: string[]};

const blank = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');

/** Selector text only: everything before each `{`, minus @-rule preludes' bodies (keeps @media conditions out). */
function selectorText(css: string) {
  const out: string[] = [];
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const prelude = m[1].trim();
    if (!prelude || prelude.startsWith('@')) continue;
    out.push(prelude);
  }
  return out.join(',\n');
}

/** -> {classes: ['btn', 'btn-solid'], attributes: ['[data-state="open"]', '[aria-current]']}, each sorted and unique. */
export function extractSelectors(css: string) {
  const sel = selectorText(blank(css));
  const classes = new Set<string>(),
    attributes = new Set<string>();
  for (const m of sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1]);
  // Keep the attribute exactly as written, minus quotes' normalisation; only data-* and aria-* (and role) are public API.
  for (const m of sel.matchAll(/\[\s*((?:data|aria)-[\w-]+)\s*(?:([~|^$*]?=)\s*"?([^"\]\s]*)"?\s*)?\]/g)) {
    attributes.add(m[2] ? `[${m[1]}${m[2]}"${m[3]}"]` : `[${m[1]}]`);
  }
  const sort = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return {classes: sort(classes), attributes: sort(attributes)};
}
