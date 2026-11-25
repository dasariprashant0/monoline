// monoline CLI: copy components from the registry into a project, compare them with it, update them.
// Plain Node, no dependencies.
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {parseArgs} from 'node:util';
import {asEntry, asIndex, NAME, type RegistryEntry, type RegistryIndex} from './schema.js';

const VERSION: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
/** The registry as it was when this version was released: the release workflow tags every published version v<x.y.z>. */
export const DEFAULT_REGISTRY = `https://raw.githubusercontent.com/dasariprashant0/monoline/v${VERSION}/registry`;
const DEFAULTS = {components: 'src/components/monoline', styles: 'src/styles/monoline'};
const CX = `/** Join class names, skipping falsy values. \`cx('btn', loading && 'is-loading', className)\` */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
`;
const HELP = `monoline <command>

  add <name...>          copy components (and the components they use) into your project
  add --all              copy every component in the registry
  add --category <x>     copy every component in one category
  list                   list components   [--category <x>]
  search <words...>      find components by name, keyword or description
  info <name>            show one component
  diff <name...>         compare the project's copy with the registry (exit 1 if they differ)
  update <name...>       replace the project's copy with the registry version, after showing the diff
  init                   write monoline.json and print the CSS import line

Options
  --registry <path|url>  registry folder or URL (default: the v${VERSION} registry on GitHub)
  --dir <path>           component folder   (default: ${DEFAULTS.components})
  --styles <path>        CSS folder         (default: ${DEFAULTS.styles})
  --overwrite            (add) replace files that already exist and differ
  --yes                  (update) replace without asking
  --backup               (update) keep the old file as <file>.orig first
  --dry-run              show what would be written, write nothing
  --cwd <path>           project root (default: current folder)
`;

