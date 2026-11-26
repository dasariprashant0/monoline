// Builds each approach page on its own (POC_PAGE) twice: as shipped (core.css + approach + app.css) and with only the
// approach's own CSS (POC_STYLING_ONLY). Prints gzip sizes, CSS rule and class counts, build time and the packages
// each approach adds. Run `npm run measure` (it runs panda codegen first).
import {execFileSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const approaches = ['plain', 'modules', 've', 'panda'];
const kb = (n: number) => (n / 1024).toFixed(2);

function build(page: string, stylingOnly: boolean) {
  const outDir = join(root, 'dist-measure', page + (stylingOnly ? '-styling' : ''));
  const env = {...process.env, POC_PAGE: page, ...(stylingOnly ? {POC_STYLING_ONLY: '1'} : {})};
  const t = performance.now();
  execFileSync(
    join(root, 'node_modules/.bin/vite'),
    ['build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'],
    {
      cwd: root,
      env,
      stdio: 'inherit',
    },
  );
  const ms = performance.now() - t;
  const assets = join(outDir, 'assets');
  const files = readdirSync(assets).map((f) => ({f, buf: readFileSync(join(assets, f))}));
  const sum = (ext: string, gz: boolean) =>
    files
      .filter((x) => x.f.endsWith(ext))
      .reduce((n, x) => n + (gz ? gzipSync(x.buf, {level: 9}).length : x.buf.length), 0);
  const css = files
    .filter((x) => x.f.endsWith('.css'))
    .map((x) => x.buf.toString())
    .join('');
  return {
    ms,
    js: sum('.js', false),
    jsGz: sum('.js', true),
    css: sum('.css', false),
    cssGz: sum('.css', true),
    cssText: css,
  };
}

// Style rules: blocks whose prelude is a selector, not an at-rule. Classes: unique .name tokens in selectors.
function cssStats(css: string) {
  const preludes = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1]!.trim()).filter((p) => !p.startsWith('@'));
  const keyframeSteps = /^(from|to|\d+%)(,\s*(from|to|\d+%))*$/;
  const rules = preludes.filter((p) => !keyframeSteps.test(p));
  const classes = new Set(rules.flatMap((p) => [...p.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1])));
  return {rules: rules.length, classes: classes.size};
}

// Packages an approach adds to the install: the transitive closure of its own devDependencies in the lockfile,
// minus everything the plain baseline (vite, plugin-react, react, typescript) already installs. Only packages
// present on disk count (the lockfile also lists other platforms' optional binaries).
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')).packages as Record<
  string,
  {
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }
>;
function resolve(from: string, name: string) {
  for (let dir = from; ; dir = dir.slice(0, Math.max(0, dir.lastIndexOf('/node_modules/')))) {
    const p = `${dir ? `${dir}/` : ''}node_modules/${name}`;
    if (lock[p]) return p;
    if (!dir) return undefined;
  }
}
function closure(names: string[]) {
  const seen = new Set<string>();
  const walk = (path: string | undefined) => {
    if (!path || seen.has(path) || !existsSync(join(root, path))) return;
    seen.add(path);
    const e = lock[path]!;
    for (const n of Object.keys({...e.dependencies, ...e.optionalDependencies, ...e.peerDependencies}))
      walk(resolve(path, n));
  };
  for (const n of names) walk(`node_modules/${n}`);
  return seen;
}
function du(path: string): number {
  const s = statSync(path);
  return s.isDirectory() ? readdirSync(path).reduce((n, f) => n + du(join(path, f)), 0) : s.size;
}
const base = closure([
  'vite',
  '@vitejs/plugin-react',
  'react',
  'react-dom',
  'typescript',
  '@types/react',
  '@types/react-dom',
]);
const extra = (names: string[]) => {
  const own = [...closure(names)].filter((p) => !base.has(p) && ![...base].some((b) => p.startsWith(`${b}/`)));
  const top = own.filter((p) => !own.some((o) => o !== p && p.startsWith(`${o}/`)));
  return {count: own.length, mb: (top.reduce((n, p) => n + du(join(root, p)), 0) / 1e6).toFixed(1)};
};
const deps: Record<string, {count: number; mb: string}> = {
  plain: {count: 0, mb: '0.0'},
  modules: {count: 0, mb: '0.0'},
  ve: extra(['@vanilla-extract/css', '@vanilla-extract/recipes', '@vanilla-extract/vite-plugin']),
  panda: extra(['@pandacss/dev', '@pandacss/preset-base']),
};

console.log(`baseline install (vite, plugin-react, react, typescript, types): ${base.size} packages`);
console.log(
  '\napproach | JS gzip KB | CSS gzip KB (page) | own CSS raw KB | own CSS gzip KB | style rules | classes | build s | extra packages | extra MB',
);
for (const a of approaches) {
  const full = build(a, false);
  const own = build(a, true);
  const s = cssStats(own.cssText);
  const d = deps[a]!;
  console.log(
    [
      a,
      kb(full.jsGz),
      kb(full.cssGz),
      kb(own.css),
      kb(own.cssGz),
      s.rules,
      s.classes,
      (full.ms / 1000).toFixed(2),
      d.count,
      d.mb,
    ].join(' | '),
  );
}
