#!/usr/bin/env node
// Type-resolution check for @monoline/react under Node16/NodeNext: a CommonJS file (.cts) and an ES module (.mts)
// must each get real types, not `any`. Needs a prior `npm run build`.
//   node scripts/check-package-types.mjs                     link packages/react into a temp project and check it
//   node scripts/check-package-types.mjs --project <dir>     check the copy installed in <dir>/node_modules (used by install-smoke)
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const i = process.argv.indexOf('--project');
let dir = i > 0 ? resolve(process.argv[i + 1]) : null;
const temp = !dir;
if (temp) {
  if (!existsSync(join(root, 'packages/react/dist/cjs/index.d.cts'))) { console.error('check-package-types: no dist/cjs/index.d.cts (run npm run build, or the CJS types are not emitted)'); process.exit(1); }
  // Inside the repo so `react` and its types resolve from the root node_modules.
  dir = mkdtempSync(join(root, 'node_modules', '.monoline-types-'));
  mkdirSync(join(dir, 'node_modules', '@monoline'), {recursive: true});
  symlinkSync(join(root, 'packages/react'), join(dir, 'node_modules/@monoline/react'));
}
// A wrong prop must be an error and a right one must not: that proves the types are real, not `any`.
const body = (load) => `${load}
const ok: ButtonProps = {variant: 'solid'};
// @ts-expect-error variant is a string union, 42 is not in it
const bad: ButtonProps = {variant: 42};
export {ok, bad};
`;
writeFileSync(join(dir, 'cjs.cts'), body(`import type {ButtonProps} from '@monoline/react';\nimport monoline = require('@monoline/react');\nvoid monoline.Button;`));
writeFileSync(join(dir, 'esm.mts'), body(`import {Button, type ButtonProps} from '@monoline/react';\nvoid Button;`));
writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({compilerOptions: {module: 'node16', moduleResolution: 'node16', target: 'ES2022', strict: true, noEmit: true, skipLibCheck: true, jsx: 'react-jsx', types: []}, files: ['cjs.cts', 'esm.mts']}, null, 2));
const r = spawnSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', dir], {encoding: 'utf8'});
if (temp) rmSync(dir, {recursive: true, force: true});
if (r.status !== 0) { process.stderr.write(`${r.stdout}${r.stderr}`); console.error('check-package-types: FAIL'); process.exit(1); }
console.log('check-package-types: ok (node16 CJS and ESM both resolve real types)');
