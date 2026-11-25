// Turns Monoline's CSS token sources into design-tool files. No dependencies.
// Input: packages/css/src/{tokens,accents,options}.css. Output: see build.ts.

type Decls = Record<string, string>;
type Sources = {
  base: Decls;
  themes: Record<string, Decls>;
  accents: Record<string, Record<string, Decls>>;
  options: Record<string, Record<string, Decls>>;
};
type Tree = Record<string, Record<string, {$value: string; $type?: string}>>;
export type TokensJson = ReturnType<typeof buildTokens>;
type Rgba = {r: number; g: number; b: number; a: number};
type Collection<V> = {
  name: string;
  modes: string[];
  variables: {name: string; resolvedType: string; valuesByMode: Record<string, V>}[];
};
type Scalar = number | string | null;

export const THEMES = ['warm', 'dark', 'midnight'];
const ACCENT_VARS = ['--accent', '--accent-text', '--accent-2', '--on-accent'];

// Every `selector { --custom: value; }` block, in source order. Only custom properties are kept.
export function cssBlocks(css: string) {
  const out: {selector: string; decls: [string, string][]}[] = [];
  for (const [, selector, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]): [string, string] => [
      name,
      value.trim(),
    ]);
    if (decls.length) out.push({selector: selector.trim().replace(/\s+/g, ' '), decls});
  }
  return out;
}

const attrs = (selector: string) =>
  Object.fromEntries([...selector.matchAll(/\[data-(\w+)="([\w-]+)"\]/g)].map(([, k, v]) => [k, v]));

// A selector list that holds :root and otherwise only bare attributes, e.g. `:root, [data-theme], [data-accent]`:
// tokens declared there are re-declared on every themed element, so they belong to the base layer.
const isBase = (selector: string) => {
  const parts = selector.split(',').map((s) => s.trim());
  return parts.includes(':root') && parts.every((p) => p === ':root' || /^\[data-[\w-]+\]$/.test(p));
};

