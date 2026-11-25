#!/usr/bin/env node
// Clean-install smoke test. Packs @monoline/css and @monoline/react, installs the tarballs (not workspace links)
// into a fresh temp dir with React 18 and React 19, then builds the Vite starter and server-renders from
// both the ESM and CJS entry points and type-checks both under Node16 resolution.  Needs a prior `npm run build` and network access to the npm registry.
//   node scripts/install-smoke/run.ts [--react 18|19] [--starter vite|next|astro|react-router]   (default: all)
// Next.js App Router needs React 19, so that starter only runs against 19.
import {spawnSync} from 'node:child_process';
import {cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname);
const arg = process.argv.indexOf('--react');
const majors = arg > 0 ? [process.argv[arg + 1]] : ['18', '19'];
const sArg = process.argv.indexOf('--starter');
const STARTERS: Record<string, string[]> = {
  vite: ['18', '19'],
  next: ['19'],
  astro: ['18', '19'],
  'react-router': ['18', '19'],
};
const starters = sArg > 0 ? [process.argv[sArg + 1]] : Object.keys(STARTERS);
for (const st of starters)
  if (!STARTERS[st]) {
    console.error(`unknown starter ${st}`);
    process.exit(2);
  }
for (const m of majors)
  if (!['18', '19'].includes(m)) {
    console.error('--react takes 18 or 19');
    process.exit(2);
  }
if (!existsSync(join(root, 'packages/react/dist/index.js'))) {
  console.error('Build first: npm run build');
  process.exit(2);
}

const work = mkdtempSync(join(tmpdir(), 'monoline-smoke-'));
const cache = join(work, 'npm-cache');
const sh = (cmd: string, args: string[], cwd: string) => {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: {...process.env, npm_config_cache: cache, npm_config_update_notifier: 'false'},
  });
  if (r.status !== 0) {
    process.stderr.write(`${r.stdout}${r.stderr}`);
    throw new Error(`failed: ${cmd} ${args.join(' ')}`);
  }
  return r.stdout;
};

// The two packages a consumer installs, packed exactly as npm would publish them.
const tarballs = ['css', 'react'].map((p) => {
  const out = JSON.parse(sh('npm', ['pack', '--json', '--pack-destination', work], join(root, 'packages', p)));
  return join(work, out[0].filename);
});

// Server render of the built entry points. A bare `require`/`import` of the package must not touch window.
const ssr = `
import {createRequire} from 'node:module';
import {renderToString} from 'react-dom/server';
import {createElement as h} from 'react';
import * as esm from '@monoline/react';
const cjs = createRequire(import.meta.url)('@monoline/react');
for (const [name, m] of [['esm', esm], ['cjs', cjs]]) {
  const html = renderToString(h(m.Dialog, null, h(m.DialogTrigger, {asChild: true}, h(m.Button, {variant: 'solid'}, 'Open'))));
  if (!/<button[^>]*class="[^"]*btn/.test(html) || !html.includes('Open')) throw new Error(name + ' render lost the Button: ' + html);
  console.log('ssr ok (' + name + '):', html.length, 'bytes');
}
`;

let failed = false;
for (const [starter, major] of starters.flatMap((st) =>
  majors.filter((m) => STARTERS[st].includes(m)).map((m) => [st, m]),
)) {
  const dir = join(work, `${starter}-react${major}`);
  try {
    cpSync(join(root, 'examples/starters', starter), dir, {
      recursive: true,
      filter: (s) => !/node_modules|\/dist$/.test(s),
    });
    const pkgFile = join(dir, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
    Object.assign(pkg.dependencies, {react: `^${major}`, 'react-dom': `^${major}`});
    Object.assign(pkg.devDependencies, {'@types/react': `^${major}`, '@types/react-dom': `^${major}`});
    for (const t of tarballs) pkg.dependencies[t.includes('-css-') ? '@monoline/css' : '@monoline/react'] = `file:${t}`;
    writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
    sh('npm', ['install', '--no-audit', '--no-fund'], dir);
    const installed = JSON.parse(readFileSync(join(dir, 'node_modules/react/package.json'), 'utf8')).version;
    if (!installed.startsWith(`${major}.`)) throw new Error(`wanted React ${major}, got ${installed}`);
    sh('npm', ['run', 'build'], dir); // each starter's own build, with type checking where it has one
    writeFileSync(join(dir, 'ssr.mjs'), ssr);
    console.log(sh('node', ['ssr.mjs'], dir).trim());
    // Node16/NodeNext resolution of the installed tarball: CommonJS (.cts) and ESM (.mts) must both get real types.
    console.log(sh('node', [join(root, 'scripts/check-package-types.ts'), '--project', dir], root).trim());
    console.log(`PASS ${starter} react ${installed}\n`);
  } catch (e) {
    failed = true;
    console.error(`FAIL ${starter} react ${major}: ${(e as Error).message}\n`);
  }
}
if (process.env.KEEP_SMOKE_DIR) console.log(`kept ${work}`);
else rmSync(work, {recursive: true, force: true});
process.exit(failed ? 1 : 0);