interface File {
  path: string;
  content: string;
}
interface Compared extends File {
  current: string | null;
  changed: boolean;
}
type Op = [' ' | '-' | '+', string];

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function load(base: string, name: string): Promise<unknown> {
  if (/^https?:\/\//.test(base)) {
    const url = `${base.replace(/\/$/, '')}/${name}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      // Until a version is released its tag does not exist, so a CLI run from the repo lands here.
      const hint = res.status === 404 && base === DEFAULT_REGISTRY ? `. No registry is tagged v${VERSION} yet: pass --registry <folder|url>` : '';
      throw new Error(`${url}: ${`${res.status} ${res.statusText}`.trim()}${hint}`);
    }
    return res.json();
  }
  const file = join(resolve(base), `${name}.json`);
  if (!existsSync(file)) throw new Error(`not found: ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** monoline.json, checked: a broken file is a plain error, not a stack trace. */
function readConfig(file: string): {components?: string; styles?: string; registry?: string} {
  if (!existsSync(file)) return {};
  let v: unknown;
  try {
    v = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`monoline.json is not valid JSON (${message(e)})`);
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('monoline.json must be an object, like {"components": "src/components/monoline"}');
  const cfg = v as Record<string, unknown>;
  for (const k of ['components', 'styles', 'registry']) {
    if (cfg[k] !== undefined && typeof cfg[k] !== 'string') throw new Error(`monoline.json "${k}" must be a string`);
  }
  return cfg;
}

// '../../utils/cx' and '../../hooks/x' live elsewhere in the repo; here everything is a sibling folder.
const fixImports = (src: string): string => src.replace(/'\.\.\/\.\.\/utils\/([a-z0-9-]+)'/g, `'../utils/$1'`).replace(/'\.\.\/\.\.\/hooks\/([a-z0-9-]+)'/g, `'../$1'`);
const siblingNames = (src: string): string[] =>
  [...src.matchAll(/from '\.\.\/([a-z0-9-]+)'/g), ...src.matchAll(/from '\.\.\/\.\.\/hooks\/([a-z0-9-]+)'/g)].flatMap((m) => m[1] ?? []);
const styleBundle = (c: RegistryEntry): string => `@layer monoline.components {\n${c.css.map((s) => s.content.trim()).join('\n\n')}\n}\n`;
const usesCx = (c: RegistryEntry): boolean =>
  c.source.some((s) => basename(s.path) !== 'meta.json' && s.content.includes('/utils/cx')) || (c.utils ?? []).some((u) => u.content.includes("'./cx'"));

// Files one component writes, paths relative to the project root. The shared utils/cx.ts is added by the caller.
function componentFiles(c: RegistryEntry, compDir: string, styleDir: string): File[] {
  const files = c.source.filter((s) => basename(s.path) !== 'meta.json')
    .map((s) => ({path: join(compDir, c.name, basename(s.path)), content: fixImports(s.content)}));
  // Shared helpers (slot, overlay, chart...) the registry lists for this component; they sit in utils/ next to cx.ts.
  for (const u of c.utils ?? []) files.push({path: join(compDir, 'utils', basename(u.path)), content: u.content});
  // One file per component: the CSS it lists, in the components layer (core.css declares the layer order).
  if (c.css.length) files.push({path: join(styleDir, `${c.name}.css`), content: styleBundle(c)});
  return files;
}
const cxFile = (compDir: string): File => ({path: join(compDir, 'utils', 'cx.ts'), content: CX});

/** Every file a set of components writes, cx.ts included when one needs it, each path once. */
function filesFor(items: Iterable<RegistryEntry>, compDir: string, styleDir: string): File[] {
  const list = [...items];
  const files = [...list.flatMap((c) => componentFiles(c, compDir, styleDir)), ...(list.some(usesCx) ? [cxFile(compDir)] : [])];
  const seen = new Set<string>();
  return files.filter((f) => !seen.has(f.path) && seen.add(f.path));
}

// Unified diff of two texts with 3 lines of context. '' when they are equal.
export function unifiedDiff(oldText: string, newText: string, oldName: string, newName: string, context = 3): string {
  if (oldText === newText) return '';
  // A final newline is not a line of its own: drop the empty last element before comparing.
  const lines = (t: string) => (t.endsWith('\n') ? t.slice(0, -1) : t).split('\n');
  const ops = editScript(lines(oldText), lines(newText));
  const changes = ops.flatMap((op, i) => (op[0] === ' ' ? [] : [i]));
  const out = [`--- ${oldName}`, `+++ ${newName}`];
  const count = (list: Op[], skip: Op[0]) => list.filter((o) => o[0] !== skip).length;
  let k = 0;
  while (k < changes.length) {
    let last = changes[k] ?? 0;
    const first = Math.max(0, last - context);
    while (k + 1 < changes.length && (changes[k + 1] ?? 0) - last <= 2 * context) last = changes[++k] ?? 0;
    const end = Math.min(ops.length - 1, last + context);
    const hunk = ops.slice(first, end + 1);
    const before = ops.slice(0, first);
    const oldCount = count(hunk, '+');
    const newCount = count(hunk, '-');
    const oldStart = count(before, '+') + (oldCount ? 1 : 0);
    const newStart = count(before, '-') + (newCount ? 1 : 0);
    out.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`, ...hunk.map(([t, line]) => t + line));
    k++;
  }
  return out.join('\n') + '\n';
}

// Line edit script from an LCS table, with the common head and tail trimmed first.
function editScript(a: string[], b: string[]): Op[] {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const A = a.slice(pre, a.length - suf), B = b.slice(pre, b.length - suf);
  const n = A.length, m = B.length, w = m + 1;
  const L = new Uint32Array((n + 1) * w);
  const at = (i: number, j: number) => L[i * w + j] ?? 0;
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i * w + j] = A[i] === B[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
  }
  const ops: Op[] = a.slice(0, pre).map((l) => [' ', l]);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { ops.push([' ', A[i++] ?? '']); j++; }
    else if (at(i + 1, j) >= at(i, j + 1)) ops.push(['-', A[i++] ?? '']);
    else ops.push(['+', B[j++] ?? '']);
  }
  while (i < n) ops.push(['-', A[i++] ?? '']);
  while (j < m) ops.push(['+', B[j++] ?? '']);
  return ops.concat(a.slice(a.length - suf).map((l): Op => [' ', l]));
}

// The project's files next to what the registry says they should be.
function compare(cwd: string, files: File[]): Compared[] {
  return files.map((f) => {
    const abs = join(cwd, f.path);
    const current = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
    return {...f, current, changed: current !== f.content};
  });
}

const askInTerminal = async (question: string): Promise<boolean> => {
  if (!process.stdin.isTTY) throw new Error('not a terminal, so it cannot ask; pass --yes to update without asking');
  const rl = createInterface({input: process.stdin, output: process.stdout});
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
};

const row = (c: RegistryIndex['components'][number]) => `${c.name.padEnd(22)}${c.category.padEnd(14)}${c.status.padEnd(8)}${c.description}`;

export interface RunOptions {
  out?: ((line: string) => void) | undefined;
  err?: ((line: string) => void) | undefined;
  confirm?: ((question: string) => Promise<boolean>) | undefined;
}

export async function run(argv: string[], {out = console.log, err = console.error, confirm = askInTerminal}: RunOptions = {}): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({args: argv, allowPositionals: true, options: {
      registry: {type: 'string'}, dir: {type: 'string'}, styles: {type: 'string'}, category: {type: 'string'}, cwd: {type: 'string'},
      overwrite: {type: 'boolean'}, yes: {type: 'boolean'}, backup: {type: 'boolean'}, all: {type: 'boolean'},
      'dry-run': {type: 'boolean'}, help: {type: 'boolean', short: 'h'},
    }});
  } catch (e) {
    err(message(e));
    return 1;
  }
  const {values: o, positionals: [cmd, ...names]} = parsed;
  if (!cmd || o.help || cmd === 'help') return out(HELP), 0;
  const cwd = resolve(o.cwd ?? process.cwd());
  const cfgFile = join(cwd, 'monoline.json');
  try {
    const cfg = {...DEFAULTS, registry: DEFAULT_REGISTRY, ...readConfig(cfgFile)};
    const registry = o.registry ?? cfg.registry;
    const compDir = o.dir ?? cfg.components;
    const styleDir = o.styles ?? cfg.styles;
    const loadIndex = async () => asIndex(await load(registry, 'index'), 'index.json');
    const loadComponent = async (name: string): Promise<RegistryEntry> => {
      if (!NAME.test(name)) throw new Error(`invalid component name "${name}" (lowercase letters, digits and hyphens)`);
      let json: unknown;
      try { json = await load(registry, name); } catch (e) { throw new Error(`unknown component "${name}" (${message(e)})`); }
      return asEntry(json, `${name}.json`);
    };
    // The named components plus every component they import, in the order found.
    const withSiblings = async (wanted: string[]): Promise<Map<string, RegistryEntry>> => {
      const items = new Map<string, RegistryEntry>();
      const queue = [...wanted];
      for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
        if (items.has(n)) continue;
        const c = await loadComponent(n);
        items.set(n, c);
        for (const s of c.source) if (/\.tsx?$/.test(s.path)) queue.push(...siblingNames(s.content));
      }
      return items;
    };

    if (cmd === 'init') {
      if (existsSync(cfgFile) && !o.overwrite) throw new Error('monoline.json already exists (use --overwrite)');
      const body = JSON.stringify({components: compDir, styles: styleDir}, null, 2) + '\n';
      if (o['dry-run']) out(`would write monoline.json\n${body}`);
      else writeFileSync(cfgFile, body), out('wrote monoline.json');
      out(`\nInstall the tokens, then import them once in your app entry:\n  npm i @monoline/css\n  import '@monoline/css/core.css';   // tokens, base, utilities, accents, options; import it before the component CSS\n(or the whole kit: import '@monoline/css';)\nEach added component prints its own CSS import.`);
      return 0;
    }
    if (cmd === 'list') {
      const {components} = await loadIndex();
      for (const c of components.filter((c) => !o.category || c.category === o.category)) out(row(c));
      return 0;
    }
    if (cmd === 'search') {
      const query = names.join(' ').trim().toLowerCase();
      if (!query) throw new Error('usage: monoline search <words...>');
      const {components} = await loadIndex();
      const words = query.split(/\s+/);
      const scored = components.flatMap((c) => {
        const hay = [c.name, c.title, c.category, c.description, ...(c.keywords ?? [])].join(' ').toLowerCase();
        if (!words.every((w) => hay.includes(w))) return [];
        const score = (c.name === query ? 100 : 0) + (c.name.includes(query) ? 20 : 0) + (c.title.toLowerCase().includes(query) ? 10 : 0) + ((c.keywords ?? []).some((k) => k.toLowerCase().includes(query)) ? 5 : 0);
        return [{c, score}];
      });
      if (!scored.length) {
        out(`no components match "${query}"`);
        return 1;
      }
      for (const {c} of scored.sort((x, y) => y.score - x.score || x.c.name.localeCompare(y.c.name))) out(row(c));
      return 0;
    }
    if (cmd === 'info') {
      if (!names[0]) throw new Error('usage: monoline info <name>');
      const c = await loadComponent(names[0]);
      out(`${c.title} (${c.name}) [${c.category}, ${c.status}]\n${c.description}\nimport: ${c.import}\nprimitive: ${c.primitive ?? 'none'}\ncss: ${c.css.map((f) => basename(f.path)).join(', ')} (copied as one ${c.name}.css)\na11y:\n${(c.a11y ?? []).map((a) => `  - ${a}`).join('\n')}`);
      return 0;
    }
    if (cmd === 'diff' || cmd === 'update') {
      if (!names.length) throw new Error(`usage: monoline ${cmd} <name...>`);
      let code = 0;
      for (const name of names) {
        const items = await withSiblings([name]);
        const c = items.get(name) as RegistryEntry;
        if (compare(cwd, componentFiles(c, compDir, styleDir)).every((f) => f.current === null)) throw new Error(`${name} is not in the project (run: monoline add ${name})`);
        // Components it now imports that the project does not have yet come along, as `add` would bring them.
        const missing = [...items.values()].filter((s) => s !== c && !existsSync(join(cwd, compDir, s.name)));
        const files = compare(cwd, filesFor([c, ...missing], compDir, styleDir));
        // Files left in the component's folder that the registry no longer lists: reported, never deleted.
        const folder = join(compDir, name);
        const listed = new Set(files.map((f) => f.path));
        const dropped = existsSync(join(cwd, folder))
          ? readdirSync(join(cwd, folder)).map((f) => join(folder, f)).filter((p) => !listed.has(p) && !p.endsWith('.orig') && statSync(join(cwd, p)).isFile())
          : [];
        for (const p of dropped) out(`${p} is no longer in the registry; not deleted`);
        const changed = files.filter((f) => f.changed);
        if (!changed.length) { out(`${name}: same as the registry`); continue; }
        for (const f of changed) out(unifiedDiff(f.current ?? '', f.content, `${f.path} (project)`, `${f.path} (registry)`).replace(/\n$/, ''));
        if (cmd === 'diff') { code = 1; continue; }
        if (o['dry-run']) { out(`would update ${changed.length} file(s) for ${name}`); continue; }
        if (!o.yes && !(await confirm(`Replace ${changed.length} file(s) for ${name} with the registry version?`))) {
          out(`${name}: not updated`);
          code = 1;
          continue;
        }
        for (const f of changed) {
          const abs = join(cwd, f.path);
          mkdirSync(dirname(abs), {recursive: true});
          if (o.backup && f.current !== null) writeFileSync(`${abs}.orig`, f.current);
          writeFileSync(abs, f.content);
          out(`${f.current === null ? 'added' : 'updated'} ${f.path}${o.backup && f.current !== null ? ` (old copy: ${f.path}.orig)` : ''}`);
        }
      }
      return code;
    }
    if (cmd !== 'add') throw new Error(`unknown command "${cmd}"\n\n${HELP}`);

    // Explicit names, every component (--all) and every component in a category (--category).
    if (o.all) names.push(...(await loadIndex()).components.map((c) => c.name));
    if (o.category) names.push(...(await loadIndex()).components.filter((c) => c.category === o.category).map((c) => c.name));
    if (!names.length) throw new Error(o.category ? `no components in category "${o.category}"` : 'usage: monoline add <name...> (or --all, --category <x>)');

    const items = await withSiblings(names);
    const deps: Record<string, string> = {};
    for (const c of items.values()) Object.assign(deps, c.dependencies);
    const files = compare(cwd, filesFor(items.values(), compDir, styleDir));

    // A file that is already there with the same bytes (cx.ts shared by two components) is fine; a different one is not.
    const clash = files.filter((f) => f.current !== null && f.changed);
    if (clash.length && !o.overwrite) throw new Error(`refusing to overwrite:\n${clash.map((f) => `  ${f.path}`).join('\n')}\nuse --overwrite to replace them`);
    for (const f of files) {
      if (!f.changed) { out(`same ${f.path}`); continue; }
      out(`${o['dry-run'] ? 'would write' : 'write'} ${f.path}`);
      if (o['dry-run']) continue;
      const abs = join(cwd, f.path);
      mkdirSync(dirname(abs), {recursive: true});
      writeFileSync(abs, f.content);
    }
    const css = files.filter((f) => f.path.endsWith('.css'));
    if (css.length) out(`\nImport the styles once (paths from the project root; adjust to your entry file):\n${css.map((f) => `  import './${f.path}';`).join('\n')}`);
    const pkgs = Object.entries(deps).map(([k, v]) => `${k}@"${v}"`);
    out(pkgs.length ? `\nInstall dependencies (and react >= 18):\n  npm i ${pkgs.join(' ')}` : '\nNo npm packages to install besides react >= 18.');
    return 0;
  } catch (e) {
    err(`monoline: ${message(e)}`);
    return 1;
  }
}