// Every var( must be a plain var(--name). A fallback is refused: the token set is closed, so a fallback is either
// dead or hides a missing token that the build should report.
function checkRefs(where: string, name: string, value: string) {
  for (const {index} of value.matchAll(/var\(/g)) {
    const at = value.slice(index);
    if (/^var\(--[\w-]+\)/.test(at)) continue;
    const why = /^var\(\s*--[\w-]+\s*,/.test(at)
      ? 'has a fallback, which would hide a missing token; reference the token alone'
      : 'is not a var(--name) reference';
    throw new Error(`${where}: ${name}: "${at.slice(0, 40)}" ${why}`);
  }
}

// Adds a block's declarations to one layer. The same token twice in one layer (one block, or two blocks with the
// same scope) is an error: the later one wins silently.
function addDecls(layer: Decls, decls: [string, string][], where: string) {
  for (const [name, value] of decls) {
    if (name in layer) throw new Error(`${where}: ${name} is declared twice in this layer; keep one`);
    checkRefs(where, name, value);
    layer[name] = value;
  }
}

// Sorts the CSS into {base, themes, accents, options} and validates it (see validate). accents[name] has `generic`
// (the bare [data-accent] rule, which is the warm look) plus one object per theme that overrides it.
export function parseSources({tokens, accents, options}: {tokens: string; accents: string; options: string}) {
  const src: Sources = {base: {}, themes: {}, accents: {}, options: {}};
  for (const {selector, decls} of cssBlocks(tokens)) {
    const theme = attrs(selector).theme;
    const where = `tokens.css ${selector}`;
    if (theme) addDecls((src.themes[theme] ??= {}), decls, where);
    else if (isBase(selector)) addDecls(src.base, decls, where);
    else throw new Error(`tokens.css: unexpected selector "${selector}"`);
  }
  for (const {selector, decls} of cssBlocks(accents)) {
    const {accent, theme = 'generic'} = attrs(selector);
    if (!accent) throw new Error(`accents.css: no data-accent in "${selector}"`);
    addDecls(((src.accents[accent] ??= {})[theme] ??= {}), decls, `accents.css ${selector}`);
  }
  for (const {selector, decls} of cssBlocks(options)) {
    const m = selector.match(/^\[data-(\w+)="([\w-]+)"\]$/); // descendant rules hold no custom properties
    if (m) addDecls(((src.options[m[1]] ??= {})[m[2]] ??= {}), decls, `options.css ${selector}`);
  }
  validate(src);
  return src;
}

// The layers that apply for a theme, an accent ('' for none) and option values, in cascade order, with where each
// comes from.
function layers(src: Sources, theme: string, accent = '', opts: [string, string][] = []): [string, Decls][] {
  const a = src.accents[accent] ?? {};
  const all: [string, Decls | undefined][] = [
    ['tokens.css :root', src.base],
    [`tokens.css [data-theme="${theme}"]`, src.themes[theme]],
    [`accents.css [data-accent="${accent}"]`, a.generic],
    [`accents.css [data-accent="${accent}"][data-theme="${theme}"]`, a[theme]],
    ...opts.map(([k, v]): [string, Decls | undefined] => [`options.css [data-${k}="${v}"]`, src.options[k]?.[v]]),
  ];
  return all.filter((l): l is [string, Decls] => !!l[1]);
}
const merge = (ls: [string, Decls][]): Decls => Object.assign({}, ...ls.map(([, d]) => d));

// Custom properties in effect for a theme and accent, the way the cascade applies them.
export const themeEnv = (src: Sources, theme: string, accent: string) => merge(layers(src, theme, accent));

// Resolves every token in every combination of theme, accent (or none) and option values, so a missing reference
// or a cycle fails the build with the file and token that hold it. 3 themes x 9 accents x 27 option sets today.
function validate(src: Sources) {
  const optionSets = Object.entries(src.options).reduce<[string, string][][]>(
    (sets, [kind, values]) =>
      sets.flatMap((s) => [s, ...Object.keys(values).map((v) => [...s, [kind, v] as [string, string]])]),
    [[]],
  );
  const themes = Object.keys(src.themes);
  for (const theme of themes.length ? themes : [''])
    for (const accent of ['', ...Object.keys(src.accents)])
      for (const opts of optionSets) {
        const ls = layers(src, theme, accent, opts);
        const env = merge(ls);
        for (const name of Object.keys(env)) {
          try {
            resolve(`var(${name})`, env);
          } catch (e) {
            const owner = (e as Error).cause as string;
            const where = ls.findLast(([, d]) => owner in d)?.[0] ?? '';
            const ctx = [theme && `theme ${theme}`, accent && `accent ${accent}`, ...opts.map(([k, v]) => `${k} ${v}`)];
            throw new Error(`${where}: ${(e as Error).message} (${ctx.filter(Boolean).join(', ')})`);
          }
        }
      }
}

// Expands var(--x) against env. Everything else is left as written. Throws on an undefined token or a cycle; the
// error's `cause` is the token whose value holds the bad reference.
export function resolve(value: string, env: Decls, stack: string[] = []): string {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    const owner = stack.at(-1) ?? name;
    if (stack.includes(name))
      throw new Error(`reference cycle ${[...stack.slice(stack.indexOf(name)), name].join(' -> ')}`, {cause: owner});
    if (!(name in env)) throw new Error(`${owner} uses undefined token ${name}`, {cause: owner});
    return resolve(env[name], env, [...stack, name]);
  });
}

const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
// Resolved colour -> [r, g, b, a] in 0-255 and 0-1, or null when it is not a plain colour (gradients).
// color-mix(in srgb, A p%, B) mixes premultiplied, as browsers do, so a mix with transparent keeps A's colour.
export function toRgba(value: string): number[] | null {
  let m;
  if (value === 'transparent') return [0, 0, 0, 0];
  if (/^#[0-9a-f]{6}$/i.test(value)) return [...hex(value), 1];
  if ((m = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/))) return [+m[1], +m[2], +m[3], +m[4]];
  if ((m = value.match(/^color-mix\(in srgb, (.+) ([\d.]+)%, (.+)\)$/))) {
    const [a, b, p] = [toRgba(m[1]), toRgba(m[3]), Number(m[2]) / 100];
    if (!a || !b) return null;
    const alpha = a[3] * p + b[3] * (1 - p);
    if (!alpha) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (a[i] * a[3] * p + b[i] * b[3] * (1 - p)) / alpha).concat(alpha);
  }
  return null;
}

