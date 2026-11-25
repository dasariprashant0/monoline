// Emits dist/cjs/**/*.d.cts from dist/**/*.d.ts so Node16/NodeNext CommonJS consumers get types for the require entry.
// Relative specifiers are rewritten to the .cjs files next to them ('./button' -> './button.cjs'), which TypeScript
// maps to the neighbouring .d.cts. The ESM .d.ts files get explicit '.js' specifiers in place, because Node16 ESM
// does not resolve extensionless relative imports (the whole export list would silently vanish).
// Runs after `vite build` (see the build script).
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {pkgRoot} from './lib.ts';

const dist = join(pkgRoot, 'dist');
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return n === 'cjs' ? [] : statSync(p).isDirectory() ? walk(p) : p.endsWith('.d.ts') ? [p] : [];
  });

// Rewrites each relative specifier to an explicit one ending in `ext` ('.js' or '.cjs').
const rewrite = (file: string, ext: string) =>
  readFileSync(file, 'utf8').replace(
    /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g,
    (_m, pre: string, q: string, spec: string) => {
      const target = join(dirname(file), spec);
      const next = existsSync(`${target}.d.ts`)
        ? `${spec}${ext}`
        : existsSync(join(target, 'index.d.ts'))
          ? `${spec.replace(/\/$/, '')}/index${ext}`
          : null;
      if (!next) throw new Error(`${relative(pkgRoot, file)}: cannot resolve ${spec}`);
      return `${pre}${q}${next}${q}`;
    },
  );

let count = 0;
const files = walk(dist);
const cjs = files.map((file) => [file, rewrite(file, '.cjs')]);
for (const file of files) writeFileSync(file, rewrite(file, '.js'));
for (const [file, text] of cjs) {
  const out = join(dist, 'cjs', relative(dist, file).replace(/\.d\.ts$/, '.d.cts'));
  mkdirSync(dirname(out), {recursive: true});
  writeFileSync(out, text);
  count++;
}
console.log(`emit-cts: ${count} .d.cts files in dist/cjs`);
