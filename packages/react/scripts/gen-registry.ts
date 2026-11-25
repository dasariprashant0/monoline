// Generates the machine-readable registry from component folders:
//   registry/index.json        every component: meta, file list, related names, prop names
//   registry/<name>.json       one component: meta, props, usage, a11y, classes, data attributes, full source (tsx + css)
//   llms.txt                   short index (https://llmstxt.org)
//   llms-full.txt              everything an agent needs to write correct code: props, usage, a11y, classes
// Run: npm run registry (repo root). CI fails if the output is stale. Props come from props-extract.ts, the
// same extraction the docs site uses.
import {mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {pkgRoot, repoRoot, units, readMeta, CATEGORIES, type Meta} from './lib.ts';
import {COMPONENT_PROPS, HOOK_PROPS, createProgram, mainSourceFile, propGroups, type PropGroup} from './props-extract.ts';
import {cssFacts, usageFor, relatedFor, type DataAttribute} from './registry-fields.ts';
import {extractDemos, exportedNames} from '../../../apps/docs/scripts/lib/demos.ts';

export const LLMS_FULL_LIMIT = 400 * 1024; // bytes; the generator fails above this

const cssDir = join(repoRoot, 'packages', 'css', 'src', 'components');
const regDir = join(repoRoot, 'registry');
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const pascal = (name: string) => name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = (name: string) => { const p = pascal(name); return p[0].toLowerCase() + p.slice(1); };
const oneLine = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();

const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
const all = units();
const known = new Set(all.map((u) => u.name));
const program = createProgram(all.map((u) => mainSourceFile(u.dir, u.name)).filter(Boolean) as string[]);

// Shared helpers a component imports from src/utils (slot, overlay, chart...), with the ones those import in turn.
// cx is left out: the CLI writes it itself. The CLI copies these next to the component so the import resolves.
const utilsDir = join(pkgRoot, 'src', 'utils');
type SourceFile = {path: string; content: string};
function sharedUtils(source: SourceFile[]) {
  const found = new Map<string, SourceFile>();
  const visit = (code: string, re: RegExp) => {
    for (const m of code.matchAll(re)) {
      const name = m[1];
      if (name === 'cx' || found.has(name)) continue;
      const file = ['.ts', '.tsx'].map((e) => name + e).find((f) => existsSync(join(utilsDir, f)));
      if (!file) throw new Error(`utils/${name} is imported but not found in src/utils`);
      const content = readFileSync(join(utilsDir, file), 'utf8');
      found.set(name, {path: `packages/react/src/utils/${file}`, content});
      visit(content, /from '\.\/([a-z0-9-]+)'/g);
    }
  };
  for (const s of source) if (/\.tsx?$/.test(s.path)) visit(s.content, /from '\.\.\/\.\.\/utils\/([a-z0-9-]+)'/g);
  return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

// Pass 1: the export each unit's index.ts gives (the name people import), so hooks get `useX`, not `UseX`.
const exportOf = new Map(all.map((u) => {
  const want = u.kind === 'hooks' ? camel(u.name) : pascal(u.name);
  const {values} = exportedNames(readFileSync(join(u.dir, 'index.ts'), 'utf8'));
  return [u.name, values.includes(want) ? want : (values[0] ?? want)];
}));
// Every name the package exports (values and types), to keep usage snippets to real imports.
const publicNames = new Set(all.flatMap((u) => { const {values, types} = exportedNames(readFileSync(join(u.dir, 'index.ts'), 'utf8')); return [...values, ...types]; }));
const categoryOf = new Map(all.map((u) => [u.name, readMeta(u).category]));

// Pass 2: every field of every component, computed in memory first so a failed size check writes nothing.
type Entry = Meta & {kind: string; import: string; path: string; files: string[]; related: string[]; props: PropGroup[]; usage: string; dataAttributes: DataAttribute[]; classes: string[]};
const records: Entry[] = []; // full entries, one per component
const perComponent = new Map<string, string>();
for (const u of all) {
  const meta = readMeta(u);
  const symbol = exportOf.get(u.name)!;
  const importLine = `import {${symbol}} from '@monoline/react'`;
  const isHook = u.kind === 'hooks';

  const file = mainSourceFile(u.dir, u.name);
  const props = file ? propGroups(program, file, {pattern: isHook ? HOOK_PROPS : COMPONENT_PROPS}) : [];

  const cssTexts = meta.css.map((f) => {
    const p = join(cssDir, f);
    if (!existsSync(p)) throw new Error(`${u.name}: css file ${f} not found in packages/css/src/components`);
    return readFileSync(p, 'utf8');
  });
  const {classes, dataAttributes} = cssFacts(cssTexts);

  const demoFile = join(u.dir, `${u.name}.demo.tsx`);
  const demo = existsSync(demoFile) ? extractDemos(readFileSync(demoFile, 'utf8'), `${u.name}.demo.tsx`)[0] : undefined;
  const usage = usageFor({demo, importLine, symbol, isHook, publicNames});

  const siblings = all.filter((o) => categoryOf.get(o.name) === meta.category).map((o) => o.name).sort();
  const related = relatedFor({meta, known, siblings});

  const files = readdirSync(u.dir).filter((f) => !f.startsWith('.')).sort(); // dotfiles are local tool state, never part of a component
  const path = relative(repoRoot, u.dir);
  const entry = {
    ...meta,
    kind: u.kind,
    import: importLine,
    path,
    files: files.map((f) => `${path}/${f}`),
    related,
    props,
    usage,
    dataAttributes,
    classes,
  };
  records.push(entry);
  const source = readdirSync(u.dir).filter((f) => /\.(tsx?|json)$/.test(f) && !/\.(test|demo)\./.test(f)).sort()
    .map((f) => ({path: `${path}/${f}`, content: readFileSync(join(u.dir, f), 'utf8')}));
  const css = meta.css.map((f, i) => ({path: `packages/css/src/components/${f}`, content: cssTexts[i]}));
  const utils = sharedUtils(source);
  // radix-ui is listed only when the copied files (the component and its shared helpers) import it.
  const usesRadix = [...source, ...utils].some((f) => /from ['"]radix-ui['"]/.test(f.content));
  const ownRadix = source.some((f) => /from ['"]radix-ui['"]/.test(f.content));
  if (ownRadix !== /^radix-ui/.test(meta.primitive ?? '')) throw new Error(`${u.name}: meta.json "primitive" must start with "radix-ui" exactly when the component's own source imports radix-ui`);
  perComponent.set(u.name, JSON.stringify({...entry, dependencies: usesRadix ? {'radix-ui': '^1.4.2'} : {}, source, utils, css}, null, 2) + '\n');
}

// index.json: the light list (no props, usage or classes; the per-component file has those). Prop names are here so search can match them.
const index = records.map(({props, usage, classes, dataAttributes, ...rest}) => ({...rest, propNames: props.flatMap((g) => g.props.map((p) => p.name))}));

// llms.txt: short map. llms-full.txt: everything an agent needs in one file.
const REPO = 'https://github.com/dasariprashant0/monoline/blob/master';
const SITE = 'https://monoline.prashantdasari.com';
const byCat = (c: string) => index.filter((e) => e.category === c);
const section = (c: string) => byCat(c).length ? `\n### ${c}\n${byCat(c).map((e) => `- ${e.title} (${e.name}, ${e.status}): ${e.description} Source: ${REPO}/${e.path}/`).join('\n')}\n` : '';
const head = `# Monoline\n\n> Open-source UI kit: a plain CSS core (@monoline/css) with accessible React components (@monoline/react). Three themes, eight accents, font, corner and density options, no Tailwind, no runtime CSS-in-JS.\n\nStart with AGENTS.md (https://github.com/dasariprashant0/monoline/blob/master/AGENTS.md: how to work in this repo) and DESIGN.md (https://github.com/dasariprashant0/monoline/blob/master/DESIGN.md: the look and rules). Every component is a folder with source, test, demo and meta.json. Install the packages, or copy one component with npx monoline add <name> (source in https://monoline.prashantdasari.com/registry/<name>.json).\n`;
const shortText = `${head}\n## Docs\n- [AGENTS.md](${REPO}/AGENTS.md): rules for AI agents and contributors\n- [DESIGN.md](${REPO}/DESIGN.md): design rules, tokens, copy\n- [registry/index.json](${SITE}/registry/index.json): machine-readable component list, with props names and related components\n\n## Components${CATEGORIES.map(section).join('')}`;

/** One component as compact text: description, import, props, usage, a11y, classes. */
function fullSection(e: Entry) {
  const out = [`## ${e.title} (${e.name})`, oneLine(e.description)];
  out.push(`Status: ${e.status} | Category: ${e.category}${e.primitive ? ` | Primitive: ${e.primitive}` : ''}${e.related.length ? ` | Related: ${e.related.join(', ')}` : ''}`);
  out.push(`Import: ${e.import}`, '');
  const props = e.props.flatMap((g) => g.props.map((p) => ({...p, group: g.name, multi: e.props.length > 1})));
  if (!props.length) out.push(e.category === 'hooks' ? 'Parameters and return value: see the Usage example and the source file.' : 'Props: no exported *Props type in the source. Extra props go to the underlying element or primitive.');
  else {
    out.push('Props (name: type = default, ? means optional):');
    let last = '';
    for (const p of props) {
      if (p.multi && p.group !== last) { out.push(`${p.group}:`); last = p.group; }
      out.push(`- ${p.name}${p.optional ? '?' : ''}: ${oneLine(p.type)}${p.default ? ` = ${oneLine(p.default)}` : ''}${p.description ? ` — ${oneLine(p.description)}` : ''}`);
    }
  }
  out.push('', 'Usage:', '```tsx', e.usage, '```');
  out.push('', 'A11y:', ...e.a11y.map((a) => `- ${oneLine(a)}`));
  if (e.classes.length) out.push('', `CSS classes: ${e.classes.join(', ')}`);
  if (e.dataAttributes.length) out.push(`Data attributes: ${e.dataAttributes.map((d) => (d.values.length ? `${d.name}: ${d.values.join(' | ')}` : d.name)).join('; ')}`);
  out.push(`Source: ${SITE}/registry/${e.name}.json`);
  return out.join('\n');
}
const fullText = `${head}\n${records.map(fullSection).join('\n\n')}\n`;

// Size guard: print sizes, refuse to write an llms-full.txt over the limit.
const fullPath = join(repoRoot, 'llms-full.txt');
const shortPath = join(repoRoot, 'llms.txt');
const before = existsSync(fullPath) ? statSync(fullPath).size : null;
const fullBytes = Buffer.byteLength(fullText);
console.log(`llms-full.txt: ${kb(fullBytes)} (before: ${before === null ? 'none' : kb(before)}, limit ${kb(LLMS_FULL_LIMIT)})`);
console.log(`llms.txt: ${kb(Buffer.byteLength(shortText))}`);
if (fullBytes > LLMS_FULL_LIMIT) throw new Error(`llms-full.txt is ${kb(fullBytes)}, over the ${kb(LLMS_FULL_LIMIT)} limit: make props or usage shorter before shipping`);

// Write.
mkdirSync(regDir, {recursive: true});
for (const f of readdirSync(regDir)) if (f.endsWith('.json')) rmSync(join(regDir, f));
for (const [name, text] of perComponent) writeFileSync(join(regDir, `${name}.json`), text);
writeFileSync(join(regDir, 'index.json'), JSON.stringify({name: '@monoline/react', version: pkg.version, components: index}, null, 2) + '\n');
writeFileSync(shortPath, shortText);
writeFileSync(fullPath, fullText);
console.log(`registry: ${index.length} entries`);