// WCAG contrast of two resolved colours. A translucent foreground is laid over the (opaque) background first.
export function contrast(fg: string, bg: string) {
  const [f, b] = [toRgba(fg), toRgba(bg)];
  if (!f || !b || b[3] !== 1) throw new Error(`contrast: ${fg} on ${bg} is not a colour on an opaque background`);
  const lum = (c: number[]) => {
    const [r, g, bl] = c.map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(f.slice(0, 3).map((v, i) => v * f[3] + b[i] * (1 - f[3]))), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// The contrast rules for every theme x (no accent + each accent), and for prefers-contrast: more, whose overrides are
// read from the `@media (prefers-contrast: more)` block of utilities.css. Returns the number of checks and failures.
export function contrastChecks(src: Sources, utilitiesCss: string) {
  const fails: string[] = [];
  let count = 0;
  const at = utilitiesCss.indexOf('@media (prefers-contrast: more)');
  const more = Object.fromEntries(at < 0 ? [] : (cssBlocks(utilitiesCss.slice(at))[0]?.decls ?? []));
  if (!more['--muted'] || !more['--border'])
    fails.push('utilities.css: no --muted and --border in the @media (prefers-contrast: more) block');
  for (const theme of Object.keys(src.themes)) {
    const need = (label: string, env: Decls, fg: string, bg: string, min: number) => {
      count++;
      const [f, b] = [resolve(`var(${fg})`, env), resolve(`var(${bg})`, env)];
      const r = contrast(f, b);
      if (r < min) fails.push(`${label}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1 (${f} on ${b})`);
    };
    const env = themeEnv(src, theme, '');
    for (const k of ['--foreground', '--muted', '--danger', '--warning', '--ok'])
      need(theme, env, k, '--background', 4.5);
    need(theme, env, '--surface-text', '--surface', 4.5);
    // Code colours sit on the always-dark --surface.
    for (const k of Object.keys(env).filter((n) => n.startsWith('--code-'))) need(theme, env, k, '--surface', 4.5);
    for (const accent of ['', ...Object.keys(src.accents)]) {
      const e = themeEnv(src, theme, accent);
      const id = `${theme}/${accent || 'default'}`;
      need(id, e, '--accent-text', '--background', 4.5);
      need(id, e, '--accent', '--background', 3);
      need(id, e, '--on-accent', '--accent', 4.5);
    }
    if (more['--muted'] && more['--border']) {
      const e = {...env, ...more};
      need(`${theme} more-contrast`, e, '--muted', '--background', 7);
      need(`${theme} more-contrast`, e, '--border', '--background', 3);
    }
  }
  return {count, fails};
}

// Resolved length -> px number, for px literals and calc(a + b) of them. Null for anything else (clamp, ch).
export function toPx(value: string) {
  const mul = value.match(/^calc\(([\d.]+)(?:px)? \* ([\d.]+)\)$/); // calc(6px * 0.5)
  if (mul) return Number(mul[1]) * Number(mul[2]);
  const calc = value.match(/^calc\((.+)\)$/);
  const nums = (calc ? calc[1].split(' + ') : [value]).map((p) => p.match(/^(-?[\d.]+)(px)?$/)?.[1]); // a bare 0 is a length too
  return nums.every((n) => n !== undefined) ? nums.reduce((s, n) => s + Number(n), 0) : null;
}

// Group and leaf name for a custom property, e.g. --control-sm -> control / sm.
const GROUPS: [string, RegExp][] = [
  ['code', /^--code-/],
  ['zIndex', /^--z-/],
  ['control', /^--control-/],
  ['space', /^--s\d$/],
  ['type', /^--(font|text|heading|display|weight|leading)-/],
  ['motion', /^--(ease|fast|base|slow)$/],
  ['layout', /^--(side|measure|content|window-pad|container-[\w]+|bp-[\w]+)$/],
  ['radius', /^--(radius(-sm|-md|-lg)?|round)$/],
  ['effect', /^--(shadow-[\w]+|focus-ring|border-width|opacity-disabled)$/],
  ['color', /^--/],
];
const PREFIX: Decls = {code: '--code-', zIndex: '--z-', control: '--control-'};
export function classify(name: string) {
  const group = GROUPS.find(([, re]) => re.test(name))![0];
  return {group, leaf: name.slice((PREFIX[group] ?? '--').length)};
}
export const cssName = (group: string, leaf: string) => (PREFIX[group] ?? '--') + leaf;

export const typeOf = (group: string, value: string) => {
  if (group === 'color' || group === 'code') return /gradient/.test(value) ? {} : {$type: 'color'};
  return /^-?[\d.]+px$/.test(value) ? {$type: 'dimension'} : {};
};

// The W3C design-token tree: base (the :root block), theme.<name>, accent.<name>.<theme>, option.<kind>.<value>.
export function buildTokens(src: Sources) {
  const tree = (decls: Decls) => {
    const t: Tree = {};
    for (const [name, value] of Object.entries(decls)) {
      const {group, leaf} = classify(name);
      (t[group] ??= {})[leaf] = {$value: value, ...typeOf(group, value)};
    }
    return t;
  };
  const accentNames = Object.keys(src.accents);
  return {
    $description:
      'Monoline design tokens, generated from packages/css/src/{tokens,accents,options}.css. Edit the CSS and run node packages/tokens/scripts/build.ts.',
    base: tree(src.base),
    theme: Object.fromEntries(THEMES.map((t) => [t, tree(src.themes[t])])),
    accent: Object.fromEntries(
      accentNames.map((a) => [
        a,
        Object.fromEntries(
          THEMES.map((t) => {
            const env = themeEnv(src, t, a);
            return [t, tree(Object.fromEntries(ACCENT_VARS.map((n) => [n, resolve(env[n], env)])))];
          }),
        ),
      ]),
    ),
    option: Object.fromEntries(
      Object.entries(src.options).map(([kind, values]) => [
        kind,
        Object.fromEntries(Object.entries(values).map(([v, decls]) => [v, tree(decls)])),
      ]),
    ),
  };
}

// Flat [cssName, value] pairs of a tree from buildTokens (group -> leaf -> {$value}).
export function flatten(tree: Tree) {
  return Object.entries(tree).flatMap(([group, leaves]) =>
    Object.entries(leaves).map(([leaf, node]) => [cssName(group, leaf), node.$value]),
  );
}

// Re-export as CSS. Same cascade as the source: base, then themes, then accents, then options.
export function tokensCss(json: TokensJson) {
  const block = (selector: string, tree: Tree) =>
    `${selector} {\n${flatten(tree)
      .map(([n, v]) => `  ${n}: ${v};`)
      .join('\n')}\n}\n`;
  const parts = [
    '/* Generated by packages/tokens/scripts/build.ts from packages/css/src. Do not edit. */',
    block(':root', json.base),
    block(':root, [data-theme="warm"]', json.theme.warm),
    block('[data-theme="dark"]', json.theme.dark),
    block('[data-theme="midnight"]', json.theme.midnight),
  ];
  for (const a of Object.keys(json.accent)) {
    parts.push(block(`[data-accent="${a}"]`, json.accent[a].warm));
    parts.push(block(`[data-accent="${a}"][data-theme="dark"]`, json.accent[a].dark));
    parts.push(block(`[data-accent="${a}"][data-theme="midnight"]`, json.accent[a].midnight));
  }
  for (const [kind, values] of Object.entries(json.option))
    for (const [v, tree] of Object.entries(values)) parts.push(block(`[data-${kind}="${v}"]`, tree));
  return parts.join('\n');
}

// Figma variables: four collections. Colours have a mode per theme and accent; the others have
// a mode per option. Shape: {collections:[{name, modes, variables:[{name, resolvedType, valuesByMode}]}]}.
// Colours are {r,g,b,a} in 0-1. Not exported (Figma has no type for them): motion, z-index, gradients, ch lengths.
export function figmaVariables(src: Sources) {
  const skipped = new Set<string>();
  const accents = Object.keys(src.accents);
  const colourModes = THEMES.flatMap((t) => accents.map((a) => ({name: `${t} / ${a}`, t, a})));
  const colourNames = [...new Set([...Object.keys(src.base), ...Object.keys(src.themes.warm)])].filter((n) =>
    ['color', 'code'].includes(classify(n).group),
  );
  const colourVars = [];
  for (const name of colourNames) {
    const {group, leaf} = classify(name);
    const valuesByMode: Record<string, Rgba> = {};
    let ok = true;
    for (const m of colourModes) {
      const env = themeEnv(src, m.t, m.a);
      const rgba = toRgba(resolve(env[name], env));
      if (!rgba) {
        ok = false;
        break;
      }
      valuesByMode[m.name] = {
        r: +(rgba[0] / 255).toFixed(6),
        g: +(rgba[1] / 255).toFixed(6),
        b: +(rgba[2] / 255).toFixed(6),
        a: +rgba[3].toFixed(6),
      };
    }
    if (ok) colourVars.push({name: `${group}/${leaf}`, resolvedType: 'COLOR', valuesByMode});
    else skipped.add(name);
  }

  // Lengths and strings for a set of modes: env is the base with that option applied.
  const scalarCollection = (name: string, modes: string[], envFor: (mode: string) => Decls, groups: string[]) => {
    const names = Object.keys(src.base).filter((n) => groups.includes(classify(n).group));
    const variables = names.map((n) => {
      const {group, leaf} = classify(n);
      const values = modes.map((m) => {
        const env = envFor(m);
        return resolve(env[n], env);
      });
      const px = values.map(toPx);
      const isNumber = px.every((p) => p !== null);
      return {
        name: `${group}/${leaf}`,
        resolvedType: isNumber ? 'FLOAT' : 'STRING',
        valuesByMode: Object.fromEntries(modes.map((m, i) => [m, isNumber ? px[i] : values[i]])),
      };
    });
    return {name, modes, variables};
  };
  const density = ['comfortable', 'compact', 'spacious'];
  const radii = ['square', 'soft', 'round'];
  const fonts = ['mono', 'sans', 'serif'];
  const dens = (d: string) => src.options.density?.[d] ?? {};
  const fontDecls = (f: string) => (f === 'mono' ? {} : src.options.font[f]);
  const typeModes = fonts.flatMap((f) => density.map((d) => `${f} / ${d}`));
  const typeEnv = (m: string) => {
    const [f, d] = m.split(' / ');
    return {...src.base, ...fontDecls(f), ...dens(d)};
  };

  const collections: [Collection<Rgba>, Collection<Scalar>, Collection<Scalar>, Collection<Scalar>] = [
    {name: 'Colors', modes: colourModes.map((m) => m.name), variables: colourVars},
    scalarCollection('Spacing', density, (d) => ({...src.base, ...dens(d)}), ['space', 'control', 'layout']),
    scalarCollection('Radius', radii, (r) => ({...src.base, ...(src.options.radius?.[r] ?? {})}), ['radius']),
    scalarCollection('Typography', typeModes, typeEnv, ['type']),
  ];
  for (const n of Object.keys(src.base)) if (['motion', 'zIndex', 'effect'].includes(classify(n).group)) skipped.add(n);
  return {$format: 'monoline-figma-variables', $skipped: [...skipped].sort(), collections};
}

// React Native values. Colours per theme x accent, resolved (color-mix included) to '#RRGGBB' or 'rgba(r, g, b, a)'.
// Other tokens once, for the default options: px, bare numbers and calc() become numbers, durations become
// milliseconds (Animated takes ms), cubic-bezier() becomes [x1, y1, x2, y2] for Easing.bezier. Anything else has no
// React Native equivalent (clamp(), gradients, font stacks, ch, shadows, the focus ring) and is listed in $omitted.
export function nativeTokens(src: Sources) {
  const omitted = new Set<string>();
  const isColour = (n: string) => ['color', 'code'].includes(classify(n).group);
  const out = (c: number[]) =>
    c[3] === 1
      ? `#${c
          .slice(0, 3)
          .map((v) => Math.round(v).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()}`
      : `rgba(${c.slice(0, 3).map(Math.round).join(', ')}, ${+c[3].toFixed(3)})`;
  const colors = Object.fromEntries(
    THEMES.map((t) => [
      t,
      Object.fromEntries(
        Object.keys(src.accents).map((a) => {
          const env = themeEnv(src, t, a);
          const pairs = Object.keys(env)
            .filter(isColour)
            .flatMap((n) => {
              const c = toRgba(resolve(env[n], env));
              if (!c) omitted.add(n);
              return c ? [[n.slice(2), out(c)]] : [];
            });
          return [a, Object.fromEntries(pairs)];
        }),
      ),
    ]),
  );
  const env = themeEnv(src, 'warm', '');
  const values: Record<string, number | number[]> = {};
  for (const n of Object.keys(env).filter((n) => !isColour(n))) {
    const v = resolve(env[n], env);
    const ms = v.match(/^([\d.]+)s$/);
    const bezier = v.match(/^cubic-bezier\(([^)]+)\)$/);
    const value = toPx(v) ?? (ms ? Math.round(Number(ms[1]) * 1000) : bezier ? bezier[1].split(',').map(Number) : null);
    if (value === null) omitted.add(n);
    else values[n.slice(2)] = value;
  }
  return {
    $description:
      'Monoline tokens for React Native, generated from packages/css/src by packages/tokens/scripts/build.ts. colors.<theme>.<accent>; values are px, ms, unitless numbers or bezier points.',
    $omitted: [...omitted].sort(),
    colors,
    values,
  };
}

// TypeScript types for the token names and themes.
export function typesDts(json: TokensJson) {
  const leaves = (tree: Tree, group: string) => Object.keys(tree[group] ?? {});
  const union = (names: string[]) => names.map((n) => JSON.stringify(n)).join(' | ');
  const color = [
    ...new Set([
      ...leaves(json.base, 'color'),
      ...leaves(json.theme.warm, 'color'),
      ...leaves(json.base, 'code').map((c) => `code-${c}`),
    ]),
  ];
  const accents = Object.keys(json.accent);
  const fonts = ['mono', ...Object.keys(json.option.font)];
  return `// Generated by packages/tokens/scripts/build.ts. Do not edit.
export declare const themes: readonly [${THEMES.map((t) => JSON.stringify(t)).join(', ')}];
export type Theme = ${union(THEMES)};
export declare const accents: readonly [${accents.map((a) => JSON.stringify(a)).join(', ')}];
export type Accent = ${union(accents)};
export declare const densities: readonly ["comfortable", "compact", "spacious"];
export type Density = "comfortable" | "compact" | "spacious";
export declare const fonts: readonly [${fonts.map((f) => JSON.stringify(f)).join(', ')}];
export type Font = ${union(fonts)};
export declare const radii: readonly ["square", "soft", "round"];
export type Radius = "square" | "soft" | "round";

/** Colour tokens: theme colours, accent colours and derived lines and washes (without the leading --). */
export type ColorToken = ${union(color)};
export type SpaceToken = ${union(leaves(json.base, 'space'))};
export type ControlToken = ${union(leaves(json.base, 'control'))};
export type LayoutToken = ${union(leaves(json.base, 'layout'))};
export type TypeToken = ${union(leaves(json.base, 'type'))};
export type RadiusToken = ${union(leaves(json.base, 'radius'))};
export type MotionToken = ${union(leaves(json.base, 'motion'))};
export type EffectToken = ${union(leaves(json.base, 'effect'))};
export type ZIndexToken = ${union(leaves(json.base, 'zIndex'))};
export type CodeToken = ${union(leaves(json.base, 'code').map((c) => `code-${c}`))};

/** Every custom property the tokens define, with its leading --. */
export type CssVariable = ${union([
    ...new Set(
      flatten(json.base)
        .concat(flatten(json.theme.warm))
        .concat(Object.values(json.option).flatMap((o) => Object.values(o).flatMap(flatten)))
        .map(([n]) => n),
    ),
  ])};
`;
}
